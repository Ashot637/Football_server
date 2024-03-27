import type { NextFunction, Request, Response } from 'express';
import { Facilitie, Game, Stadion, User, UserGame, Group, UserGroup, Invitation } from '../models';
import { type RequestWithUser } from '../types/RequestWithUser';
import { Op, type WhereOptions } from 'sequelize';
import dayjs from 'dayjs';

interface CreateRequest {
  price: number;
  startTime: Date;
  endTime: Date;
  maxPlayersCount: number;
  stadionId: number;
  range: 1 | 4;
}

const create = async (req: Request<{}, {}, CreateRequest>, res: Response, next: NextFunction) => {
  try {
    const { price, startTime, endTime, maxPlayersCount, stadionId, range } = req.body;

    const group = await Group.create();

    let data: Game | Game[];
    if (range === 1) {
      data = await Game.create({
        price,
        startTime,
        endTime,
        maxPlayersCount,
        stadionId,
        groupId: group.id,
      });
    } else if (range === 4) {
      data = await Game.bulkCreate([
        {
          price,
          startTime,
          endTime,
          maxPlayersCount,
          stadionId,
          groupId: group.id,
        },
        {
          price,
          startTime: dayjs(startTime).add(1, 'week').toDate(),
          endTime: dayjs(endTime).add(1, 'week').toDate(),
          maxPlayersCount,
          stadionId,
          groupId: group.id,
        },
        {
          price,
          startTime: dayjs(startTime).add(2, 'week').toDate(),
          endTime: dayjs(endTime).add(2, 'week').toDate(),
          maxPlayersCount,
          stadionId,
          groupId: group.id,
        },
        {
          price,
          startTime: dayjs(startTime).add(3, 'week').toDate(),
          endTime: dayjs(endTime).add(3, 'week').toDate(),
          maxPlayersCount,
          stadionId,
          groupId: group.id,
        },
      ]);
    } else {
      return res.status(400).send({ success: false, message: 'Missing range' });
    }

    return res.send(data);
  } catch (error) {
    next(error);
  }
};

const organizerCreate = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { language } = req.query;
    const { price, startTime, endTime, stadionId, range } = req.body;

    const group = await Group.create();
    let game: Game | undefined;
    let games: Game[] | undefined;
    if (range === 1) {
      game = await Game.create({
        price: price || 0,
        startTime,
        endTime,
        maxPlayersCount: 99,
        stadionId,
        isPublic: false,
        groupId: group.id,
        creatorId: userId,
      });
      UserGame.create({
        userId,
        gameId: +game.id,
        uniforms: [],
      });
    } else if (range === 4) {
      games = await Game.bulkCreate([
        {
          price: price || 0,
          startTime,
          endTime,
          maxPlayersCount: 99,
          stadionId,
          isPublic: false,
          groupId: group.id,
          creatorId: userId,
        },
        {
          startTime: dayjs(startTime).add(1, 'week').toDate(),
          endTime: dayjs(endTime).add(1, 'week').toDate(),
          price: price || 0,
          maxPlayersCount: 99,
          stadionId,
          isPublic: false,
          groupId: group.id,
          creatorId: userId,
        },
        {
          startTime: dayjs(startTime).add(2, 'week').toDate(),
          endTime: dayjs(endTime).add(2, 'week').toDate(),
          price: price || 0,
          maxPlayersCount: 99,
          stadionId,
          isPublic: false,
          groupId: group.id,
          creatorId: userId,
        },
        {
          startTime: dayjs(startTime).add(3, 'week').toDate(),
          endTime: dayjs(endTime).add(3, 'week').toDate(),
          price: price || 0,
          maxPlayersCount: 99,
          stadionId,
          isPublic: false,
          groupId: group.id,
          creatorId: userId,
        },
      ]);
      games.forEach((game) => {
        UserGame.create({
          userId,
          gameId: +game.id,
          uniforms: [],
        });
      });
    } else {
      return res.json(400).send({ success: false, message: 'Missing range' });
    }

    const stadion = await Stadion.findByPk(stadionId, {
      attributes: [[`title_${language}`, `title`], [`address_${language}`, `address`], 'title_en'],
    });

    await UserGroup.create({
      groupId: group.id,
      userId,
    });
    if (game) {
      return res.send({ game: { ...game.toJSON(), stadion }, success: true });
    } else if (games) {
      return res.send({ game: { ...games.at(0)?.toJSON(), stadion }, success: true });
    }
  } catch (error) {
    next(error);
  }
};

const extendGame = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { groupId } = req.body;

    const game = await Game.findOne({
      where: {
        groupId,
      },
      order: [['startTime', 'DESC']],
    });

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    const newGame = await Game.create({
      startTime: dayjs(game.startTime).add(1, 'week').toDate(),
      endTime: dayjs(game?.endTime).add(1, 'week').toDate(),
      price: game.price || 0,
      maxPlayersCount: 99,
      stadionId: game?.stadionId,
      isPublic: false,
      groupId: groupId,
      creatorId: userId,
    });

    return res.send(newGame);
  } catch (error) {
    next(error);
  }
};

const getAllGroupGames = async (req: RequestWithUser, res: Response, next: NextFunction) => {
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
          attributes: [[`title_${language}`, `title`], [`address_${language}`, `address`], 'img'],
        },
      ],
      order: [['startTime', 'ASC']],
    });

    return res.send(games);
  } catch (error) {
    next(error);
  }
};

