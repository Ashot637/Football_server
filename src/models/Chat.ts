import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db';

interface TeamChatAttributes {
  id: number;
  forPublic?: boolean;
  lastMessageTimestamp?: Date;
}

interface TeamChatCreationAttributes extends Optional<TeamChatAttributes, 'id'> {}

class TeamChat
  extends Model<TeamChatAttributes, TeamChatCreationAttributes>
  implements TeamChatAttributes
{
  public id!: number;
  public forPublic!: boolean;
  public lastMessageTimestamp!: Date;
}

TeamChat.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    forPublic: { type: DataTypes.BOOLEAN, allowNull: true },
    lastMessageTimestamp: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'TeamChat',
    tableName: 'TeamChats',
  },
);

export default TeamChat;
