import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';
import Stadion from './Stadion.model';

interface GameAttributes {
  id: number;
  startTime: Date;
  endTime: Date;
  playersCount?: number;
  maxPlayersCount: number;
  stadionId: number;
}

interface GameCreationAttributes extends Optional<GameAttributes, 'id'> {}

class Game extends Model<GameAttributes, GameCreationAttributes> implements GameAttributes {
  public id!: number;
  public startTime!: Date;
  public endTime!: Date;
  public playersCount?: number;
  public maxPlayersCount!: number;
  public stadionId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Game.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    startTime: { type: DataTypes.DATE },
    endTime: { type: DataTypes.DATE },
    playersCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    maxPlayersCount: { type: DataTypes.INTEGER },
    stadionId: { type: DataTypes.INTEGER },
  },
  {
    sequelize,
    modelName: 'Game',
  },
);

export default Game;
