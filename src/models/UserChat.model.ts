import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';
import User from './User.model';
import Chat from './Chat';

interface UserChatAttributes {
  id: number;
  userId: number;
  chatId?: number;
  lastSeenMessageTime?: Date;
}

interface UserChatCreationAttributes extends Optional<UserChatAttributes, 'id'> {}

class UserChat
  extends Model<UserChatAttributes, UserChatCreationAttributes>
  implements UserChatAttributes
{
  public id!: number;
  public userId!: number;
  public chatId?: number;
  public lastSeenMessageTime?: Date | undefined;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserChat.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.INTEGER,
      field: 'userId',
      references: { model: User, key: 'id' },
      allowNull: false,
    },
    chatId: {
      type: DataTypes.INTEGER,
      field: 'chatId',
      references: { model: Chat, key: 'id' },
      allowNull: false,
    },
    lastSeenMessageTime: { type: DataTypes.DATE },
  },
  {
    sequelize,
    modelName: 'UserChat',
  },
);

export default UserChat;
