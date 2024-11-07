import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db';

interface ChatAttributes {
  id: number;
  forPublic?: boolean;
  lastMessageTimestamp?: Date;
}

interface ChatCreationAttributes extends Optional<ChatAttributes, 'id'> {}

class Chat extends Model<ChatAttributes, ChatCreationAttributes> implements ChatAttributes {
  public id!: number;
  public forPublic!: boolean;
  public lastMessageTimestamp!: Date;
}

Chat.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    forPublic: { type: DataTypes.BOOLEAN, allowNull: true },
    lastMessageTimestamp: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Chat',
    tableName: 'Chats',
  },
);

export default Chat;
