import type { NextFunction, Request, Response } from 'express';
import { Facilitie, Game, Stadion, User, UserGame, Guest } from '../models';
import { type RequestWithUser } from '../types/RequestWithUser';
import { Op, type WhereOptions } from 'sequelize';

interface CreateRequest {
  price: number;
  startTime: Date;
  endTime: Date;
  maxPlayersCount: number;
  stadionId: number;
}

const create = async (req: Request<{}, {}, CreateRequest>, res: Response, next: NextFunction) => {
  try {
    const { price, startTime, endTime, maxPlayersCount, stadionId } = req.body;

    const game = await Game.create({
      price,
      startTime,
      endTime,
      maxPlayersCount,
      stadionId,
    });

    res.send(game);
  } catch (error) {
    next(error);
  }
};

interface GetAllRequest {
  date?: string;
  language?: 'en' | 'ru' | 'am';
}

const getAll = async (
  req: Request<{}, {}, {}, GetAllRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { date, language } = req.query;
    let WHERE: WhereOptions | undefined;
    if (date) {
      const day = new Date(date);
      const startOfDay = new Date(
        Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 0, 0, 0, 0),
      );
      const endOfDay = new Date(
        Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 23, 59, 59, 999),
      );
      WHERE = {
        where: {
          [Op.and]: [
            {
              startTime: {
                [Op.between]: [startOfDay, endOfDay],
              },
            },
            {
              startTime: {
                [Op.gt]: new Date(),
              },
            },
          ],
        },
      };
    }

    let games;
    if (language) {
      games = await Game.findAll({
        ...(date
          ? WHERE
          : {
              where: {
                startTime: {
                  [Op.gt]: new Date(),
                },
              },
            }),
        include: [
          {
            model: Stadion,
            as: 'stadion',
            attributes: [
              [`title_${language}`, `title`],
              [`address_${language}`, `address`],
              'id',
              'img',
            ],
          },
        ],
        order: [
          ['playersCount', 'DESC'],
          ['startTime', 'DESC'],
        ],
      });
    } else {
      games = await Game.findAll({
        include: [{ model: Stadion, as: 'stadion' }],
        order: [
          ['startTime', 'DESC'],
          ['playersCount', 'DESC'],
        ],
      });
    }

    res.send(games);
  } catch (error) {
    next(error);
  }
};

const getByStadionId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { language } = req.query;
    const { stadionId } = req.params;

    const games = await Game.findAll({
      where: {
        stadionId,
        startTime: {
          [Op.gt]: new Date(),
        },
      },
      include: [
        {
          model: Stadion,
          as: 'stadion',
          attributes: [
            [`title_${language}`, `title`],
            [`address_${language}`, `address`],
            'id',
            'img',
          ],
        },
      ],
      order: [
        ['playersCount', 'DESC'],
        ['startTime', 'DESC'],
      ],
    });

    res.send(games);
  } catch (error) {
    next(error);
  }
};

interface GetOneRequest {
  language?: 'en' | 'ru' | 'am';
}

const getOne = async (
  req: Request<{ id: string }, {}, {}, GetOneRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { language } = req.query;
    let game;

    if (language) {
      game = await Game.findByPk(id, {
        include: [
          {
            model: Guest,
            as: 'guests',
          },
          {
            model: Stadion,
            as: 'stadion',
            attributes: [
              [`title_${language}`, `title`],
              [`address_${language}`, `address`],
              'id',
              'img',
            ],
            include: [
              {
                model: Facilitie,
                as: 'facilities',
                attributes: [[`title_${language}`, `title`], 'id', 'img'],
              },
            ],
          },
          { model: User, as: 'users' },
        ],
      });
    } else {
      game = await Game.findByPk(id, {
        include: [
          { model: Guest, as: 'guests' },
          { model: Stadion, as: 'stadion', include: [{ model: Facilitie, as: 'facilities' }] },
          { model: User, as: 'users' },
        ],
      });
    }

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    const playersCountFirstGroup = await UserGame.count({ where: { gameId: id, team: 1 } });
    const playersCountSecondGroup = await UserGame.count({ where: { gameId: id, team: 2 } });
    const guestsCountFirstGroup = await Guest.count({ where: { gameId: id, team: 1 } });
    const guestsCountSecondGroup = await Guest.count({ where: { gameId: id, team: 2 } });

    const userGames = await UserGame.findAll({ where: { gameId: id } });

    let uniformsFirstGroup = [0, 0, 0, 0];
    let uniformsSecondGroup = [0, 0, 0, 0];

    userGames.forEach((userGame) => {
      if (userGame.team === 1) {
        uniformsFirstGroup[userGame.uniform] = ++uniformsFirstGroup[userGame.uniform];
      } else {
        uniformsSecondGroup[userGame.uniform] = ++uniformsSecondGroup[userGame.uniform];
      }
    });

    res.send({
      ...game.dataValues,
      playersCountFirstGroup: playersCountFirstGroup + guestsCountFirstGroup,
      playersCountSecondGroup: playersCountSecondGroup + guestsCountSecondGroup,
      uniformsFirstGroup,
      uniformsSecondGroup,
    });
  } catch (error) {
    next(error);
  }
};

