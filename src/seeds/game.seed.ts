import { Game, Group } from '../models';

const games = [
  {
    startTime: new Date(Date.now() + 1000000000),
    endTime: new Date(Date.now() + 1000000000 + 5400000),
    maxPlayersCount: 14,
    stadionId: 1,
    price: 3000,
    groupId: 1,
  },
  {
    startTime: new Date(Date.now() + 1500000000),
    endTime: new Date(Date.now() + 1500000000 + 5400000),
    maxPlayersCount: 16,
    stadionId: 1,
    price: 5000,
    groupId: 1,
  },
] as Game[];

export default () => {
  // Group.create({
  //   id: 1,
  // });
  // Group.create({
  //   id: 2,
  // });
  // for (const item of games) {
  //   Game.create(item);
  // }
};
