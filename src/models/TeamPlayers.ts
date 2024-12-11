import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db';

interface TeamPlayerAttributes {
  id?: number;
  userId: number;
  teamId: number;
  playerStatus: string | null;
  playerPosition: string | null;
  playerNumber: number | null;
}

class TeamPlayer
  extends Model<TeamPlayerAttributes>
  implements Optional<TeamPlayerAttributes, 'id'>
{
  public id!: number;
  public userId!: number;
  public teamId!: number;
  public playerStatus!: string;
  public playerPosition!: string;
  public playerNumber!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TeamPlayer.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    teamId: { type: DataTypes.INTEGER, allowNull: false },
    playerStatus: { type: DataTypes.STRING, allowNull: true },
    playerPosition: { type: DataTypes.STRING, allowNull: true },
    playerNumber: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    modelName: 'TeamPlayer',
  },
);

export default TeamPlayer;
