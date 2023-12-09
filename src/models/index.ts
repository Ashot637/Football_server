import User from './User.model';
import Game from './Game.model';
import Stadion from './Stadion.model';
import UserGame from './UserGame.model';

Stadion.hasMany(Game, { foreignKey: 'stadionId' });
Game.belongsTo(Stadion, { as: 'stadion', foreignKey: 'stadionId' });

User.belongsToMany(Game, { through: UserGame, foreignKey: 'userId', as: 'games' });
Game.belongsToMany(User, { through: UserGame, foreignKey: 'gameId', as: 'users' });

export { User, Game, Stadion, UserGame };
