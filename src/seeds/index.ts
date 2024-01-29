import seedFacilities from './facilitie.seed';
import seedGames from './game.seed';
import seedUsers from './user.seed';
import seedStadions from './stadion.seed';

const seedAll = () => {
  seedFacilities();
  // seedUsers();
  setTimeout(() => {
    seedStadions();
  }, 2000);
  setTimeout(() => {
    seedGames();
    console.log('Seeded successfully');
  }, 4000);
};

export default seedAll;
