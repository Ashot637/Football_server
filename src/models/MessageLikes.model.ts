import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';

interface MessageLikesAttributes {
  id: number;
  userId: number;
  messageId: number;
}

interface MessageLikesCreationAttributes extends Optional<MessageLikesAttributes, 'id'> {}

class MessageLikes
  extends Model<MessageLikesAttributes, MessageLikesCreationAttributes>
  implements MessageLikesAttributes
{
  public id!: number;
  public messageId!: number;
  public userId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MessageLikes.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'userId' },
    messageId: { type: DataTypes.BIGINT, allowNull: false, field: 'messageId' },
  },
  {
    sequelize,
    modelName: 'MessageLikes',
  },
);

export default MessageLikes;
