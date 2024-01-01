import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';

interface GameAttributes {
  id: number;
  price: number;
  startTime: Date;
  endTime: Date;
  playersCount?: number;
  playersCountFirstGroup?: number;
  playersCountSecondGroup?: number;
  maxPlayersCount: number;
  uniformsFirstGroup?: number[];
  uniformsSecondGroup?: number[];
  stadionId: number;
}

interface GameCreationAttributes extends Optional<GameAttributes, 'id'> {}

class Game extends Model<GameAttributes, GameCreationAttributes> implements GameAttributes {
  public id!: number;
  public price!: number;
  public startTime!: Date;
  public endTime!: Date;
  public playersCount?: number;
  public playersCountFirstGroup?: number;
  public playersCountSecondGroup?: number;
  public maxPlayersCount!: number;
  public uniformsFirstGroup?: number[];
  public uniformsSecondGroup?: number[];
  public stadionId!: number;

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
    playersCountFirstGroup: { type: DataTypes.INTEGER, defaultValue: 0 },
    playersCountSecondGroup: { type: DataTypes.INTEGER, defaultValue: 0 },
    maxPlayersCount: { type: DataTypes.INTEGER },
    uniformsFirstGroup: { type: DataTypes.ARRAY(DataTypes.INTEGER), defaultValue: [0, 0, 0, 0] },
    uniformsSecondGroup: { type: DataTypes.ARRAY(DataTypes.INTEGER), defaultValue: [0, 0, 0, 0] },
    stadionId: { type: DataTypes.INTEGER },
  },
  {
    sequelize,
    modelName: 'Game',
  },
);

export default Game;
