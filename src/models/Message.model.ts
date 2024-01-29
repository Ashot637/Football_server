import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';
import User from './User.model';

interface MessageAttributes {
  id: number;
  text: string;
  groupId: number;
  userId: number;
  likedUsers?: User[];
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id'> {}

class Message
  extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes
{
  public id!: number;
  public text!: string;
  public groupId!: number;
  public userId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Message.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    text: { type: DataTypes.STRING, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    groupId: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    modelName: 'Message',
  },
);

export default Message;
