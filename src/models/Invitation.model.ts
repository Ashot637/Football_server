import { Model, Optional, DataTypes } from "sequelize";
import sequelize from "../db";

export enum INVITATION_TYPES {
  GAME = "GAME",
  GROUP = "GROUP",
  PRIVATE_GAME = "PRIVATE_GAME",
}
interface InvitationAttributes {
  id: number;
  ip: string;
  from: string;
  groupId: number;
  gameId: number;
  type: INVITATION_TYPES;
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
  public type!: INVITATION_TYPES;

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
    type: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    modelName: "Invitation",
  }
);

export default Invitation;
