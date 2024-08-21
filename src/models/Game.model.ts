import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';
import User from './User.model';
import UserGame from './UserGame.model'; // Убедитесь, что импортируете UserGame

interface GameAttributes {
  id: number;
  price: number;
  startTime: Date;
  endTime: Date;
  maxPlayersCount: number;
  stadionId: number;
  isPublic?: boolean;
  groupId: number;
  uuid: string;
  creatorId?: number;
  isReplaying?: boolean;
}

interface GameCreationAttributes extends Optional<GameAttributes, 'id'> {}

class Game extends Model<GameAttributes, GameCreationAttributes> implements GameAttributes {
  public id!: number;
  public price!: number;
  public startTime!: Date;
  public endTime!: Date;
  public maxPlayersCount!: number;
  public stadionId!: number;
  public isPublic!: boolean;
  public groupId!: number;
  public uuid!: string;
  public creatorId?: number;
  public isReplaying?: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public users!: User[]; // Убедитесь, что тип корректен
}

Game.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    price: { type: DataTypes.INTEGER },
    startTime: { type: DataTypes.DATE },
    endTime: { type: DataTypes.DATE },
    maxPlayersCount: { type: DataTypes.INTEGER },
    stadionId: { type: DataTypes.INTEGER },
    isPublic: { type: DataTypes.BOOLEAN, defaultValue: true },
    isReplaying: { type: DataTypes.BOOLEAN, defaultValue: false },
    uuid: { type: DataTypes.STRING, defaultValue: '' },
    groupId: { type: DataTypes.INTEGER },
    creatorId: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    sequelize,
    modelName: 'Game',
  },
);

export default Game;
