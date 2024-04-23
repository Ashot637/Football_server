import { Model, Optional, DataTypes } from "sequelize";
import sequelize from "../db";

interface InvitationAttributes {
  id: number;
  ip: string;
  from: string;
  groupId: number;
  isGroup: boolean;
}

interface InvitationCreationAttributes
  extends Optional<InvitationAttributes, "id"> {}

class Invitation
  extends Model<InvitationAttributes, InvitationCreationAttributes>
  implements InvitationAttributes
{
  public id!: number;
  public ip!: string;
  public from!: string;
  public groupId!: number;
  public isGroup!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Invitation.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ip: { type: DataTypes.STRING, allowNull: false },
    from: { type: DataTypes.STRING, allowNull: false },
    groupId: { type: DataTypes.INTEGER, allowNull: false },
    isGroup: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    modelName: "Invitation",
  }
);

export default Invitation;
