import { Model, Optional, DataTypes } from "sequelize";
import sequelize from "../db";
import { INVITATION_TYPES } from "./Invitation.model";

interface NotificationAttributes {
  id: number;
  gameId?: number;
  userId: number;
  isNew?: boolean;
  groupId?: number;
  type?: INVITATION_TYPES;
  disabled?: boolean;
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
  public groupId?: number;
  public disabled?: boolean;

  public type?: INVITATION_TYPES;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    gameId: { type: DataTypes.INTEGER, allowNull: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    isNew: { type: DataTypes.BOOLEAN, defaultValue: true },
    groupId: { type: DataTypes.INTEGER, allowNull: true },
    disabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    type: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    modelName: "Notification",
  }
);

export default Notification;