interface RemoveRequest {
  ids: number[];
}

const remove = async (req: Request<{}, {}, RemoveRequest>, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body;

    await Game.destroy({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    });

    res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

const update = async (
  req: Request<{ id: string }, {}, CreateRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { price, startTime, endTime, maxPlayersCount, stadionId } = req.body;
    const { id } = req.params;

    const [rowsUpdated, [updatedGame]] = await Game.update(
      {
        price,
        startTime,
        endTime,
        maxPlayersCount,
        stadionId,
      },
      {
        where: {
          id: id,
        },
        returning: true,
      },
    );

    if (rowsUpdated === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json(updatedGame);
  } catch (error) {
    next(error);
  }
};

const register = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { gameId } = req.params;
    const { team, uniform, guests } = req.body;

    const game = await Game.findByPk(gameId);

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    if (game.playersCount === game.maxPlayersCount) {
      return res.status(403).json({ success: false, message: 'Already have maximum players' });
    }

    if (![1, 2].includes(team) || ![0, 1, 2, 3].includes(uniform)) {
      return res.status(404).json({ success: false, message: 'Invalid information' });
    }

    const userGame = await UserGame.create({
      userId,
      gameId: +gameId,
      team: +team,
      uniform,
    });

    let guestsArray = [];
    if (guests) {
      guestsArray = JSON.parse(guests);
      guestsArray.forEach((guest: Guest) => {
        Guest.create({ name: guest.name, phone: guest.phone, team, gameId: +gameId, userId });
      });
    }

    game.playersCount = ++game.playersCount! + guestsArray.length;

    await game.save();

    res.send({ success: true, userGame });
  } catch (error) {
    next(error);
  }
};

const getUpcomingGames = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { language } = req.query;

    const userGames = await UserGame.findAll({
      where: {
        userId,
      },
    });

    if (!userGames) {
      return res.status(404).json({ success: false, message: 'Games not found' });
    }

    if (!userGames.length) {
      return res.json([]);
    }

    const gameIds = userGames.map((userGame) => userGame.gameId);

    const games = await Game.findAll({
      where: {
        id: gameIds,
        startTime: {
          [Op.gt]: new Date(),
        },
      },
      include: [
        {
          model: User,
          as: 'users',
          where: {
            id: userId,
          },
        },
        {
          model: Stadion,
          as: 'stadion',
          attributes: [
            [`title_${language}`, `title`],
            [`address_${language}`, `address`],
          ],
        },
      ],
    });

    res.send(games);
  } catch (error) {
    next(error);
  }
};

const getActivity = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { language } = req.query;

    const userGames = await UserGame.findAll({
      where: {
        userId,
      },
    });

    if (!userGames) {
      return res.status(404).json({ success: false, message: 'Games not found' });
    }

    if (!userGames.length) {
      return res.json([]);
    }

    const gameIds = userGames.map((userGame) => userGame.gameId);

    const games = await Game.findAll({
      where: {
        id: gameIds,
        startTime: {
          [Op.lt]: new Date(),
        },
      },
      include: [
        {
          model: User,
          as: 'users',
          where: {
            id: userId,
          },
        },
        {
          model: Stadion,
          as: 'stadion',
          attributes: [
            [`title_${language}`, `title`],
            [`address_${language}`, `address`],
          ],
        },
      ],
    });

    res.send(games);
  } catch (error) {
    next(error);
  }
};

const cancel = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { gameId } = req.params;

    const game = await Game.findByPk(gameId);

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    const gameToCancel = await UserGame.findOne({
      where: {
        gameId,
        userId,
      },
    });

    if (!gameToCancel) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    await UserGame.destroy({
      where: {
        gameId,
        userId,
      },
    });

    const deletedGuestCount = await Guest.destroy({
      where: {
        gameId,
        userId,
      },
    });

    game.playersCount = --game.playersCount! - deletedGuestCount;

    game.save();

    res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

export default {
  create,
  getAll,
  getByStadionId,
  getOne,
  remove,
  update,
  register,
  getUpcomingGames,
  getActivity,
  cancel,
};
