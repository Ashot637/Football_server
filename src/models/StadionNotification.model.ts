import { Model, Optional, DataTypes } from "sequelize";
import sequelize from "../db";

interface StadionNotificationAttributes {
  id: number;
  gameId: number;
  stadionId: number;
  userId: number;
  isNew: boolean;
}

interface StadionNotificationCreationAttributes
  extends Optional<StadionNotificationAttributes, "id"> {}

class StadionNotification
  extends Model<
    StadionNotificationAttributes,
    StadionNotificationCreationAttributes
  >
  implements StadionNotificationAttributes
{
  public id!: number;
  public gameId!: number;
  public stadionId!: number;
  public userId!: number;
  public isNew!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StadionNotification.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    gameId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    stadionId: { type: DataTypes.INTEGER, allowNull: false },
    isNew: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    modelName: "StadionNotification",
  }
);

export default StadionNotification;
