import { Model, Optional, DataTypes } from "sequelize";
import sequelize from "../db";

interface InvitationAttributes {
  id: number;
  ip: string;
  from: string;
  groupId: number;
  gameId: number;
  isGroup: boolean;
  isGame: boolean;
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
  public gameId!: number;
  public isGroup!: boolean;
  public isGame!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Invitation.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ip: { type: DataTypes.STRING, allowNull: false },
    from: { type: DataTypes.STRING, allowNull: false },
    groupId: { type: DataTypes.INTEGER, allowNull: false },
    gameId: { type: DataTypes.INTEGER, allowNull: true },
    isGroup: { type: DataTypes.BOOLEAN, defaultValue: false },
    isGame: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    modelName: "Invitation",
  }
);

export default Invitation;
