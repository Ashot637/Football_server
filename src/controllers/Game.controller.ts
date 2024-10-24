import type { NextFunction, Request, Response } from 'express';
import {
  Facilitie,
  Game,
  Stadion,
  User,
  UserGame,
  Group,
  UserGroup,
  Invitation,
  GameUniforms,
  StadionNotification,
  Notification,
} from '../models';
import { type RequestWithUser } from '../types/RequestWithUser';
import { Op, type WhereOptions } from 'sequelize';
import dayjs from 'dayjs';
import { ROLES } from '../types/Roles';
import { INVITATION_TYPES } from '../models/Invitation.model';
import literalPlayersCount from '../helpers/literalPlayersCount';
import * as uuid from 'uuid';
import cron, { type ScheduledTask } from 'node-cron';
import sendPushNotifications from '../helpers/sendPushNotification';

const cronExpressions: Map<string, ScheduledTask> = new Map();

function scheduleTask(callback: () => void, id: string) {
  const now = new Date();

  // const hour = now.getHours();
  // const minute = now.getMinutes();

  // let dayOfWeek = now.getDay();

  // if (
  //   now.getHours() > hour ||
  //   (now.getHours() === hour && now.getMinutes() >= minute)
  // ) {
  //   dayOfWeek = (dayOfWeek + 1) % 7;
  // }
  // const cronExpression = `${minute} ${hour} * * ${dayOfWeek}`;

  cronExpressions.set(id, cron.schedule('0 0 * * 1', callback));
}

interface CreateRequest {
  priceOneHour: number;
  priceOneHourAndHalf: number;
  startTime: Date;
  endTime: Date;
  maxPlayersCount: number;
  stadionId: number;
  range: 1 | 4;
  uniforms: number[];
}

