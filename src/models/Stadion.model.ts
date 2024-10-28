import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';

interface StadionAttributes {
  id: number;
  ownerId: number;
  title_en: string;
  title_ru: string;
  title_am: string;
  title?: string;
  address_en: string;
  address_ru: string;
  address_am: string;
  img: string;
}

interface StadionCreationAttributes extends Optional<StadionAttributes, 'id'> {}

class Stadion
  extends Model<StadionAttributes, StadionCreationAttributes>
  implements StadionAttributes
{
  public id!: number;
  public ownerId!: number;
  public title_en!: string;
  public title_ru!: string;
  public title_am!: string;
  public address_en!: string;
  public address_ru!: string;
  public address_am!: string;
  public img!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Stadion.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ownerId: { type: DataTypes.INTEGER, defaultValue: -1 },
    title_en: { type: DataTypes.STRING },
    title_ru: { type: DataTypes.STRING },
    title_am: { type: DataTypes.STRING },
    address_en: { type: DataTypes.STRING },
    address_ru: { type: DataTypes.STRING },
    address_am: { type: DataTypes.STRING },
    img: { type: DataTypes.STRING },
  },
  {
    sequelize,
    modelName: 'Stadion',
  },
);

export default Stadion;
