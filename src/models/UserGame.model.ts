import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';

interface UserGameAttributes {
  id: number;
  userId: number;
  gameId: number;
  team: number;
  uniform: number;
}

interface UserGameCreationAttributes extends Optional<UserGameAttributes, 'id'> {}

class UserGame
  extends Model<UserGameAttributes, UserGameCreationAttributes>
  implements UserGameAttributes
{
  public id!: number;
  public userId!: number;
  public gameId!: number;
  public team!: number;
  public uniform!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserGame.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'userId' },
    gameId: { type: DataTypes.INTEGER, allowNull: false, field: 'gameId' },
    team: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isIn: {
          args: [[1, 2]],
          msg: 'Team must be either 1 or 2',
        },
      },
    },
    uniform: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isIn: {
          args: [[0, 1, 2, 3]],
          msg: 'Uniform must be 0, 1, 2 or 3',
        },
      },
    },
  },
  {
    sequelize,
    modelName: 'UserGame',
  },
);

export default UserGame;
