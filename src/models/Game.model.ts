import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';

interface GameAttributes {
  id: number;
  startTime: Date;
  endTime: Date;
  playersCount: number;
  maxPlayersCount: number;
}

interface GameCreationAttributes extends Optional<GameAttributes, 'id'> {}

export default class Game
  extends Model<GameAttributes, GameCreationAttributes>
  implements GameAttributes
{
  public id!: number;
  public startTime!: Date;
  public endTime!: Date;
  public playersCount!: number;
  public maxPlayersCount!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Game.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    startTime: { type: DataTypes.DATE },
    endTime: { type: DataTypes.DATE },
    playersCount: { type: DataTypes.INTEGER },
    maxPlayersCount: { type: DataTypes.INTEGER },
  },
  {
    sequelize,
    modelName: 'Game',
  },
);
