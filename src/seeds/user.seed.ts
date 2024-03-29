import { User } from '../models';

const users = [
  {
    name: 'Test user',
    phone: '+37412345678',
    password: '$2a$10$Fka9aPUVeztw0RA2FL9SfO3/MVA3UDVTKpqkHmmjW3ikGHOhVWv2e',
    role: 'USER',
  },
  {
    name: 'Admin',
    phone: '+37499887766',
    password: '$2a$10$Fka9aPUVeztw0RA2FL9SfO3/MVA3UDVTKpqkHmmjW3ikGHOhVWv2e',
    role: 'ADMIN',
  },
] as User[];

export default () => {
  for (const item of users) {
    User.create(item);
  }
};
