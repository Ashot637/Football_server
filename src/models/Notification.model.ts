import { Model, Optional, DataTypes } from "sequelize";
import sequelize from "../db";

interface NotificationAttributes {
  id: number;
  gameId?: number;
  userId: number;
  isNew?: boolean;
}

interface NotificationCreationAttributes
  extends Optional<NotificationAttributes, "id"> {}

class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public id!: number;
  public gameId?: number;
  public userId!: number;
  public isNew!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    gameId: { type: DataTypes.INTEGER, allowNull: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    isNew: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    modelName: "Notification",
  }
);

export default Notification;
