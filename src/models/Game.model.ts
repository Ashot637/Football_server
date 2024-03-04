import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';

interface GameAttributes {
  id: number;
  price: number;
  startTime: Date;
  endTime: Date;
  playersCount?: number;
  maxPlayersCount: number;
  stadionId: number;
  isPublic?: boolean;
  groupId: number;
  creatorId?: number;
}

interface GameCreationAttributes extends Optional<GameAttributes, 'id'> {}

class Game extends Model<GameAttributes, GameCreationAttributes> implements GameAttributes {
  public id!: number;
  public price!: number;
  public startTime!: Date;
  public endTime!: Date;
  public playersCount?: number;
  public maxPlayersCount!: number;
  public stadionId!: number;
  public isPublic!: boolean;
  public groupId!: number;
  public creatorId?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Game.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    price: { type: DataTypes.INTEGER },
    startTime: { type: DataTypes.DATE },
    endTime: { type: DataTypes.DATE },
    playersCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    maxPlayersCount: { type: DataTypes.INTEGER },
    stadionId: { type: DataTypes.INTEGER },
    isPublic: { type: DataTypes.BOOLEAN, defaultValue: true },
    groupId: { type: DataTypes.INTEGER },
    creatorId: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    sequelize,
    modelName: 'Game',
  },
);

export default Game;
