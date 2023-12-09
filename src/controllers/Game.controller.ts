import type { NextFunction, Request, Response } from 'express';
import { Game, Stadion, User, UserGame } from '../models';
import { type RequestWithUser } from '../types/RequestWithUser';

interface CreateRequest {
  startTime: Date;
  endTime: Date;
  maxPlayersCount: number;
  stadionId: number;
}

export const create = async (
  req: Request<{}, {}, CreateRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { startTime, endTime, maxPlayersCount, stadionId } = req.body;

    const game = await Game.create({
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

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const games = await Game.findAll({
      include: [{ model: Stadion, as: 'stadion' }],
    });

    res.send(games);
  } catch (error) {
    next(error);
  }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const game = await Game.findByPk(id, {
      include: [
        { model: Stadion, as: 'stadion' },
        { model: User, as: 'users', attributes: { exclude: ['password'] } },
      ],
    });

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    res.send(game);
  } catch (error) {
    next(error);
  }
};

export const register = async (req: RequestWithUser, res: Response, next: NextFunction) => {
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

    if (game.playersCount === game.maxPlayersCount) {
      return res.status(403).json({ success: false, message: 'Already have maximum players' });
    }

    await UserGame.create({
      userId,
      gameId: +gameId,
    });

    game.playersCount = game?.playersCount ? ++game.playersCount : 1;
    await game.save();

    res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

export default {
  create,
  getAll,
  getOne,
  register,
};