const create = async (req: Request<{}, {}, CreateRequest>, res: Response, next: NextFunction) => {
  try {
    const {
      priceOneHour,
      priceOneHourAndHalf,
      startTime,
      endTime,
      maxPlayersCount,
      stadionId,
      uniforms,
    } = req.body;

    const group = await Group.create({
      ownerId: -1,
      title: 'Public',
      forPublic: true,
    });

    const game = await Game.create({
      priceOneHour,
      priceOneHourAndHalf,
      startTime,
      endTime,
      maxPlayersCount,
      stadionId,
      groupId: group.id,
      uuid: uuid.v4(),
    });

    await GameUniforms.create({
      gameId: game.id,
      indexes: uniforms,
    });

    const notificationTime = dayjs(game.startTime).subtract(30, 'minute').toDate();
    const taskTime = dayjs(notificationTime).format('m H D M *');

    cron.schedule(taskTime, async () => {
      try {
        const games = await Game.findByPk(game.id, {
          include: [
            {
              model: User,
              as: 'users',
            },
          ],
        });

        if (!games || !games.users) return;
        const userTokens = games.users
          .map((user) => user.expoPushToken)
          .filter((token): token is string => token !== undefined);

        if (userTokens.length > 0) {
          await sendPushNotifications(userTokens, 'The game will start in 30 minutes!');
        }
      } catch (error) {
        console.error('Ошибка при отправке уведомлений:', error);
      }
    });

    return res.send(game);
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
    const {
      priceOneHour,
      priceOneHourAndHalf,
      groupId,
      startTime,
      endTime,
      stadionId,
      range,
      uniforms,
    } = req.body;

    let game: Game | undefined;
    let games: Game[] | undefined;

    const gameUuid = uuid.v4();
    if (range === 1) {
      game = await Game.create({
        priceOneHour,
        priceOneHourAndHalf,
        startTime,
        endTime,
        maxPlayersCount: 99,
        stadionId,
        isPublic: false,
        groupId,
        creatorId: userId,
        uuid: gameUuid,
      });
      await GameUniforms.create({
        gameId: game.id,
        indexes: uniforms,
      });
      await UserGame.create({
        userId,
        gameId: +game.id,
      });
    } else if (range === 4) {
      games = await Game.bulkCreate([
        {
          priceOneHour,
          priceOneHourAndHalf,
          startTime,
          endTime,
          maxPlayersCount: 99,
          stadionId,
          isPublic: false,
          groupId,
          creatorId: userId,
          isReplaying: true,
          uuid: gameUuid,
        },
        {
          startTime: dayjs(startTime).add(1, 'week').toDate(),
          endTime: dayjs(endTime).add(1, 'week').toDate(),
          priceOneHour,
          priceOneHourAndHalf,
          maxPlayersCount: 99,
          stadionId,
          isPublic: false,
          groupId,
          creatorId: userId,
          isReplaying: true,
          uuid: gameUuid,
        },
        {
          startTime: dayjs(startTime).add(2, 'week').toDate(),
          endTime: dayjs(endTime).add(2, 'week').toDate(),
          priceOneHour,
          priceOneHourAndHalf,
          maxPlayersCount: 99,
          stadionId,
          isPublic: false,
          groupId,
          creatorId: userId,
          isReplaying: true,
          uuid: gameUuid,
        },
        {
          startTime: dayjs(startTime).add(3, 'week').toDate(),
          endTime: dayjs(endTime).add(3, 'week').toDate(),
          priceOneHour,
          priceOneHourAndHalf,
          maxPlayersCount: 99,
          stadionId,
          isPublic: false,
          groupId,
          creatorId: userId,
          isReplaying: true,
          uuid: gameUuid,
        },
      ]);
      games.forEach((game) => {
        UserGame.create({
          userId,
          gameId: +game.id,
        });
        GameUniforms.create({
          gameId: game.id,
          indexes: uniforms,
        });
      });

      scheduleTask(async () => {
        const lastGame = await Game.findOne({
          where: {
            uuid: gameUuid,
          },
          order: [['startTime', 'DESC']],
        });
        if (!lastGame) {
          return;
        }
        const game = await Game.create({
          priceOneHour: lastGame.priceOneHour,
          priceOneHourAndHalf: lastGame.priceOneHourAndHalf,
          startTime: dayjs(lastGame.startTime).add(1, 'week').toDate(),
          endTime: dayjs(lastGame.endTime).add(1, 'week').toDate(),
          maxPlayersCount: lastGame.maxPlayersCount,
          stadionId: lastGame.stadionId,
          isPublic: lastGame.isPublic,
          groupId: lastGame.groupId,
          creatorId: lastGame.creatorId,
          isReplaying: lastGame.isReplaying,
          uuid: lastGame.uuid,
        });
        UserGame.create({
          userId,
          gameId: +game.id,
        });
        GameUniforms.create({
          gameId: game.id,
          indexes: uniforms,
        });
      }, gameUuid);
    } else {
      return res.status(400).send({ success: false, message: 'Missing range' });
    }

    const stadion = await Stadion.findByPk(stadionId, {
      attributes: [[`title_${language}`, `title`], [`address_${language}`, `address`], 'title_en'],
    });

    if (game) {
      await StadionNotification.create({
        userId,
        gameId: game.id,
        stadionId,
        isNew: true,
      });
      return res.send({ game: { ...game.toJSON(), stadion }, success: true });
    } else if (games) {
      games.forEach((game) => {
        StadionNotification.create({
          userId,
          gameId: game.id,
          stadionId,
          isNew: true,
        });
      });
      return res.send({
        game: { ...games.at(0)?.toJSON(), stadion },
        success: true,
      });
    }
  } catch (error) {
    next(error);
  }
};

