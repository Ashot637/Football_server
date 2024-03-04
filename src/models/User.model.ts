import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';
import { ROLES } from '../types/Roles';

interface UserAttributes {
  id: number;
  name: string;
  phone: string;
  password: string;
  expoPushToken?: string;
  email?: string;
  address?: string;
  img?: string;
  hasMessage?: boolean;
  role: ROLES;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public phone!: string;
  public password!: string;
  public expoPushToken?: string;
  public email?: string;
  public address?: string;
  public img?: string;
  public hasMessage?: boolean;
  public role!: ROLES;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    expoPushToken: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true, defaultValue: '' },
    address: { type: DataTypes.STRING, allowNull: true, defaultValue: '' },
    img: { type: DataTypes.STRING, allowNull: true, defaultValue: '' },
    hasMessage: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    role: { type: DataTypes.STRING, defaultValue: 'USER' },
  },
  {
    sequelize,
    modelName: 'User',
  },
);

export default User;
