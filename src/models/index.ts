import User from './User.model';
import Game from './Game.model';
import Stadion from './Stadion.model';
import UserGame from './UserGame.model';
import Facilitie from './Facilitie.model';
import StadionFacilitie from './StadionFacilitie.model';
import Group from './Group.model';
import Message from './Message.model';
import UserGroup from './UserGroup.model';
import MessageLikes from './MessageLikes.model';
import Invitation from './Invitation.model';

Stadion.hasMany(Game, { foreignKey: 'stadionId' });
Game.belongsTo(Stadion, { as: 'stadion', foreignKey: 'stadionId' });

User.belongsToMany(Game, { through: UserGame, foreignKey: 'userId', as: 'games' });
Game.belongsToMany(User, { through: UserGame, foreignKey: 'gameId', as: 'users' });

Stadion.belongsToMany(Facilitie, {
  through: StadionFacilitie,
  foreignKey: 'stadionId',
  as: 'facilities',
});
Facilitie.belongsToMany(Stadion, {
  through: StadionFacilitie,
  foreignKey: 'facilitieId',
  as: 'stadions',
});

Game.hasMany(Invitation, { as: 'invitations', foreignKey: 'gameId' });
Invitation.belongsTo(Game, { as: 'game', foreignKey: 'gameId' });

// User.hasMany(Invitation, { as: 'invitations', foreignKey: 'ip', sourceKey: 'ip' });
// Invitation.belongsTo(User, { as: 'user', foreignKey: 'ip', targetKey: 'ip' });

// Messages

Group.hasMany(Game, { as: 'game', foreignKey: 'groupId' });
Game.belongsTo(Group, { as: 'group', foreignKey: 'groupId' });

Group.belongsToMany(User, { through: UserGroup, foreignKey: 'groupId' });
User.belongsToMany(Group, { through: UserGroup, foreignKey: 'userId' });

Group.hasMany(Message, { as: 'messages', foreignKey: 'groupId' });
Message.belongsTo(Group, { as: 'group', foreignKey: 'groupId' });

User.hasMany(Message, { as: 'messages', foreignKey: 'userId' });
Message.belongsTo(User, { as: 'user', foreignKey: 'userId' });

User.belongsToMany(Message, { through: MessageLikes, foreignKey: 'userId', as: 'userMessages' });
Message.belongsToMany(User, { through: MessageLikes, foreignKey: 'messageId', as: 'likedUsers' });

export {
  User,
  Game,
  Stadion,
  UserGame,
  Facilitie,
  Group,
  Message,
  UserGroup,
  MessageLikes,
  Invitation,
};
