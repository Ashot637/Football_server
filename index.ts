import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import sequelize from './src/db';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import fileUpload from 'express-fileupload';
import errorHandler from './src/middlewares/errorHandler';
import { GameRouter, StadionRouter, UserRouter, FacilitieRouter } from './src/routes';

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.resolve(__dirname, 'src', 'static')));
app.use(fileUpload({}));

app.use('/api/v2/', UserRouter);
app.use('/api/v2/', StadionRouter);
app.use('/api/v2/', GameRouter);
app.use('/api/v2/', FacilitieRouter);

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

// import seedAll from './src/seeds';
// seedAll();
