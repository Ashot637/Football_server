import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';

interface StadionFacilitieAttributes {
  id: number;
  stadionId: number;
  facilitieId: number;
}

interface StadionFacilitieCreationAttributes extends Optional<StadionFacilitieAttributes, 'id'> {}

class StadionFacilitie
  extends Model<StadionFacilitieAttributes, StadionFacilitieCreationAttributes>
  implements StadionFacilitieAttributes
{
  public id!: number;
  public stadionId!: number;
  public facilitieId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StadionFacilitie.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    stadionId: { type: DataTypes.INTEGER, allowNull: false, field: 'stadionId' },
    facilitieId: { type: DataTypes.INTEGER, allowNull: false, field: 'facilitieId' },
  },
  {
    sequelize,
    modelName: 'StadionFacilitie',
  },
);

export default StadionFacilitie;
