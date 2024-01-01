import { User } from '../models';

const users = [
  {
    name: 'User',
    phone: '111',
    email: 'user@gmail.com',
    address: 'User street',
    role: 'USER',
  },
  {
    name: 'User2',
    phone: '222',
    email: 'user@gmail.com',
    address: 'User street',
    role: 'USER',
  },
  {
    name: 'User3',
    phone: '333',
    email: 'user@gmail.com',
    address: 'User street',
    role: 'USER',
  },
  {
    name: 'User4',
    phone: '444',
    email: 'user@gmail.com',
    address: 'User street',
    role: 'USER',
  },
  {
    name: 'Admin',
    phone: '222',
    email: 'admin@gmail.com',
    address: 'Admin street',
    role: 'ADMIN',
  },
] as User[];

export default () => {
  for (const item of users) {
    User.create(item);
  }
};
