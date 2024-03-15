import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';

interface UserGameAttributes {
  id: number;
  userId: number;
  gameId: number;
  willPlay?: boolean;
  uniforms: number[];
}

interface UserGameCreationAttributes extends Optional<UserGameAttributes, 'id'> {}

class UserGame
  extends Model<UserGameAttributes, UserGameCreationAttributes>
  implements UserGameAttributes
{
  public id!: number;
  public userId!: number;
  public gameId!: number;
  public willPlay?: boolean;
  public uniforms!: number[];

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserGame.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'userId' },
    gameId: { type: DataTypes.INTEGER, allowNull: false, field: 'gameId' },
    willPlay: { type: DataTypes.BOOLEAN, allowNull: true },
    uniforms: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false },
  },
  {
    sequelize,
    modelName: 'UserGame',
  },
);

export default UserGame;
