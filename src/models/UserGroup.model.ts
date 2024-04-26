import { Model, Optional, DataTypes } from "sequelize";
import sequelize from "../db";

interface UserGroupAttributes {
  id: number;
  userId: number;
  groupId: number;
  lastSeenMessageTime?: Date;
}

interface UserGroupCreationAttributes
  extends Optional<UserGroupAttributes, "id"> {}

class UserGroup
  extends Model<UserGroupAttributes, UserGroupCreationAttributes>
  implements UserGroupAttributes
{
  public id!: number;
  public userId!: number;
  public groupId!: number;
  public lastSeenMessageTime?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserGroup.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: "userId" },
    groupId: { type: DataTypes.INTEGER, allowNull: false, field: "groupId" },
    lastSeenMessageTime: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: "UserGroup",
  }
);

export default UserGroup;
