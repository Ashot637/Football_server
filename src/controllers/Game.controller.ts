import type { NextFunction, Request, Response } from "express";
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
} from "../models";
import { type RequestWithUser } from "../types/RequestWithUser";
import { Op, type WhereOptions } from "sequelize";
import dayjs from "dayjs";
import { ROLES } from "../types/Roles";
import StadionNotification from "../models/StadionNotification.model";
import { INVITATION_TYPES } from "../models/Invitation.model";

interface CreateRequest {
  price: number;
  startTime: Date;
  endTime: Date;
  maxPlayersCount: number;
  stadionId: number;
  range: 1 | 4;
  uniforms: number[];
}

const create = async (
  req: Request<{}, {}, CreateRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { price, startTime, endTime, maxPlayersCount, stadionId, uniforms } =
      req.body;

    const group = await Group.create({
      ownerId: -1,
      title: "Public",
      forPublic: true,
    });

    const game = await Game.create({
      price,
      startTime,
      endTime,
      maxPlayersCount,
      stadionId,
      groupId: group.id,
    });

    await GameUniforms.create({
      gameId: game.id,
      indexes: uniforms,
    });

    return res.send(game);
  } catch (error) {
    next(error);
  }
};

const organizerCreate = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    const { id: userId } = req.user;
    const { language } = req.query;
    const { groupId, price, startTime, endTime, stadionId, range, uniforms } =
      req.body;

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
        groupId,
        creatorId: userId,
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
          price: price || 0,
          startTime,
          endTime,
          maxPlayersCount: 99,
          stadionId,
          isPublic: false,
          groupId,
          creatorId: userId,
        },
        {
          startTime: dayjs(startTime).add(1, "week").toDate(),
          endTime: dayjs(endTime).add(1, "week").toDate(),
          price: price || 0,
          maxPlayersCount: 99,
          stadionId,
          isPublic: false,
          groupId,
          creatorId: userId,
        },
        {
          startTime: dayjs(startTime).add(2, "week").toDate(),
          endTime: dayjs(endTime).add(2, "week").toDate(),
          price: price || 0,
          maxPlayersCount: 99,
          stadionId,
          isPublic: false,
          groupId,
          creatorId: userId,
        },
        {
          startTime: dayjs(startTime).add(3, "week").toDate(),
          endTime: dayjs(endTime).add(3, "week").toDate(),
          price: price || 0,
          maxPlayersCount: 99,
          stadionId,
          isPublic: false,
          groupId,
          creatorId: userId,
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
    } else {
      return res.json(400).send({ success: false, message: "Missing range" });
    }

    const stadion = await Stadion.findByPk(stadionId, {
      attributes: [
        [`title_${language}`, `title`],
        [`address_${language}`, `address`],
        "title_en",
      ],
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

const extendGame = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    const { id: userId } = req.user;
    const { groupId } = req.body;

    const game = await Game.findOne({
      where: {
        groupId,
      },
      order: [["startTime", "DESC"]],
    });

    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }

    const newGame = await Game.create({
      startTime: dayjs(game.startTime).add(1, "week").toDate(),
      endTime: dayjs(game?.endTime).add(1, "week").toDate(),
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

const getAllGroupGames = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    const { id: userId } = req.user;
    const { language } = req.query;

    const userGames = await UserGame.findAll({
      where: {
        userId,
      },
    });

    if (!userGames) {
      return res
        .status(404)
        .json({ success: false, message: "Games not found" });
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
          as: "users",
          where: {
            id: userId,
          },
        },
        {
          model: Stadion,
          as: "stadion",
          attributes: [
            [`title_${language}`, `title`],
            [`address_${language}`, `address`],
            "img",
          ],
        },
      ],
      order: [["startTime", "ASC"]],
    });

    return res.send(games);
  } catch (error) {
    next(error);
  }
};

const changeWillPlayGameStatus = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    const { id: userId } = req.user;
    const { id, status, prevStatus } = req.body;

    if (status) {
      Game.increment("playersCount", { by: 1, where: { id } });
      UserGame.update(
        {
          willPlay: status,
        },
        {
          where: {
            gameId: id,
            userId,
          },
        }
      );
    } else if (status === null && prevStatus) {
      Game.decrement("playersCount", { by: 1, where: { id } });
      UserGame.update(
        {
          willPlay: status,
        },
        {
          where: {
            gameId: id,
            userId,
          },
        }
      );
    }

    return res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

