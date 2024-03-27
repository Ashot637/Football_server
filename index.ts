import dotenv from 'dotenv';
dotenv.config();

import { Server, type Socket } from 'socket.io';

import express, { type NextFunction, type Request, type Response } from 'express';
import http from 'http';
import sequelize from './src/db';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import jwt, { type GetPublicKeyOrSecret, type Secret } from 'jsonwebtoken';
import fileUpload from 'express-fileupload';
import errorHandler from './src/middlewares/errorHandler';
import {
  GameRouter,
  StadionRouter,
  UserRouter,
  FacilitieRouter,
  MessageRouter,
} from './src/routes';

import { groupsSocket, userSockets } from './src/sockets/userSockets';
import { Invitation } from './src/models';

const app = express();
const server = http.createServer(app);

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.resolve(__dirname, 'src', 'static')));
app.use(express.static(path.resolve(__dirname, 'src', 'public')));
app.use(fileUpload({}));

app.set('trust proxy', true);
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
      return res.status(400).json({ success: false, message: 'Ip, from or id is empty' });
    }

    const invitation = await Invitation.findOne({
      where: {
        ip: ipAddress,
        groupId: decoded.groupId,
      },
    });

    if (!invitation) {
      Invitation.create({
        ip: ipAddress,
        groupId: decoded.groupId,
        from: decoded.from,
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

app.use(errorHandler);

const io = new Server({
  path: '/socket',
});

(global as typeof globalThis & { io: Server }).io = io;

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

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    server.listen(process.env.PORT || 8080, () => console.log('Server OK'));
  } catch (e) {
    console.log(e);
  }
};

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
