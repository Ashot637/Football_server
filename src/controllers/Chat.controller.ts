import { Request, Response, NextFunction } from 'express';
import { type RequestWithUser } from '../types/RequestWithUser';
import { Chat, Message, User, UserChat } from '../models';
import { groupsSocket, userSockets } from '../sockets/userSockets';
import { CourierClient } from '@trycourier/courier';

const send = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { message, chatId, expoPushToken, userName } = req.body;
    const userChat = await UserChat.findOne({ where: { userId, chatId } });
    if (!userChat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }
    const userMessage = await Message.create({ text: message, chatId, userId });

    const GroupWithUsers: any = await Chat.findByPk(+chatId, {
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
        userSocket.emit('group-new-message', chatId);
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
    const associatedUser: User = await message.getUser();

    const userSocket = userSockets.get(userId);
    const messageData = {
      ...message.dataValues,
      user: {
        name: associatedUser.name,
        img: associatedUser.img,
        id: associatedUser.id,
      },
    };
    userSocket.broadcast.to(chatId).emit('new-message', messageData);

    await Chat.update({ lastMessageTimestamp: new Date() }, { where: { id: chatId } });

    UserChat.update({ lastSeenMessageTime: new Date() }, { where: { userId, chatId: +chatId } });
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
    const chat = await Chat.create({ forPublic: true, lastMessageTimestamp: new Date() });
    const { userIds } = req.body;
    console.log(
      '==========================================================================================',
    );
    console.log(userIds);
    console.log(
      '==========================================================================================',
    );

    for (const userIda of userIds) {
      const userExists = await User.findByPk(userIda);

      if (userExists) {
        await UserChat.create({
          userId: userIda,
          chatId: 5,
          lastSeenMessageTime: undefined,
        });
      } else {
        console.log(`Пользователь с id ${userIda} не существует. Запись не будет добавлена.`);
      }
    }
    return res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};
const createChat = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const chat = await Chat.create({ forPublic: true, lastMessageTimestamp: undefined });

    return res.status(201).json({ success: true, chat });
  } catch (error) {
    next(error);
  }
};
export default {
  send,
  create,
  createChat,
};
