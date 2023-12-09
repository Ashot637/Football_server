import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import sequelize from './src/db';
import bodyParser from 'body-parser';
import errorHandler from './src/middlewares/errorHandler';
import { GameRouter, StadionRouter, UserRouter } from './src/routes';

const app = express();
app.use(bodyParser.json());

app.use('/api/v2/', UserRouter);
app.use('/api/v2/', StadionRouter);
app.use('/api/v2/', GameRouter);

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