const acceptInvitation = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    const { id: userId } = req.user;
    const { id } = req.body;

    const invitation = await Invitation.findOne({
      where: {
        id,
      },
    });

    if (!invitation) {
      return res
        .status(404)
        .json({ success: false, message: "Invitation not found" });
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
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
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

const declineInvitation = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    const { id } = req.body;

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
  language?: "en" | "ru" | "am";
}

const getAll = async (
  req: Request<{}, {}, {}, GetAllRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { date, language } = req.query;
    let WHERE: WhereOptions | undefined;
    if (date) {
      const day = new Date(date);
      const startOfDay = new Date(
        Date.UTC(
          day.getUTCFullYear(),
          day.getUTCMonth(),
          day.getUTCDate(),
          0,
          0,
          0,
          0
        )
      );
      const endOfDay = new Date(
        Date.UTC(
          day.getUTCFullYear(),
          day.getUTCMonth(),
          day.getUTCDate(),
          23,
          59,
          59,
          999
        )
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
            as: "stadion",
            attributes: [
              [`title_${language}`, `title`],
              [`address_${language}`, `address`],
              "id",
              "img",
            ],
          },
        ],
        order: [
          ["playersCount", "DESC"],
          ["startTime", "DESC"],
        ],
      });
    } else {
      games = await Game.findAll({
        include: [{ model: Stadion, as: "stadion" }],
        order: [
          ["startTime", "DESC"],
          ["playersCount", "DESC"],
        ],
      });
    }

    return res.send(games);
  } catch (error) {
    next(error);
  }
};

const getByStadionId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
          as: "stadion",
          attributes: [
            [`title_${language}`, `title`],
            [`address_${language}`, `address`],
            "id",
            "img",
          ],
        },
      ],
      order: [
        ["playersCount", "DESC"],
        ["startTime", "DESC"],
      ],
    });

    res.send(games);
  } catch (error) {
    next(error);
  }
};

interface GetOneRequest {
  language?: "en" | "ru" | "am";
}

const getAllFromAdminPanel = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    const { id, role } = req.user;
    let games: Game[];
    if (role === ROLES.ADMIN) {
      games = await Game.findAll({
        include: [{ model: Stadion, as: "stadion" }],
        order: [
          ["startTime", "DESC"],
          ["playersCount", "DESC"],
        ],
      });
    } else {
      const stadionsIds = (
        await Stadion.findAll({ where: { ownerId: id } })
      ).map((x) => x.id);
      games = await Game.findAll({
        where: {
          stadionId: stadionsIds,
        },
        include: [{ model: Stadion, as: "stadion" }],
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
  next: NextFunction
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
            as: "stadion",
            attributes: [
              [`title_${language}`, `title`],
              [`address_${language}`, `address`],
              "title_en",
              "id",
              "img",
            ],
            include: [
              {
                model: Facilitie,
                as: "facilities",
                attributes: [[`title_${language}`, `title`], "id", "img"],
              },
            ],
          },
          {
            model: User,
            as: "users",
            include: [
              {
                model: Game,
                as: "games",
                where: {
                  id,
                },
              },
            ],
          },
          {
            model: GameUniforms,
            as: "unfiroms",
          },
        ],
      });
    } else {
      game = await Game.findByPk(id, {
        include: [
          {
            model: Stadion,
            as: "stadion",
            include: [{ model: Facilitie, as: "facilities" }],
          },
          { model: User, as: "users" },
          {
            model: GameUniforms,
            as: "unfiroms",
          },
        ],
      });
    }

    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
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
        { usersWillPlayCount: 0, usersWontPlayCount: 0 }
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
          } else if (user.games[0].UserGame.willPlay === false)
            acc.usersWontPlayCount++;
          return acc;
        },
        { usersWillPlayCount: 0, usersWontPlayCount: 0 }
      );

    const users = (game.toJSON() as Game & { users: User[] }).users.map(
      (user) => ({
        ...user,
        //@ts-ignore
        UserGame: user.games[0].UserGame,
      })
    );

    return res.send({
      ...game.toJSON(),
      ...usersStatistics,
      users,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    const { id: userId, role } = req.user;
    const { ids } = req.body;

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
      await UserGame.destroy({});
    } else {
      const games = await Game.findAll({
        where: {
          id: ids,
          creatorId: userId,
        },
      });
      await Game.destroy({
        where: {
          id: ids,
          creatorId: userId,
        },
      });

      for (const game of games) {
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

const update = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    const { id: userId, role } = req.user;
    const { price, startTime, endTime, maxPlayersCount, stadionId, uniforms } =
      req.body;
    const { id } = req.params;

    let result: [number, Game[]];

    if (role === ROLES.ADMIN || role === ROLES.STADION_OWNER) {
      result = await Game.update(
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
        }
      );
      GameUniforms.update(
        {
          indexes: uniforms,
        },
        {
          where: {
            gameId: id,
          },
        }
      );
    } else {
      result = await Game.update(
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
            creatorId: userId,
          },
          returning: true,
        }
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
          }
        );
      }
    }

    if (result[0] === 0) {
      return res.status(404).json({ message: "Game not found" });
    }

    return res.json(result[1]);
  } catch (error) {
    next(error);
  }
};

