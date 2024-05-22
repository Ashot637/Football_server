import { type Request, type Response, type NextFunction } from "express";
import { type RequestWithUser } from "../types/RequestWithUser";
import {
  Game,
  Group,
  Notification,
  Stadion,
  User,
  UserGame,
  UserGroup,
} from "../models";
import literalPlayersCount from "../helpers/literalPlayersCount";
import { literal } from "sequelize";

const getAll = async (
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
    const { id } = req.user;
    const user = await User.findOne({
      where: {
        id,
      },
      include: {
        model: Group,
      },
    });

    //@ts-ignore
    return res.send(user.Groups?.filter((group) => !group.forPublic) ?? []);
  } catch (error) {
    next(error);
  }
};

const getAllThatUserOwnes = async (
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
    const { id } = req.user;
    const user = await User.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      return res.status(404).json({ success: true, message: "User not found" });
    }

    const groups = await Group.findAll({
      where: {
        ownerId: user.id,
      },
    });

    //@ts-ignore
    return res.send(groups);
  } catch (error) {
    next(error);
  }
};

const getOne = async (
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
    const { id } = req.params;
    const { language } = req.query;

    const group = await Group.findOne({
      where: {
        id,
        forPublic: false,
      },
      include: [
        {
          model: User,
        },
        {
          model: Game,
          as: "game",
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
            },
          ],
          attributes: {
            include: [
              [
                literal(
                  `(SELECT COUNT(*) FROM "UserGames" WHERE "UserGames"."gameId" = "game"."id" AND "UserGames"."willPlay" = true)`
                ),
                "playersCount",
              ],
            ],
          },
        },
      ],
    });

    return res.send(group);
  } catch (error) {
    next(error);
  }
};

const create = async (
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
    const { title } = req.body;
    const group = await Group.create({
      ownerId: userId,
      title,
    });
    await UserGroup.create({
      groupId: group.id,
      userId,
    });
    //@ts-ignore
    return res.send(group);
  } catch (error) {
    next(error);
  }
};

const leaveFromGroup = async (
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
    const { id } = req.params;
    await UserGroup.destroy({
      where: {
        userId,
        groupId: id,
      },
    });

    const games = await Game.findAll({
      where: {
        groupId: id,
      },
    });
    const gameIds = games.map((game) => game.id);

    const userGames = await UserGame.findAll({
      where: {
        userId,
        gameId: gameIds,
      },
    });

    if (userGames?.length) {
      const gameIds = userGames.map((userGame) => userGame.gameId);

      const games = await Game.findAll({
        where: {
          id: gameIds,
        },
      });

      // for (const game of games) {
      //   game.decrement("playersCount", { by: 1 });
      // }
    }

    await UserGame.destroy({
      where: {
        userId,
        gameId: gameIds,
      },
    });
    //@ts-ignore
    return res.send({ success: true });
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
    const { id: userId } = req.user;
    const { id } = req.params;

    const deletedRowsCount = await Group.destroy({
      cascade: true,
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!deletedRowsCount) {
      return res.send({ success: false, messages: "Group not found" });
    }

    return res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

const joinToGroup = async (
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
    const { id, notificationId } = req.body;
    const games = await Game.findAll({
      where: {
        groupId: id,
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

    await UserGroup.create({
      groupId: id,
      userId,
    });

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

    return res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

export default {
  getAll,
  getAllThatUserOwnes,
  getOne,
  create,
  leaveFromGroup,
  remove,
  joinToGroup,
};
