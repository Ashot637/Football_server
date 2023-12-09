import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import sequelize from './src/db';
import bodyParser from 'body-parser';
import errorHandler from './src/middlewares/errorHandler';
import { UserRouter } from './src/routes';

const app = express();
app.use(bodyParser.json());

app.use('/api/v2/', UserRouter);

app.use(errorHandler);

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(process.env.PORT || 8080, () => console.log('Server OK'));
  } catch (e) {
    console.log(e);
  }
};

start();
