import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';

interface GroupAttributes {
  id: number;
  gameId: number;
  lastMessageTimestamp?: Date;
}

interface GroupCreationAttributes extends Optional<GroupAttributes, 'id'> {}

class Group extends Model<GroupAttributes, GroupCreationAttributes> implements GroupAttributes {
  public id!: number;
  public gameId!: number;
  public lastMessageTimestamp?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Group.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    gameId: { type: DataTypes.INTEGER, allowNull: false },
    lastMessageTimestamp: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Group',
  },
);

export default Group;
