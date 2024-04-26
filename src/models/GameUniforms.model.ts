import { Model, Optional, DataTypes } from "sequelize";
import sequelize from "../db";

interface GameUniformsAttributes {
  id: number;
  indexes: number[];
  gameId: number;
}

interface GameUniformsCreationAttributes
  extends Optional<GameUniformsAttributes, "id"> {}

class GameUniforms
  extends Model<GameUniformsAttributes, GameUniformsCreationAttributes>
  implements GameUniformsAttributes
{
  public id!: number;
  public indexes!: number[];
  public gameId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

GameUniforms.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    indexes: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      defaultValue: [],
    },
    gameId: { type: DataTypes.INTEGER },
  },
  {
    sequelize,
    modelName: "GameUniforms",
  }
);

export default GameUniforms;
