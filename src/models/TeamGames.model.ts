import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';

interface TeamGameAttributes {
  id: number;
  teamId: number;
  gameId: number;
  result?: string;
  isWinner?: boolean;
  goalsCount?: number;
  draw?: boolean;
}

interface TeamGameCreationAttributes extends Optional<TeamGameAttributes, 'id'> {}

class TeamGame
  extends Model<TeamGameAttributes, TeamGameCreationAttributes>
  implements TeamGameAttributes
{
  public id!: number;
  public teamId!: number;
  public gameId!: number;
  public result!: string;
  public isWinner!: boolean;
  public goalsCount!: number;
  public draw!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TeamGame.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    teamId: { type: DataTypes.INTEGER },
    gameId: { type: DataTypes.INTEGER },
    result: { type: DataTypes.STRING },
    isWinner: { type: DataTypes.BOOLEAN },
    goalsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    draw: { type: DataTypes.BOOLEAN },
  },
  {
    sequelize,
    modelName: 'TeamGame',
  },
);

export default TeamGame;
