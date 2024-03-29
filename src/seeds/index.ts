import seedFacilities from './facilitie.seed';
import seedGames from './game.seed';
import seedUsers from './user.seed';
import seedStadions from './stadion.seed';

const seedAll = async () => {
  seedFacilities();
  seedUsers();
  setTimeout(() => {
    seedStadions();
  }, 2000);
  console.log('Seeded successfully');
};

export default seedAll;
