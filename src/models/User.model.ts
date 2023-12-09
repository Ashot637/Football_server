import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';
import { ROLES } from '../types/Roles';

interface UserAttributes {
  id: number;
  email: string;
  password: string;
  role: ROLES;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

export default class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public email!: string;
  public password!: string;
  public role!: ROLES;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: {
          msg: 'Invalid email format',
        },
      },
    },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: 'USER' },
  },
  {
    sequelize,
    modelName: 'User',
  },
);
