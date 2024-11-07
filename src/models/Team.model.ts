import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';

interface TeamAttributes {
  id: number;
  userId: number;
  name: string;
}

interface TeamCreationAttributes extends Optional<TeamAttributes, 'id'> {}

class Team extends Model<TeamAttributes, TeamCreationAttributes> implements TeamAttributes {
  public id!: number;
  public userId!: number;
  public name!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Team.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER },
    name: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    modelName: 'Team',
  },
);

export default Team;
