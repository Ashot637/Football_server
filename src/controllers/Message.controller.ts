import type { NextFunction, Response } from 'express';
import { type RequestWithUser } from '../types/RequestWithUser';
import { Game, Group, Message, MessageLikes, Stadion, User, UserGame, UserGroup } from '../models';
import { groupsSocket, userSockets } from '../sockets/userSockets';
import sequelize from 'sequelize';
import { CourierClient } from '@trycourier/courier';

const getAllGroups = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { language } = req.query;

    // const userGames = await UserGame.findAll({
    //   where: {
    //     userId,
    //   },
    //   attributes: ['gameId'],
    // });

    // if (!userGames?.length) {
    //   return res.json([]);
    // }

    // const gameIds = userGames.map((userGame) => userGame.gameId);

    const userGroups = await UserGroup.findAll({
      where: {
        userId,
      },
    });

    const groupIds = [...new Set(userGroups.map((group) => group.groupId))];

    const groups = await Group.findAll({
      where: {
        id: groupIds,
      },
      include: [
        {
          model: Game,
          as: 'game',
          include: [
            {
              model: Stadion,
              as: 'stadion',
              attributes: [
                [`title_${language}`, `title`],
                [`address_${language}`, `address`],
                'title_en',
              ],
            },
          ],
        },
      ],
      attributes: [
        'id',
        'lastMessageTimestamp',
        [
          sequelize.literal(`(
            SELECT "lastSeenMessageTime" FROM "UserGroups" WHERE "userId" =  ${userId} AND "groupId" = "Group"."id"
        )`),
          'lastSeenMessageTime',
        ],
      ],
      order: [['lastMessageTimestamp', 'DESC']],
    });

    const groupsWithNewMessages = groups.map((group) => ({
      ...group.toJSON(),
      game: (group as unknown as { game: Game[] }).game[0],
      isNewMessage:
        group.dataValues.lastMessageTimestamp! >
        (group as Group & { dataValues: { lastSeenMessageTime: Date } }).dataValues
          .lastSeenMessageTime,
    }));

    return res.send(groupsWithNewMessages);
  } catch (error) {
    next(error);
  }
};

const getGroupMessages = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { groupId } = req.query;
    let { page, limit } = req.query;

    const currentPage = +page! || 1;
    const offset = (currentPage - 1) * +limit!;

    if (!groupId) {
      return res.status(404).send({ success: false, messages: 'Group not found' });
    }

    const userGroups = await UserGroup.findAll({
      where: {
        userId,
      },
    });

    const groupIds = [...new Set(userGroups.map((group) => group.groupId))];

    const groups = await Group.findAll({
      where: {
        id: groupIds,
      },
    });

    if (!groups.find((group) => group.id === +groupId)) {
      return res.status(403).json({ success: false, message: 'User dont contain in group' });
    }

    const messages = await Message.findAll({
      where: { groupId: +groupId },
      limit: +limit!,
      offset,
      attributes: ['id', 'userId', 'text', 'createdAt'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'img'],
        },
        {
          model: User,
          as: 'likedUsers',
          attributes: ['id', 'name', 'img'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.send(messages);
  } catch (error) {
    next(error);
  }
};

const send = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { text, groupId, id, userName, groupTitle } = req.body;

    const userGroups = await UserGroup.findAll({
      where: {
        userId,
      },
    });

    const groupIds = [...new Set(userGroups.map((group) => group.groupId))];

    const groups = await Group.findAll({
      where: {
        id: groupIds,
      },
    });

    if (!groups.find((group) => group.id === groupId)) {
      return res
        .status(403)
        .json({ success: false, message: "User doesn't belong to the specified group" });
    }

    const GroupWithUsers: any = await Group.findByPk(+groupId, {
      include: [{ model: Game, as: 'game', include: [{ model: User, as: 'users' }] }],
    });
    //  as Group & { dataValues: { game: Game[] & { dataValues: { users: User[] } } } };

    const users = GroupWithUsers?.dataValues.game[0].dataValues.users;

    const onlineUserIds: number[] = groupsSocket.get(groupId) || [];

    const allUserIds: number[] = users.map((u: { id: number }) => u.id);

    const oflineUsers = allUserIds.filter((id) => !onlineUserIds.includes(id));

    User.update({ hasMessage: true }, { where: { id: oflineUsers } });
    oflineUsers.forEach((id) => {
      const userSocket = userSockets.get(id);
      if (userSocket) {
        userSocket.emit('user-new-message');
        userSocket.emit('group-new-message', groupId);
      }
    });

    const usersToSend = users.reduce((acc: string[], user: User) => {
      if (user.expoPushToken) acc.push(user.expoPushToken);
      return acc;
    }, [] as string[]);

    const courier = new CourierClient({
      authorizationToken: 'pk_prod_8MCAZKDAZGM4Q2MKZ71QQVAHXZRK',
    });

    await courier.send({
      message: {
        to: {
          //@ts-ignore
          expo: {
            tokens: usersToSend,
          },
        },
        template: '992NM6VJF7MNVAHDCV54CHZQSEZH',
        data: {
          groupTitle,
          userName,
          text,
        },
      },
    });

    const message = await Message.create({
      id,
      text,
      userId,
      groupId,
    });

    //@ts-ignore
    const associatedUser: User = await message.getUser();

    const userSocket = userSockets.get(userId);

    const messageData = {
      ...message.dataValues,
      user: { name: associatedUser.dataValues.name, img: associatedUser.dataValues.img },
    };

    userSocket.broadcast.to(groupId).emit('new-message', messageData);

    Group.update(
      {
        lastMessageTimestamp: new Date(),
      },
      {
        where: { id: groupId },
      },
    );

    UserGroup.update({ lastSeenMessageTime: new Date() }, { where: { userId, groupId: +groupId } });

    return res.send(messageData);
  } catch (error) {
    next(error);
  }
};

