import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

interface TeamPlayerAttributes {
  id: number;
  userId: number;
  teamId: number;
  playerStatus: string;
  playerPosition: string;
}

class TeamPlayer extends Model<TeamPlayerAttributes> implements TeamPlayerAttributes {
  public id!: number;
  public userId!: number;
  public teamId!: number;
  public playerStatus!: string;
  public playerPosition!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TeamPlayer.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    teamId: { type: DataTypes.INTEGER, allowNull: false },
    playerStatus: { type: DataTypes.STRING, allowNull: false },
    playerPosition: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    modelName: 'TeamPlayer',
  },
);

export default TeamPlayer;
