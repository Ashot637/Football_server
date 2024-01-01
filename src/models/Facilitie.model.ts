import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';

interface FacilitieAttributes {
  id: number;
  title_en: string;
  title_ru: string;
  title_am: string;
  img: string;
}

interface FacilitieCreationAttributes extends Optional<FacilitieAttributes, 'id'> {}

class Facilitie
  extends Model<FacilitieAttributes, FacilitieCreationAttributes>
  implements FacilitieAttributes
{
  public id!: number;
  public title_en!: string;
  public title_ru!: string;
  public title_am!: string;
  public img!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Facilitie.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title_en: { type: DataTypes.STRING },
    title_ru: { type: DataTypes.STRING },
    title_am: { type: DataTypes.STRING },
    img: { type: DataTypes.STRING },
  },
  {
    sequelize,
    modelName: 'Facilitie',
  },
);

export default Facilitie;