const readGroupMessages = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { groupId } = req.body;
    UserGroup.update({ lastSeenMessageTime: new Date() }, { where: { userId, groupId: +groupId } });
    const userSocket = userSockets.get(userId);
    userSocket.broadcast.to(groupId).emit('read-message-in-group', groupId);
    return res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

const deleteMessage = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { messageId, groupId } = req.body;

    Message.destroy({
      where: {
        id: messageId,
        userId,
      },
    });

    const userSocket = userSockets.get(userId);

    userSocket.broadcast.to(groupId).emit('delete-message', messageId);

    return res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

const onReactToMessage = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { messageId, groupId, messageOwnerId, groupTitle, userName } = req.body;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'img'],
    });

    const existingReaction = await MessageLikes.findOne({
      where: { messageId, userId },
    });

    if (existingReaction) {
      existingReaction.destroy();
    } else {
      MessageLikes.create({ messageId, userId });

      const onlineUsers = groupsSocket.get(groupId);
      if (messageOwnerId !== userId) {
        const user = await User.findByPk(messageOwnerId);
        const courier = new CourierClient({
          authorizationToken: 'pk_prod_8MCAZKDAZGM4Q2MKZ71QQVAHXZRK',
        });
        await courier.send({
          message: {
            to: {
              //@ts-ignore
              expo: {
                token: user?.expoPushToken,
              },
            },
            template: '992NM6VJF7MNVAHDCV54CHZQSEZH',
            data: {
              groupTitle,
              userName,
              text: 'Liked your message',
            },
          },
        });

        if (!onlineUsers.includes(messageOwnerId)) {
          User.update({ hasMessage: true }, { where: { id: messageOwnerId } });
          const userSocket = userSockets.get(messageOwnerId);
          if (userSocket) {
            userSocket.emit('user-new-message');
            userSocket.emit('group-new-message', groupId);
          }
        }
      }
    }

    const userSocket = userSockets.get(userId);
    userSocket.broadcast.to(groupId).emit('react-to-message', { messageId, user });

    return res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

const markUserMessagesRead = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id } = req.user;

    await User.update({ hasMessage: false }, { where: { id } });

    return res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

export default {
  getAllGroups,
  getGroupMessages,
  send,
  readGroupMessages,
  deleteMessage,
  onReactToMessage,
  markUserMessagesRead,
};
