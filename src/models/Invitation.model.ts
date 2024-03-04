import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';

interface InvitationAttributes {
  id: number;
  phone: string;
  from: string;
  gameId: number;
  startTime: Date;
  stadion: string;
}

interface InvitationCreationAttributes extends Optional<InvitationAttributes, 'id'> {}

class Invitation
  extends Model<InvitationAttributes, InvitationCreationAttributes>
  implements InvitationAttributes
{
  public id!: number;
  public phone!: string;
  public from!: string;
  public gameId!: number;
  public startTime!: Date;
  public stadion!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Invitation.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    phone: { type: DataTypes.STRING, allowNull: false },
    from: { type: DataTypes.STRING, allowNull: false },
    gameId: { type: DataTypes.INTEGER, allowNull: false },
    startTime: { type: DataTypes.DATE, allowNull: false },
    stadion: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    modelName: 'Invitation',
  },
);

export default Invitation;
