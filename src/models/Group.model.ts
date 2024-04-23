import { Model, Optional, DataTypes } from "sequelize";
import sequelize from "../db";

interface GroupAttributes {
  id: number;
  title: string;
  ownerId: number;
  lastMessageTimestamp?: Date;
}

interface GroupCreationAttributes extends Optional<GroupAttributes, "id"> {}

class Group
  extends Model<GroupAttributes, GroupCreationAttributes>
  implements GroupAttributes
{
  public id!: number;
  public title!: string;
  public ownerId!: number;
  public lastMessageTimestamp?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Group.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    lastMessageTimestamp: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: "Group",
  }
);

export default Group;
