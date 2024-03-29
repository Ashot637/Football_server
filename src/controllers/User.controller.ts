import { Game, Invitation, Stadion, User, UserGame } from '../models';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { ROLES } from '../types/Roles';
import type { RequestWithUser } from '../types/RequestWithUser';
import { generateCode } from '../helpers/generateCode';
import * as uuid from 'uuid';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';

interface RegisterRequest {
  name: string;
  phone: string;
  password: string;
  expoPushToken: string;
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
    const { phone, password, expoPushToken } = req.body;

    const user = await User.findOne({
      where: { phone },
    });
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

    user.expoPushToken = expoPushToken;
    user.save();

    return res.send({ ...user.dataValues, accessToken });
  } catch (error) {
    next(error);
  }
};

const checkPhone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, expoPushToken } = req.body;

    const user = await User.findOne({
      where: { phone },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'INVALID_PHONE' });
    }

    user.expoPushToken = expoPushToken;
    user.save();

    const code = generateCode();

    usersToVerify[phone] = code;
    console.log('====================================');
    console.log(usersToVerify);
    console.log('====================================');

    return res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

const checkCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, code } = req.body;

    if (code === '1234') {
      return res.send({ success: true });
    }
    return res.status(401).json({ success: false, message: 'INVALID_CODE' });
  } catch (error) {
    next(error);
  }
};

const generateUserCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;
    const code = generateCode();

    usersToVerify[phone] = code;

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

const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, code, password } = req.body;

    if (1234 !== +code) {
      return res.status(400).json({ success: false, message: 'INVALID_CODE' });
    }

    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    user.password = passwordHash;
    await user.save();

    delete usersToVerify[phone];

    const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.SECRET_KEY!, {
      expiresIn: '7d',
    });

    return res.send({ ...user.dataValues, accessToken });
  } catch (error) {
    next(error);
  }
};

interface CodeRequest {
  phone: string;
  code: string;
  name: string;
  password: string;
  expoPushToken: string;
  ip: string;
}

const code = async (req: Request<{}, {}, CodeRequest>, res: Response, next: NextFunction) => {
  try {
    const { phone, code, name, password, expoPushToken, ip } = req.body;
    let { language } = req.query;

    language = language || 'am';

    if (!usersToVerify[phone]) {
      return res.status(400).json({ success: false });
    }

    // if (usersToVerify[phone] === +code) {
    if (1234 === +code) {
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        ip,
        phone,
        name,
        expoPushToken,
        password: passwordHash,
        role: ROLES.USER,
      });

      if (!user) {
        return;
      }

      const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.SECRET_KEY!, {
        expiresIn: '7d',
      });

      delete usersToVerify[phone];

      let invitations = await Invitation.findAll({
        where: {
          ip,
        },
      });

      const ids = invitations.map((x) => x.groupId);

      const games = await Game.findAll({
        where: {
          groupId: ids,
          startTime: {
            [Op.gt]: new Date(),
          },
        },
        include: [
          {
            model: Stadion,
            as: 'stadion',
            attributes: [[`title_${language}`, `title`]],
          },
        ],
      });

      if (games?.length) {
        invitations = invitations.map((invitation) => {
          const game = games.find((game) => game.groupId === invitation.groupId) as Game & {
            dataValues: { stadion: { dataValues: { title: string } } };
            startTime: string;
          };
          return {
            ...invitation.dataValues,
            stadion: game.dataValues.stadion.dataValues.title,
            startTime: game.startTime,
          };
        }) as unknown as (Invitation & { stadion: string; startTime: string })[];
      }

      if (!games?.length) {
        invitations = [];
      }

      return res.send({ ...user.dataValues, accessToken, invitations });
    }
    return res.status(400).json({ success: false, message: 'INVALID_CODE' });
  } catch (error) {
    next(error);
  }
};

const authMe = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id, role } = req.user;
    if (role === ROLES.ADMIN) {
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.SECRET_KEY!, {
        expiresIn: '7d',
      });

      return res.send({ ...user.dataValues, accessToken });
    }
    const { expoPushToken, ip, language } = req.query;

    await User.update(
      { expoPushToken: expoPushToken as string, ip: ip as string },
      { where: { id } },
    );

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.SECRET_KEY!, {
      expiresIn: '7d',
    });

    let invitations = await Invitation.findAll({
      where: {
        ip: user.ip,
      },
    });

    const ids = invitations.map((x) => x.groupId);

    const games = await Game.findAll({
      where: {
        groupId: ids,
        startTime: {
          [Op.gt]: new Date(),
        },
      },
      include: [
        {
          model: Stadion,
          as: 'stadion',
          attributes: [[`title_${language}`, `title`]],
        },
      ],
    });

    if (games?.length) {
      invitations = invitations.map((invitation) => {
        const game = games.find((game) => game.groupId === invitation.groupId) as Game & {
          dataValues: { stadion: { dataValues: { title: string } } };
          startTime: string;
        };
        return {
          ...invitation.dataValues,
          stadion: game.dataValues.stadion.dataValues.title,
          startTime: game.startTime,
        };
      }) as unknown as (Invitation & { stadion: string; startTime: string })[];
    }

    res.send({ ...user.dataValues, accessToken, invitations });
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

const logout = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id } = req.user;

    User.update(
      {
        expoPushToken: '',
      },
      { where: { id } },
    );
    res.send({ success: true });
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

    await User.destroy({
      where: {
        id: userId,
      },
    });

    const userGames = await UserGame.findAll({
      where: {
        userId,
      },
    });

    if (userGames?.length) {
      const gameIds = userGames.map((userGame) => userGame.gameId);

      const games = await Game.findAll({
        where: {
          id: gameIds,
        },
      });

      for (const game of games) {
        game.decrement('playersCount', { by: 1 });
      }
    }

    await UserGame.destroy({
      where: {
        userId,
      },
    });

    return res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

// const updateStatus = async (req: RequestWithUser, res: Response, next: NextFunction) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ success: false, message: 'Not authenticated' });
//     }
//     const { id } = req.user;
//     const { isOrganizer } = req.body;

//     await User.update(
//       {
//         isOrganizer,
//       },
//       { where: { id } },
//     );
//     return res.send({ success: true });
//   } catch (error) {
//     next(error);
//   }
// };

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
  logout,
  remove,
  checkPhone,
  checkCode,
  changePassword,
  // updateStatus,
};
