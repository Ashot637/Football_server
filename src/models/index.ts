import User from './User.model';
import Game from './Game.model';
import Stadion from './Stadion.model';
import UserGame from './UserGame.model';
import Facilitie from './Facilitie.model';
import StadionFacilitie from './StadionFacilitie.model';
import Guest from './Guest.model';

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

Game.hasMany(Guest, { as: 'guests', foreignKey: 'gameId' });
Guest.belongsTo(Game, { as: 'game', foreignKey: 'gameId' });

export { User, Game, Stadion, UserGame, Facilitie, Guest };
