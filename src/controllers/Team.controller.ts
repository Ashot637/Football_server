import type { NextFunction, Request, Response } from 'express';
import { Team, TeamPlayer, UserForChat, UserGroup } from '../models';
import { ROLES } from '../types/Roles';
import type { RequestWithUser } from '../types/RequestWithUser';

const create = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { id } = req.user;
    const { name } = req.body;

    const [team, created] = await Team.findOrCreate({
      where: { name },
      defaults: { name, userId: id },
    });

    if (created) {
      const teamPlayer = await TeamPlayer.findAll({ where: { teamId: team.id } });
      await UserForChat.create({ userId: id, chatId: 1, lastSeenMessageTime: undefined });
      return res.status(201).json({ success: true, team });
    } else {
      return res.status(400).json({ success: false, message: 'Team already exists' });
    }
  } catch (error) {
    next(error);
  }
};
const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teams = await Team.findAll();
    return res.status(200).json({ teams });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.query;
    if (!teamId) {
      return res.status(400).json({ success: false, message: 'missing query parametrs' });
    }
    const users = await TeamPlayer.findAll({ where: { teamId: +teamId } });
    return res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

const addToTeam = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id } = req.user;
    const { userIds } = req.body;
    const team = await Team.findOne({ where: { userId: id } });

    const teamId = team?.id;

    const teamPlayers = await TeamPlayer.bulkCreate(
      userIds.map((id: number) => ({
        userId: id,
        teamId,
        playerPosition: null,
        playerStatus: null,
      })),
    );
    await UserForChat.bulkCreate(
      userIds.map((id: number) => ({
        userId: id,
        teamId,
        lastSeenMessageTime: undefined,
      })),
    );
    return res.status(200).json({ success: true, teamPlayers });
  } catch (error) {
    next(error);
  }
};

export default { create, getAll, getUsers, addToTeam };
