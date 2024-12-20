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
import StadionNotification from './StadionNotification.model';
import GameUniforms from './GameUniforms.model';
import Notification from './Notification.model';
import Team from './Team.model';
import TeamPlayer from './TeamPlayers';
import TeamGame from './TeamGames.model';
import TeamChat from './Chat';
import UserForChat from './UserChat.model';

Stadion.hasMany(Game, { foreignKey: 'stadionId' });
Game.belongsTo(Stadion, { as: 'stadion', foreignKey: 'stadionId' });

User.belongsToMany(Game, {
  through: UserGame,
  foreignKey: 'userId',
  otherKey: 'gameId',
  as: 'games',
});
Game.belongsToMany(User, {
  through: UserGame,
  foreignKey: 'gameId',
  otherKey: 'userId',
  as: 'users',
});

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

Game.hasOne(GameUniforms, { as: 'uniforms', foreignKey: 'gameId' });
GameUniforms.belongsTo(Game, { foreignKey: 'gameId' });

Game.hasMany(StadionNotification, { foreignKey: 'gameId' });
StadionNotification.belongsTo(Game, { as: 'game', foreignKey: 'gameId' });

User.hasMany(StadionNotification, { foreignKey: 'userId' });
StadionNotification.belongsTo(User, { as: 'user', foreignKey: 'userId' });

Stadion.hasMany(StadionNotification, { foreignKey: 'stadionId' });
StadionNotification.belongsTo(Stadion, {
  as: 'stadion',
  foreignKey: 'stadionId',
});

// User.hasMany(Invitation, { as: 'invitations', foreignKey: 'ip', sourceKey: 'ip' });
// Invitation.belongsTo(User, { as: 'user', foreignKey: 'ip', targetKey: 'ip' });

User.hasMany(Notification, { as: 'notifications', foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

Game.hasMany(Notification, { foreignKey: 'gameId' });
Notification.belongsTo(Game, { as: 'game', foreignKey: 'gameId' });

Group.hasMany(Notification, { foreignKey: 'groupId' });
Notification.belongsTo(Group, { as: 'notificationGroup', foreignKey: 'groupId' });

// Messages

Group.hasMany(Game, { as: 'game', foreignKey: 'groupId' });
Game.belongsTo(Group, { as: 'gameGroup', foreignKey: 'groupId' });

Group.belongsToMany(User, { through: UserGroup, foreignKey: 'groupId' });
User.belongsToMany(Group, { through: UserGroup, foreignKey: 'userId' });

Group.hasMany(Message, { as: 'messages', foreignKey: 'groupId' });
Message.belongsTo(Group, { as: 'messageGroup', foreignKey: 'groupId' });

User.hasMany(Message, { as: 'messages', foreignKey: 'userId' });
Message.belongsTo(User, { as: 'user', foreignKey: 'userId' });

User.belongsToMany(Message, {
  through: MessageLikes,
  foreignKey: 'userId',
  as: 'userMessages',
});
Message.belongsToMany(User, {
  through: MessageLikes,
  foreignKey: 'messageId',
  as: 'likedUsers',
});

User.belongsToMany(Team, {
  as: 'team',
  foreignKey: 'userId',
  through: TeamPlayer,
});
Team.belongsToMany(User, {
  as: 'user',
  foreignKey: 'teamId',
  through: TeamPlayer,
});

TeamPlayer.belongsTo(Team, {
  as: 'team', // Алиас для использования в include
  foreignKey: 'teamId',
});

Team.hasMany(TeamPlayer, {
  as: 'teamPlayer', // Связь для обратного использования
  foreignKey: 'teamId',
});

TeamPlayer.belongsTo(User, {
  as: 'user', 
  foreignKey: 'userId',
});

User.hasMany(TeamPlayer, {
  as: 'teamPlayer', 
  foreignKey: 'userId',
});

Game.belongsToMany(Team, {
  as: 'team',
  foreignKey: 'gameId',
  through: TeamGame,
});
Team.belongsToMany(Team, {
  as: 'game',
  foreignKey: 'teamId',
  through: TeamGame,
});

TeamChat.belongsTo(Team, {
  as: 'team',
  foreignKey: 'teamId',
});
Team.hasOne(TeamChat, {
  as: 'teamChat',
  foreignKey: 'teamId',
});

TeamChat.belongsToMany(User, {
  through: UserForChat,
  foreignKey: 'chatId',
});

User.belongsToMany(TeamChat, {
  through: UserForChat,
  foreignKey: 'userId',
});

TeamChat.hasMany(Message, { foreignKey: 'chatId', as: 'message' });
Message.belongsTo(TeamChat, { foreignKey: 'chatId', as: 'teamChat' });

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
  GameUniforms,
  StadionNotification,
  Notification,
  Team,
  TeamGame,
  TeamPlayer,
  TeamChat,
  UserForChat,
};