const register = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    const { id: userId } = req.user;
    const { gameId } = req.params;

    const game = await Game.findByPk(gameId, {
      include: [
        { model: Group, as: "group", attributes: ["id"] },
        { model: Stadion, as: "stadion", attributes: ["title_en"] },
      ],
    });

    game?.increment("playersCount", { by: 1 });

    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }

    if (game.playersCount === game.maxPlayersCount) {
      return res
        .status(403)
        .json({ success: false, message: "Already have maximum players" });
    }

    const userGame = await UserGame.create({
      userId,
      gameId: +gameId,
      willPlay: true,
    });

    const userGroup = await UserGroup.findOne({
      where: {
        groupId: (game.dataValues as Game & { group: Group }).group.dataValues
          .id,
        userId,
      },
    });

    if (!userGroup) {
      UserGroup.create({
        groupId: (game.dataValues as Game & { group: Group }).group.dataValues
          .id,
        userId,
      });
    }

    return res.send({ success: true, userGame });
  } catch (error) {
    next(error);
  }
};

const getMyGames = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    const { id: userId } = req.user;
    const { language, date } = req.query;

    const userGames = await UserGame.findAll({
      where: {
        userId,
      },
    });

    if (!userGames) {
      return res
        .status(404)
        .json({ success: false, message: "Games not found" });
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
            as: "stadion",
            attributes: [
              [`title_${language}`, `title`],
              [`address_${language}`, `address`],
              "img",
            ],
          },
        ],
        order: [["startTime", "ASC"]],
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
            as: "stadion",
            attributes: [
              [`title_${language}`, `title`],
              [`address_${language}`, `address`],
              "img",
            ],
          },
        ],
        order: [["startTime", "ASC"]],
      });
    }

    return res.send(games);
  } catch (error) {
    next(error);
  }
};

const getOpenGames = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
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
            as: "stadion",
            attributes: [
              [`title_${language}`, `title`],
              [`address_${language}`, `address`],
              "img",
            ],
          },
        ],
        order: [["startTime", "ASC"]],
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
            as: "stadion",
            attributes: [
              [`title_${language}`, `title`],
              [`address_${language}`, `address`],
              "img",
            ],
          },
        ],
        order: [["startTime", "ASC"]],
      });
    }

    return res.send(games);
  } catch (error) {
    next(error);
  }
};

const getActivity = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
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
      return res
        .status(404)
        .json({ success: false, message: "Games not found" });
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
          as: "users",
          where: {
            id: userId,
          },
        },
        {
          model: Stadion,
          as: "stadion",
          attributes: [
            [`title_${language}`, `title`],
            [`address_${language}`, `address`],
          ],
        },
      ],
      order: [["startTime", "ASC"]],
    });

    res.send(games);
  } catch (error) {
    next(error);
  }
};

const cancel = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    const { id: userId } = req.user;
    const { gameId } = req.params;

    const game = await Game.findByPk(gameId, {
      include: { model: Group, as: "group", attributes: ["id"] },
    });

    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }

    const gameToCancel = await UserGame.findOne({
      where: {
        gameId,
        userId,
      },
    });

    if (!gameToCancel) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }

    await UserGame.destroy({
      where: {
        gameId,
        userId,
      },
    });

    game?.decrement("playersCount", { by: 1 });

    UserGroup.destroy({
      where: {
        userId,
        groupId: (game.dataValues as Game & { group: Group }).group.dataValues
          .id,
      },
    });

    return res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

const getAllCreated = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
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
          as: "stadion",
          attributes: [
            [`title_${language}`, `title`],
            [`address_${language}`, `address`],
            "img",
          ],
        },
      ],
      order: [["startTime", "ASC"]],
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
  getMyGames,
  getOpenGames,
  getActivity,
  getAllGroupGames,
  cancel,
  getAllFromAdminPanel,
  getAllCreated,
  changeWillPlayGameStatus,
};