const changeWillPlayGameStatus = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { id, status, prevStatus } = req.body;

    if (status) {
      Game.increment('playersCount', { by: 1, where: { id } });
    } else if (status === null && prevStatus) {
      Game.decrement('playersCount', { by: 1, where: { id } });
    }

    UserGame.update(
      {
        willPlay: status,
      },
      {
        where: {
          gameId: id,
          userId,
        },
      },
    );

    return res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

const acceptInvitation = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { id, groupId } = req.body;

    const invitation = await Invitation.findOne({
      where: {
        id,
        groupId,
      },
    });

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    const games = await Game.findAll({
      where: {
        groupId: invitation?.groupId,
      },
    });

    if (!games) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    for (const game of games) {
      const userGame = await UserGame.findOne({
        where: {
          userId,
          gameId: game.id,
        },
      });

      if (!userGame) {
        UserGame.create({
          userId,
          gameId: game.id,
          uniforms: [],
        });
      }
    }

    Invitation.destroy({
      where: { id },
    });

    const group = await Group.findOne({
      where: {
        id: invitation.groupId,
      },
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    await UserGroup.create({
      groupId: group.id,
      userId,
    });

    return res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

const declineInvitation = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id } = req.body;

    // const invitation = await Invitation.findOne({
    //   where: {
    //     id,
    //   },
    // });

    // if (!invitation) {
    //   return res.status(404).json({ success: false, message: 'Invitation not found' });
    // }

    Invitation.destroy({
      where: { id },
    });

    return res.send({ success: true });
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
          isPublic: true,
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
                isPublic: true,
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
        isPublic: true,
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
            model: Stadion,
            as: 'stadion',
            attributes: [
              [`title_${language}`, `title`],
              [`address_${language}`, `address`],
              'title_en',
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
          { model: Stadion, as: 'stadion', include: [{ model: Facilitie, as: 'facilities' }] },
          { model: User, as: 'users' },
        ],
      });
    }

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    if (game.isPublic) {
      const userGames = await UserGame.findAll({ where: { gameId: id } });

      let uniforms = [0, 0, 0, 0];

      userGames.forEach((userGame) => {
        userGame.uniforms.forEach((index) => {
          uniforms[index] = ++uniforms[index];
        });
      });

      return res.send({ ...game.toJSON(), uniforms });
    }
    const group = await Group.findByPk(game.groupId, {
      include: {
        model: User,
        include: [
          {
            model: Game,
            as: 'games',
            where: {
              id: game.id,
            },
          },
        ],
      },
    });

    type AccType = { usersWillPlayCount: number; usersWontPlayCount: number };
    const usersStatistics: AccType =
      //@ts-ignore
      group.Users.reduce(
        (acc: AccType, user: User) => {
          //@ts-ignore
          if (user.games[0].UserGame.willPlay) {
            acc.usersWillPlayCount++;
            //@ts-ignore
          } else if (user.games[0].UserGame.willPlay === false) acc.usersWontPlayCount++;
          return acc;
        },
        { usersWillPlayCount: 0, usersWontPlayCount: 0 },
      );

    return res.send({
      ...game.toJSON(),
      users: (group?.toJSON() as Group & { Users: User[] }).Users,
      ...usersStatistics,
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

    return res.send({ success: true });
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
    const { uniforms } = req.body;

    const game = await Game.findByPk(gameId, {
      include: [
        { model: Group, as: 'group', attributes: ['id'] },
        { model: Stadion, as: 'stadion', attributes: ['title_en'] },
      ],
    });

    game?.increment('playersCount', { by: 1 });

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    if (game.playersCount === game.maxPlayersCount) {
      return res.status(403).json({ success: false, message: 'Already have maximum players' });
    }

    const userGame = await UserGame.create({
      userId,
      gameId: +gameId,
      willPlay: true,
      uniforms: uniforms || [],
    });

    const userGroup = await UserGroup.findOne({
      where: {
        groupId: (game.dataValues as Game & { group: Group }).group.dataValues.id,
        userId,
      },
    });

    if (!userGroup) {
      UserGroup.create({
        groupId: (game.dataValues as Game & { group: Group }).group.dataValues.id,
        userId,
      });
    }

    return res.send({ success: true, userGame });
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
        willPlay: true,
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
          attributes: [[`title_${language}`, `title`], [`address_${language}`, `address`], 'img'],
        },
      ],
      order: [['startTime', 'ASC']],
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
        willPlay: true,
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
      order: [['startTime', 'ASC']],
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

    const game = await Game.findByPk(gameId, {
      include: { model: Group, as: 'group', attributes: ['id'] },
    });

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

    game?.decrement('playersCount', { by: 1 });

    // UserGroup.destroy({
    //   where: {
    //     userId,
    //     groupId: (game.dataValues as Game & { group: Group }).group.dataValues.id,
    //   },
    // });

    return res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

const getAllCreated = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { language } = req.query;

    const games = await Game.findAll({
      where: {
        creatorId: userId,
        startTime: {
          [Op.gt]: new Date(),
        },
      },
      include: [
        {
          model: Stadion,
          as: 'stadion',
          attributes: [[`title_${language}`, `title`], [`address_${language}`, `address`], 'img'],
        },
      ],
      order: [['startTime', 'ASC']],
    });

    res.send(games);
  } catch (error) {
    next(error);
  }
};

export default {
  create,
  organizerCreate,
  extendGame,
  acceptInvitation,
  declineInvitation,
  getAll,
  getByStadionId,
  getOne,
  remove,
  update,
  register,
  getUpcomingGames,
  getActivity,
  getAllGroupGames,
  cancel,
  getAllCreated,
  changeWillPlayGameStatus,
};
