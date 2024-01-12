import { Game } from '../models';

const games = [
  {
    startTime: new Date(Date.now() + 1000000000),
    endTime: new Date(Date.now() + 1000000000 + 5400000),
    maxPlayersCount: 14,
    stadionId: 1,
    price: 3000,
  },
  {
    startTime: new Date(Date.now() + 1500000000),
    endTime: new Date(Date.now() + 1500000000 + 5400000),
    maxPlayersCount: 16,
    stadionId: 1,
    price: 5000,
  },
  {
    startTime: new Date(),
    endTime: new Date(),
    maxPlayersCount: 18,
    stadionId: 2,
    price: 2500,
  },
  {
    startTime: new Date(),
    endTime: new Date(),
    maxPlayersCount: 18,
    stadionId: 2,
    price: 8000,
  },
  {
    startTime: new Date(),
    endTime: new Date(),
    maxPlayersCount: 18,
    stadionId: 2,
    price: 5000,
  },
] as Game[];

export default () => {
  for (const item of games) {
    Game.create(item);
  }
};
