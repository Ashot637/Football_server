import dotenv from 'dotenv';
dotenv.config();

import { Server, type Socket } from 'socket.io';

import express, { type NextFunction, type Request, type Response } from 'express';
import http from 'http';
import https from 'https';
import sequelize from './src/db';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import jwt, { type GetPublicKeyOrSecret, type Secret } from 'jsonwebtoken';
import fileUpload from 'express-fileupload';
import errorHandler from './src/middlewares/errorHandler';
import {
  GameRouter,
  StadionRouter,
  UserRouter,
  FacilitieRouter,
  MessageRouter,
  GroupRouter,
} from './src/routes';
import { Invitation } from './src/models';

import { groupsSocket, userSockets } from './src/sockets/userSockets';

import DeviceDetector from 'node-device-detector';

import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

const app = express();
const server = http.createServer(app);

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.resolve(__dirname, 'src', 'static')));
app.use(express.static(path.resolve(__dirname, 'src', 'public')));
app.use(fileUpload({}));

app.set('trust proxy', true);

const detector = new DeviceDetector({
  clientIndexes: true,
  deviceIndexes: true,
  deviceAliasCode: false,
  deviceTrusted: false,
  deviceInfo: false,
  maxUserAgentSize: 500,
});
app.get('/ip', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipAddress = req.headers['x-forwarded-for'] as string;
    const { token } = req.query;

    if (!token) {
      return res.send(ipAddress);
    }

    const decoded: any = jwt.verify(
      token as string,
      process.env.SECRET_KEY as Secret | GetPublicKeyOrSecret,
    );

    if (!ipAddress || !decoded) {
      return res.status(400).json({ success: false, message: 'Invalid link' });
    }

    const invitation = await Invitation.findOne({
      where: {
        ip: ipAddress,
        groupId: decoded.groupId,
        gameId: decoded.gameId ?? 0,
        type: decoded.type,
      },
    });

    if (!invitation) {
      Invitation.create({
        ip: ipAddress,
        groupId: decoded.groupId,
        from: decoded.from ?? '',
        gameId: decoded.gameId,
        type: decoded.type,
      });
    }

    return res.redirect('https://ballhola.page.link/DtUc');
  } catch (error) {
    next(error);
  }
});
app.use('/api/v2/', UserRouter);
app.use('/api/v2/', StadionRouter);
app.use('/api/v2/', GameRouter);
app.use('/api/v2/', FacilitieRouter);
app.use('/api/v2/', MessageRouter);
app.use('/api/v2', GroupRouter);

app.use(errorHandler);

const io = new Server(server);

io.on('connection', (socket: Socket) => {
  socket.on('user-connected', (userId) => {
    userSockets.set(userId, socket);
    console.log(userId + ' Connected');
  });

  socket.on('user-disconnected', (userId) => {
    userSockets.delete(userId);
    groupsSocket.forEach((value, key) => {
      const newArr = value.filter((id: number) => +id === +userId);
      groupsSocket.set(key, newArr);
    });
    console.log(userId + ' Disconnected');
  });

  socket.on('join-group', ({ groupId, userId }) => {
    socket.join(groupId);
    console.log('joined to group' + groupId);
    if (!groupsSocket.has(groupId)) {
      groupsSocket.set(groupId, [userId]);
    } else {
      groupsSocket.set(groupId, [...groupsSocket.get(groupId), userId]);
    }
  });

  socket.on('leave-group', ({ groupId, userId }) => {
    socket.leave(groupId);
    console.log('leaved from group' + groupId);
    if (groupsSocket.has(groupId)) {
      const currentArray = groupsSocket.get(groupId);
      const newArray = currentArray.filter((id: number) => id !== userId);

      groupsSocket.set(groupId, newArray);
    }
  });

  socket.on('disconnect', () => {});
});

async function sendPushNotifications(pushTokens: string[], message: string): Promise<void> {
  // Создайте массив для сообщений
  let messages: ExpoPushMessage[] = [];

  // Пройдитесь по каждому токену
  const expo = new Expo();
  for (let pushToken of pushTokens) {
    // Проверьте, является ли это валидным Expo push токеном
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    // Создайте сообщение для каждого токена
    messages.push({
      to: pushToken,
      sound: 'default',
      body: message,
      data: { withSome: 'data' },
    });
  }

  // Разбейте сообщения на чанки
  let chunks = expo.chunkPushNotifications(messages);
  let tickets: ExpoPushTicket[] = [];

  // Отправляйте уведомления партиями
  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending push notifications', error);
    }
  }
}
const pushTokens: string[] = ['ExponentPushToken[KSlO3sLoZdSUO1slxtwBTI]'];
// список Expo push токенов
const message: string = 'Ваше уведомление пришло!';
// Пример использования

// Вызов функции
sendPushNotifications(pushTokens, message).catch((error) => {
  console.error('Error in sending push notifications', error);
});

app.post('/send-notification', async (req: Request, res: Response) => {
  const { pushTokens, message } = req.body;

  if (!pushTokens || !message) {
    return res.status(400).send('Invalid request: missing pushTokens or message');
  }

  try {
    await sendPushNotifications(pushTokens, message);
    res.status(200).send('Notifications sent successfully');
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).send('Error sending notifications');
  }
});
const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    server.listen(process.env.PORT || 8080, () => console.log('Server OK'));
  } catch (e) {
    console.log(e);
  }
};

// Создайте экземпляр Expo SDK

// Функция для отправки push-уведомлений

start();

// async function clearDatabase() {
//   try {
//     await sequelize.sync({ force: true });

//     console.log('Database cleared successfully.');
//   } catch (error) {
//     console.error('Error clearing the database:', error);
//   } finally {
//     await sequelize.close();
//   }
// }

// clearDatabase();

// import seedAll from './src/seeds';
// seedAll();
