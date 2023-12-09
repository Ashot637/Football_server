import { User } from '../models';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import type { NextFunction, Request, Response } from 'express';
import { ROLES } from '../types/Roles';

interface RegisterRequest {
  email: string;
  password: string;
}

export const register = async (
  req: Request<{}, {}, RegisterRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    const condidate = await User.findOne({ where: { email } });

    if (condidate) {
      return res.status(400).json({ success: false, message: 'Email is already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 5);
    const user = await User.create({ email, password: passwordHash, role: ROLES.USER });

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.SECRET_KEY!,
      {
        expiresIn: '24h',
      },
    );

    const { password: userPassword, ...data } = user.dataValues;

    res.send({ ...data, accessToken });
  } catch (error) {
    next(error);
  }
};

interface LoginRequest {
  email: string;
  password: string;
}

export const login = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(500).json({ succes: false, message: 'Invalid login or password' });
    }
    const comparePassword = bcrypt.compareSync(password, user.password);
    if (!comparePassword) {
      return res.status(500).json({ succes: false, message: 'Invalid login or password' });
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.SECRET_KEY!,
      {
        expiresIn: '24h',
      },
    );

    const { password: userPassword, ...data } = user.dataValues;

    res.send({ ...data, accessToken });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
};
