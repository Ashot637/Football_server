import { User } from '../models';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { ROLES } from '../types/Roles';
import type { RequestWithUser } from '../types/RequestWithUser';
import { generateCode } from '../helpers/generateCode';
import * as uuid from 'uuid';
import fs from 'fs';
import path from 'path';

interface RegisterRequest {
  name: string;
  phone: string;
}

let userToVerify: { name: string; phone: string; code: number };

const register = async (
  req: Request<{}, {}, RegisterRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, phone } = req.body;
    const condidate = await User.findOne({ where: { phone } });

    if (condidate) {
      return res.status(400).json({ success: false, message: 'Phone is already in use' });
    }

    const code = generateCode();

    console.log('====================================');
    console.log(code);
    console.log('====================================');

    userToVerify = { name, phone, code };
    res.send({ success: true, message: 'Enter 4 digit code', userToVerify });
  } catch (error) {
    next(error);
  }
};

const login = async (req: Request<{}, {}, RegisterRequest>, res: Response, next: NextFunction) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findOne({ where: { phone, name } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid name or phone' });
    }

    const code = generateCode();

    userToVerify = { name, phone, code };
    res.send({ success: true, message: 'Enter 4 digit code', role: user.role });
  } catch (error) {
    next(error);
  }
};

interface CodeRequest {
  code: string;
}

const code = async (req: Request<{}, {}, CodeRequest>, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;

    if (!userToVerify) {
      return res.status(400).json({ success: false });
    }

    if (+code === userToVerify.code) {
      let user = await User.findOne({
        where: { name: userToVerify.name, phone: userToVerify.phone },
      });
      if (!user) {
        user = await User.create({
          name: userToVerify.name,
          phone: userToVerify.phone,
          role: ROLES.USER,
        });
      }

      const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.SECRET_KEY!, {
        expiresIn: '7d',
      });

      return res.send({ ...user.dataValues, accessToken });
    }
    return res.status(401).json({ success: false, message: 'Invalid code' });
  } catch (error) {
    next(error);
  }
};

const authMe = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id } = req.user;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.SECRET_KEY!, {
      expiresIn: '7d',
    });

    res.send({ ...user.dataValues, accessToken });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.findAll();

    res.send(users);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id } = req.user;
    const { name, phone, email, address, prevImg } = req.body;

    let img;
    if (req.files) {
      img = (req as any).files.img;
    }

    let fileName;
    if (img) {
      const type = img.mimetype.split('/')[1];
      fileName = uuid.v4() + '.' + type;
      img.mv(path.resolve(__dirname, '..', 'static', fileName));

      if (prevImg) {
        const prevImgPath = path.resolve(__dirname, '..', 'static', prevImg);
        fs.unlink(prevImgPath, () => {});
      }
    }

    const [affectedRowsCount, [updatedUser]] = await User.update(
      {
        name,
        phone,
        email,
        address,
        img: img ? fileName : prevImg,
        role: ROLES.USER,
      },
      {
        where: {
          id,
        },
        returning: true,
      },
    );

    if (affectedRowsCount == 0) {
      return res.status(400).json({ success: false, message: 'Something went wrong' });
    }
    res.send(updatedUser);
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  authMe,
  getAll,
  code,
  update,
};
