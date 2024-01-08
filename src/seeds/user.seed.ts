import { User } from '../models';

const users = [
  {
    name: 'User',
    phone: '111',
    password: '$2a$10$bj3V4hS4yclT2wrSkvWmNe9E503yYlS9Bw0PQml00RpTe3ZYweHZa',
    email: 'user@gmail.com',
    address: 'User street',
    role: 'USER',
  },
  {
    name: 'User2',
    phone: '2222',
    password: '$2a$10$tHVyxZmuBuBaUPtBYde1fOOwdUDTUIE2PcuSp8YbBMDOJyUcwoo9C',
    email: 'user@gmail.com',
    address: 'User street',
    role: 'USER',
  },
  {
    name: 'User3',
    phone: '333',
    password: '$2a$10$bj3V4hS4yclT2wrSkvWmNe9E503yYlS9Bw0PQml00RpTe3ZYweHZa',
    email: 'user@gmail.com',
    address: 'User street',
    role: 'USER',
  },
  {
    name: 'User4',
    phone: '444',
    password: '$2a$10$bj3V4hS4yclT2wrSkvWmNe9E503yYlS9Bw0PQml00RpTe3ZYweHZa',
    email: 'user@gmail.com',
    address: 'User street',
    role: 'USER',
  },
  {
    name: 'Admin',
    phone: '+222',
    password: '$2a$10$bj3V4hS4yclT2wrSkvWmNe9E503yYlS9Bw0PQml00RpTe3ZYweHZa',
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
