import { Request, Response, NextFunction } from 'express';
import { type RequestWithUser } from '../types/RequestWithUser';
import { TeamChat, Message, User, UserForChat, TeamPlayer, MessageLikes } from '../models';
import { groupsSocket, userSockets } from '../sockets/userSockets';
import { CourierClient } from '@trycourier/courier';

const send = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { message, chatId, expoPushToken, userName } = req.body;
    const userChat = await UserForChat.findOne({ where: { userId, chatId } });
    if (!userChat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }
    const userMessage = await Message.create({ text: message, chatId, userId });

    const GroupWithUsers: any = await TeamChat.findByPk(+chatId, {
      include: [{ model: User }],
    });
    //  as Group & { dataValues: { game: Game[] & { dataValues: { users: User[] } } } };

    const users = GroupWithUsers?.Users;

    const onlineUserIds: number[] = groupsSocket.get(chatId) || [];

    const allUserIds: number[] = users.map((u: { id: number }) => u.id);

    const oflineUsers = allUserIds.filter((id) => !onlineUserIds.includes(id));

    User.update({ hasMessage: true }, { where: { id: oflineUsers } });
    oflineUsers.forEach((id) => {
      const userSocket = userSockets.get(id);
      if (userSocket) {
        userSocket.emit('user-new-message');
        userSocket.emit('chat-new-message', chatId);
      }
    });
    const usersToSend = users.reduce((acc: string[], user: User) => {
      if (user.expoPushToken === expoPushToken || !user.expoPushToken) return acc;
      acc.push(user.expoPushToken);
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
          message,
        },
      },
    });
    const messages = await Message.create({
      text: message,
      userId,
      chatId,
    });
    //@ts-ignore
    const associatedUser: User = await messages.getUser();

    const userSocket = userSockets.get(userId);
    const messageData = {
      ...message.dataValues,
      user: {
        name: associatedUser.name,
        img: associatedUser.img,
        id: associatedUser.id,
      },
    };
    if (userSocket) {
      userSocket.broadcast.to(`room_${chatId}`).emit('new-message', messageData);
    }
    await TeamChat.update({ lastMessageTimestamp: new Date() }, { where: { id: chatId } });

    UserForChat.update({ lastSeenMessageTime: new Date() }, { where: { userId, chatId: +chatId } });
    return res.send(messageData);
  } catch (error) {
    next(error);
  }
};
const create = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id } = req.user;
    const chat = await TeamChat.create({ forPublic: true, lastMessageTimestamp: new Date() });
    const { userIds } = req.body;

    for (const userIda of userIds) {
      const userExists = await User.findByPk(userIda);

      if (userExists) {
        await UserForChat.create({ userId: +userExists.id, chatId: chat.id });
      } else {
        return res.status(400).json({ success: false });
      }
    }
    return res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// const createChat = async (req: RequestWithUser, res: Response, next: NextFunction) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ success: false, message: 'Not authenticated' });
//     }
//     const { id: userId } = req.user;
//     const chat = await TeamChat.create({ forPublic: true, lastMessageTimestamp: undefined });

//     return res.status(201).json({ success: true, chat });
//   } catch (error) {
//     next(error);
//   }
// };
const readChatMessage = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { chatId } = req.body;
    UserForChat.update({ lastSeenMessageTime: new Date() }, { where: { userId, chatId: +chatId } });
    const userSocket = userSockets.get(userId);
    userSocket.broadcast.to(`room_${chatId}`).emit('read-message-in-chat', chatId);
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
    const { messageId, chatId } = req.body;

    Message.destroy({
      where: {
        id: messageId,
        userId,
      },
    });

    const userSocket = userSockets.get(userId);

    userSocket.broadcast.to(`room_${chatId}`).emit('delete-message', messageId);

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
    const { messageId, chatId, messageOwnerId, groupTitle, userName } = req.body;

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

      const onlineUsers = groupsSocket.get(chatId);
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
            userSocket.emit('chat-new-message', chatId);
          }
        }
      }
    }

    const userSocket = userSockets.get(userId);
    userSocket.broadcast.to(`room_${chatId}`).emit('react-to-message', { messageId, user });

    return res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

export default {
  send,
  create,
  readChatMessage,
  deleteMessage,
  onReactToMessage,
};
