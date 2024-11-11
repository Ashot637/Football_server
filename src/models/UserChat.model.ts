import { Model, Optional, DataTypes } from 'sequelize';
import sequelize from '../db';
import User from './User.model';
import Chat from './Chat';

interface UserForChatAttributes {
  id: number;
  userId: number;
  chatId?: number;
  lastSeenMessageTime?: Date;
}

interface UserForChatCreationAttributes extends Optional<UserForChatAttributes, 'id'> {}

class UserForChat
  extends Model<UserForChatAttributes, UserForChatCreationAttributes>
  implements UserForChatAttributes
{
  public id!: number;
  public userId!: number;
  public chatId?: number;
  public lastSeenMessageTime?: Date | undefined;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserForChat.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.INTEGER,
      field: 'userId',
      allowNull: false,
    },
    chatId: {
      type: DataTypes.INTEGER,
      field: 'chatId',
      allowNull: false,
    },
    lastSeenMessageTime: { type: DataTypes.DATE },
  },
  {
    sequelize,
    modelName: 'UserForChat',
  },
);

export default UserForChat;
