import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';

interface GuestAttributes {
  id: number;
  name: string;
  phone: string;
  team: number;
  gameId: number;
  userId: number;
}

interface GuestCreationAttributes extends Optional<GuestAttributes, 'id'> {}

class Guest extends Model<GuestAttributes, GuestCreationAttributes> implements GuestAttributes {
  public id!: number;
  public name!: string;
  public phone!: string;
  public team!: number;
  public gameId!: number;
  public userId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Guest.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    team: { type: DataTypes.INTEGER, allowNull: false },
    gameId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    modelName: 'Guest',
  },
);

export default Guest;
