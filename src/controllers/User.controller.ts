import { Game, Guest, Stadion, User, UserGame } from '../models';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { ROLES } from '../types/Roles';
import type { RequestWithUser } from '../types/RequestWithUser';
import { generateCode } from '../helpers/generateCode';
import * as uuid from 'uuid';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

interface RegisterRequest {
  name: string;
  phone: string;
  password: string;
}

const usersToVerify: Record<string, number> = {};

const register = async (
  req: Request<{}, {}, RegisterRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, phone } = req.body;
    const condidate = await User.findOne({ where: { phone } });

    if (condidate) {
      return res.status(400).json({ success: false, message: 'PHONE_IN_USE' });
    }

    return res.send({ success: true, phone, name });
  } catch (error) {
    next(error);
  }
};

const login = async (req: Request<{}, {}, RegisterRequest>, res: Response, next: NextFunction) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'INVALID_PHONE_OR_PASWORD' });
    }

    const comparePassword = bcrypt.compareSync(password, user.password);
    if (!comparePassword) {
      return res.status(500).json({ success: false, message: 'INVALID_PHONE_OR_PASWORD' });
    }

    const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.SECRET_KEY!, {
      expiresIn: '7d',
    });

    return res.send({ ...user.dataValues, accessToken });
  } catch (error) {
    next(error);
  }
};

const generateUserCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;
    const code = generateCode();

    usersToVerify[phone] = code;

    console.log('====================================');
    console.log(usersToVerify);
    console.log('====================================');
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const regenerateUserCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;
    const code = generateCode();

    usersToVerify[phone] = code;

    console.log('====================================');
    console.log(usersToVerify);
    console.log('====================================');
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

interface CodeRequest {
  phone: string;
  code: string;
  name: string;
  password: string;
}

const code = async (req: Request<{}, {}, CodeRequest>, res: Response, next: NextFunction) => {
  try {
    const { phone, code, name, password } = req.body;

    if (!usersToVerify[phone]) {
      return res.status(400).json({ success: false });
    }

    // if (usersToVerify[phone] === +code) {
    if (1234 === +code) {
      const passwordHash = await bcrypt.hash(password, 10);
      let user = await User.create({
        phone,
        name,
        password: passwordHash,
        role: ROLES.USER,
      });

      const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.SECRET_KEY!, {
        expiresIn: '7d',
      });

      delete usersToVerify[phone];

      return res.send({ ...user.dataValues, accessToken });
    }
    return res.status(401).json({ success: false, message: 'INVALID_CODE' });
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

const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.findAll();

    res.send(users);
  } catch (error) {
    next(error);
  }
};

const update = async (req: RequestWithUser, res: Response, next: NextFunction) => {
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

const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({
      where: { id },
      include: [
        {
          model: Game,
          as: 'games',
          include: [{ model: Stadion, as: 'stadion' }],
          order: [
            ['startTime', 'DESC'],
            ['playersCount', 'DESC'],
          ],
        },
      ],
    });

    res.send(user);
  } catch (error) {
    next(error);
  }
};

const remove = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;

    const userGames = await Game.findAll({
      include: [
        {
          model: User,
          as: 'users',
          through: { attributes: [], where: { userId } },
        },
      ],
    });

    for (const game of userGames) {
      const userGuests = await Guest.count({ where: { userId, gameId: game.id } });
      game.decrement('playersCount', { by: 1 + userGuests });
    }

    User.destroy({
      where: {
        id: userId,
      },
    });

    UserGame.destroy({
      where: {
        userId,
      },
    });

    Guest.destroy({
      where: {
        userId,
      },
    });

    res.send({ success: true });
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
  getOne,
  generateUserCode,
  regenerateUserCode,
  remove,
};