const extendGame = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    return res.send({ succes: false });
    // if (!req.user) {
    //   return res
    //     .status(401)
    //     .json({ success: false, message: "Not authenticated" });
    // }
    // const { id: userId } = req.user;
    // const { groupId } = req.body;

    // const game = await Game.findOne({
    //   where: {
    //     groupId,
    //   },
    //   order: [["startTime", "DESC"]],
    // });

    // if (!game) {
    //   return res
    //     .status(404)
    //     .json({ success: false, message: "Game not found" });
    // }

    // const newGame = await Game.create({
    //   startTime: dayjs(game.startTime).add(1, "week").toDate(),
    //   endTime: dayjs(game?.endTime).add(1, "week").toDate(),
    //   price: game.price || 0,
    //   maxPlayersCount: 99,
    //   stadionId: game?.stadionId,
    //   isPublic: false,
    //   groupId: groupId,
    //   creatorId: userId,
    // });

    // return res.send(newGame);
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
      attributes: {
        include: [literalPlayersCount],
      },
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
      // Game.increment("playersCount", { by: 1, where: { id } });
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
    } else if (status === null && prevStatus) {
      // Game.decrement("playersCount", { by: 1, where: { id } });
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
    }

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
    const { id } = req.body;

    const invitation = await Invitation.findOne({
      where: {
        id,
      },
    });

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    if (invitation.type === INVITATION_TYPES.GROUP) {
      const games = await Game.findAll({
        where: {
          groupId: invitation.groupId,
        },
      });

      for (const game of games) {
        const userGame = await UserGame.findOne({
          where: {
            userId,
            gameId: game.id,
          },
        });

        if (!userGame) {
          await UserGame.create({
            userId,
            gameId: game.id,
          });
        }
      }
    } else {
      const userGame = await UserGame.findOne({
        where: {
          userId,
          gameId: invitation.gameId,
        },
      });
      if (!userGame) {
        await UserGame.create({
          userId,
          gameId: invitation.gameId,
          willPlay: true,
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

    if (invitation.type === INVITATION_TYPES.PRIVATE_GAME) {
      // await UserGroup.create({
      //   groupId: group.id,
      //   onlyOneGame: true,
      //   userId,
      // });
      return res.send({ success: true });
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
    const { id: userId } = req.user;
    const { id } = req.body;

    const invitation = await Invitation.findByPk(id);

    if (!invitation) {
      return res.status(404).send({ success: true, message: 'Invitation not found' });
    }

    Invitation.destroy({
      where: { id },
    });

    Notification.create({
      userId,
      type: invitation.type,
      gameId: invitation.gameId,
      groupId: invitation.groupId,
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
        attributes: {
          include: [literalPlayersCount],
        },
        order: [
          ['playersCount', 'DESC'],
          ['startTime', 'DESC'],
        ],
      });
    } else {
      games = await Game.findAll({
        include: [{ model: Stadion, as: 'stadion' }],
        attributes: {
          include: [literalPlayersCount],
        },
        order: [
          ['startTime', 'DESC'],
          ['playersCount', 'DESC'],
        ],
      });
    }

    return res.send(games);
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
      attributes: {
        include: [literalPlayersCount],
      },
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

const getAllFromAdminPanel = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id, role } = req.user;
    let games: Game[];
    if (role === ROLES.ADMIN) {
      games = await Game.findAll({
        include: [{ model: Stadion, as: 'stadion' }],
        attributes: {
          include: [literalPlayersCount],
        },
        order: [
          ['startTime', 'DESC'],
          ['playersCount', 'DESC'],
        ],
      });
    } else {
      const stadionsIds = (await Stadion.findAll({ where: { ownerId: id } })).map((x) => x.id);
      games = await Game.findAll({
        where: {
          stadionId: stadionsIds,
        },
        attributes: {
          include: [literalPlayersCount],
        },
        include: [{ model: Stadion, as: 'stadion' }],
      });
    }
    return res.send(games);
  } catch (error) {
    next(error);
  }
};

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
        attributes: {
          include: [literalPlayersCount],
        },
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
          {
            model: User,
            as: 'users',

            include: [
              {
                model: Game,
                as: 'games',
                where: {
                  id,
                },
                through: {
                  attributes: ['willPlay'],
                },
              },
            ],
          },
          {
            model: GameUniforms,
            as: 'uniforms',
          },
        ],
      });
    } else {
      game = await Game.findByPk(id, {
        attributes: {
          include: [literalPlayersCount],
        },
        include: [
          {
            model: Stadion,
            as: 'stadion',
            attributes: [['title_en', 'title'], ['address_en', 'address'], 'title_en', 'id', 'img'],
            include: [
              {
                model: Facilitie,
                as: 'facilities',
                attributes: [['title_en', 'title'], 'id', 'img'],
              },
            ],
          },
          {
            model: User,
            as: 'users',

            include: [
              {
                model: Game,
                as: 'games',
                where: {
                  id,
                },
                through: {
                  attributes: ['willPlay'],
                },
              },
            ],
          },
          {
            model: GameUniforms,
            as: 'uniforms',
          },
        ],
      });
    }

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    if (game.isPublic) {
      const userGames = await UserGame.findAll({ where: { gameId: id } });

      // let uniforms = [0, 0, 0, 0];

      // userGames.forEach((userGame) => {
      //   userGame.uniforms.forEach((index) => {
      //     uniforms[index] = ++uniforms[index];
      //   });
      // });

      type AccType = { usersWillPlayCount: number; usersWontPlayCount: number };
      const usersStatistics: AccType = userGames.reduce(
        (acc: AccType, game: UserGame) => {
          if (game.willPlay) {
            acc.usersWillPlayCount++;
          } else if (game.willPlay === false) acc.usersWontPlayCount++;
          return acc;
        },
        { usersWillPlayCount: 0, usersWontPlayCount: 0 },
      );

      return res.send({ ...game.toJSON(), ...usersStatistics });
    }

    // const group = await Group.findByPk(game.groupId, {
    //   include: {
    //     model: User,
    //     include: [
    //       {
    //         model: Game,
    //         as: "games",
    //         where: {
    //           id: game.id,
    //         },
    //       },
    //     ],
    //   },
    // });

    type AccType = { usersWillPlayCount: number; usersWontPlayCount: number };
    const usersStatistics: AccType =
      //@ts-ignore
      game.users.reduce(
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

    const users = (game.toJSON() as Game & { users: User[] }).users.map((user) => ({
      ...user,
      //@ts-ignore
      UserGame: user.games[0].UserGame,
    }));

    return res.send({
      ...game.toJSON(),
      ...usersStatistics,
      users,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId, role } = req.user;
    const { ids, deleteReplaying } = req.body;

    if (role === ROLES.ADMIN || role === ROLES.STADION_OWNER) {
      await Game.destroy({
        where: {
          id: ids,
        },
      });
      await UserGame.destroy({
        where: {
          gameId: ids,
        },
      });
      // Use truncate to clear all records if that's the intention
      await UserGame.destroy({ truncate: true, restartIdentity: true });
    } else {
      const game = await Game.findByPk(ids[0]);
      if (!game) {
        return res.status(404).json({ success: false, message: 'Game not found' });
      }

      if (deleteReplaying) {
        cronExpressions.get(game.uuid)?.stop();
        await Game.destroy({
          where: {
            uuid: game.uuid,
            creatorId: userId,
          },
        });

        const games = await Game.findAll({ where: { uuid: game.uuid } });

        for (const game of games) {
          await UserGame.destroy({
            where: {
              gameId: game.id,
            },
          });
        }
      } else {
        await Game.destroy({
          where: {
            id: ids,
            creatorId: userId,
          },
        });

        await UserGame.destroy({
          where: {
            gameId: game.id,
          },
        });
      }
    }

    return res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

const update = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId, role } = req.user;
    const {
      priceOneHour,
      priceOneHourAndHalf,
      startTime,
      endTime,
      maxPlayersCount,
      stadionId,
      uniforms,
      isReplaying,
    } = req.body;
    const { id } = req.params;

    let result: [number, Game[]];

    if (role === ROLES.ADMIN || role === ROLES.STADION_OWNER) {
      result = await Game.update(
        {
          priceOneHour,
          priceOneHourAndHalf,
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
      GameUniforms.update(
        {
          indexes: uniforms,
        },
        {
          where: {
            gameId: id,
          },
        },
      );
    } else {
      if (isReplaying) {
        const game = await Game.findOne({
          where: {
            id: id,
            creatorId: userId,
          },
        });

        if (!game) {
          return res.status(404).json({ message: 'Game not found' });
        }
        result = await Game.update(
          {
            priceOneHour,
            priceOneHourAndHalf,
            startTime,
            endTime,
            maxPlayersCount,
            stadionId,
          },
          {
            where: {
              uuid: game.uuid,
              creatorId: userId,
            },
            returning: true,
          },
        );
        // scheduleTask(async () => {
        //   const lastGame = await Game.findOne({
        //     where: {
        //       uuid: game.uuid,
        //     },
        //     order: [["startTime", "DESC"]],
        //   });
        //   if (!lastGame) {
        //     return;
        //   }
        //   const newGame = await Game.create({
        //     price: lastGame.price,
        //     startTime: dayjs(lastGame.startTime).add(1, "week").toDate(),
        //     endTime: dayjs(lastGame.startTime).add(1, "week").toDate(),
        //     maxPlayersCount: lastGame.maxPlayersCount,
        //     stadionId: lastGame.stadionId,
        //     isPublic: lastGame.isPublic,
        //     groupId: lastGame.groupId,
        //     creatorId: lastGame.creatorId,
        //     isReplaying: lastGame.isReplaying,
        //     uuid: lastGame.uuid,
        //   });
        //   UserGame.create({
        //     userId,
        //     gameId: +newGame.id,
        //   });
        //   GameUniforms.create({
        //     gameId: newGame.id,
        //     indexes: uniforms,
        //   });
        // }, game.uuid);
        const games = await Game.findAll({
          where: {
            uuid: game.id,
          },
        });
        games.forEach((game) => {
          GameUniforms.update(
            {
              indexes: uniforms,
            },
            {
              where: {
                gameId: game.id,
              },
            },
          );
        });
      } else {
        result = await Game.update(
          {
            priceOneHour,
            priceOneHourAndHalf,
            startTime,
            endTime,
            maxPlayersCount,
            stadionId,
          },
          {
            where: {
              id: id,
              creatorId: userId,
            },
            returning: true,
          },
        );
        if (result?.[1]?.[0]) {
          GameUniforms.update(
            {
              indexes: uniforms,
            },
            {
              where: {
                gameId: result[1][0].id,
              },
            },
          );
        }
      }
    }

    return res.json({ success: true });
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

    const game = await Game.findByPk(gameId, {
      include: [
        { model: Group, as: 'group', attributes: ['id'] },
        { model: Stadion, as: 'stadion', attributes: ['title_en'] },
      ],
      attributes: {
        include: [literalPlayersCount],
      },
    });

    // game?.increment("playersCount", { by: 1 });

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    // if (game.playersCount === game.maxPlayersCount) {
    //   return res
    //     .status(403)
    //     .json({ success: false, message: "Already have maximum players" });
    // }

    const userGame = await UserGame.create({
      userId,
      gameId: +gameId,
      willPlay: true,
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

const getMyGames = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { id: userId } = req.user;
    const { language, date } = req.query;

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

    let games;
    if (date) {
      const startDate = new Date(date as string);
      startDate.setHours(startDate.getHours() - 4);
      const endDate = new Date(date as string);
      endDate.setHours(endDate.getHours() - 4);
      endDate.setDate(endDate.getDate() + 1);
      games = await Game.findAll({
        where: {
          id: gameIds,
          startTime: {
            [Op.between]: [startDate, endDate],
          },
        },
        include: [
          {
            model: Stadion,
            as: 'stadion',
            attributes: [[`title_${language}`, `title`], [`address_${language}`, `address`], 'img'],
          },
        ],
        attributes: {
          include: [literalPlayersCount],
        },
        order: [['startTime', 'ASC']],
      });
    } else {
      games = await Game.findAll({
        where: {
          id: gameIds,
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
        attributes: {
          include: [literalPlayersCount],
        },
        order: [['startTime', 'ASC']],
      });
    }

    return res.send(games);
  } catch (error) {
    next(error);
  }
};

const getOpenGames = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { language, date } = req.query;

    let games;

    if (date) {
      const startDate = new Date(date as string);
      startDate.setHours(startDate.getHours() - 4);
      const endDate = new Date(date as string);
      endDate.setHours(endDate.getHours() - 4);
      endDate.setDate(endDate.getDate() + 1);
      games = await Game.findAll({
        where: {
          isPublic: true,
          startTime: {
            [Op.between]: [startDate, endDate],
          },
        },
        include: [
          {
            model: Stadion,
            as: 'stadion',
            attributes: [[`title_${language}`, `title`], [`address_${language}`, `address`], 'img'],
          },
        ],
        attributes: {
          include: [literalPlayersCount],
        },
        order: [['startTime', 'ASC']],
      });
    } else {
      games = await Game.findAll({
        where: {
          isPublic: true,
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
        attributes: {
          include: [literalPlayersCount],
        },
        order: [['startTime', 'ASC']],
      });
    }

    return res.send(games);
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
      attributes: {
        include: [literalPlayersCount],
      },
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
      include: [
        { model: Group, as: 'group', attributes: ['id'] },
        { model: User, as: 'users' },
      ],
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

    //@ts-ignore
    game.users.forEach((user: User) => {
      Notification.create({
        userId: user.id,
        gameId: game.id,
      });
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

    // game?.decrement("playersCount", { by: 1 });

    UserGroup.destroy({
      where: {
        userId,
        groupId: (game.dataValues as Game & { group: Group }).group.dataValues.id,
      },
    });

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

const joinToPrivateGame = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { id, withGroup, notificationId } = req.body;

    const game = await Game.findByPk(id);

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }
    const userGame = await UserGame.findOne({
      where: {
        userId,
        gameId: id,
      },
    });
    if (!userGame) {
      await UserGame.create({
        userId,
        gameId: id,
        willPlay: true,
      });
    }

    // Notification.update(
    //   {
    //     disabled: true,
    //   },
    //   {
    //     where: {
    //       id: notificationId,
    //     },
    //   }
    // );
    Notification.destroy({ where: notificationId });

    if (!withGroup) {
      return res.send({ success: true });
    }

    const group = await Group.findOne({
      where: {
        id: game.groupId,
      },
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    await UserGroup.create({
      groupId: group.id,
      userId,
    });

    res.send({ success: true });
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
  getMyGames,
  getOpenGames,
  getActivity,
  getAllGroupGames,
  cancel,
  getAllFromAdminPanel,
  getAllCreated,
  changeWillPlayGameStatus,
  joinToPrivateGame,
};
