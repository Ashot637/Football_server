import type { NextFunction, Request, Response } from 'express';
import {
  Invitation,
  Team,
  TeamChat,
  TeamGame,
  TeamPlayer,
  UserForChat,
  UserGroup,
} from '../models';
import { ROLES } from '../types/Roles';
import type { RequestWithUser } from '../types/RequestWithUser';
import sendPushNotifications from '../helpers/sendPushNotification';
import { INVITATION_TYPES } from '../models/Invitation.model';

import { Op } from 'sequelize';

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
      const teamChat = await TeamChat.create({
        lastMessageTimestamp: new Date(),
        forPublic: false,
      });
      await UserForChat.create({ userId: id, chatId: teamChat.id, lastSeenMessageTime: undefined });

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

const remove = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { id } = req.user;
    const user = await Team.findAll({ where: { userId: id } });
    if (!user) {
      return res.status(400).json({ success: false });
    }
    const { teamId } = req.params;
    const team = await Team.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ success: false });
    }
    await Team.destroy({ where: { id: teamId } });
    await TeamPlayer.destroy({ where: { teamId } });
    await TeamGame.destroy({ where: { teamId } });
    return res.status(202).json({ success: true });
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
    const user = await Team.findAll({ where: { userId: id } });
    if (!user) {
      return res.status(400).json({ success: false });
    }
    const { userIds, teamId } = req.body;
    const team = await TeamPlayer.findOne({ where: { userId: id, teamId } });

    if (!team) {
      return res.status(404).json({ success: false });
    }

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

const reamoveForTeam = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id } = req.user;
    const user = await Team.findAll({ where: { userId: id } });
    if (!user) {
      return res.status(400).json({ success: false });
    }
    const { userId, teamId } = req.body;

    const teamPlayer = await TeamPlayer.findOne({ where: { teamId, userId } });
    if (!teamPlayer) {
      return res.status(404).json({ success: false });
    }
    await TeamPlayer.destroy({
      where: {
        teamId,
        userId,
      },
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const getOneTeam = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { id } = req.params;
    const team = await Team.findByPk(id);
    return res.status(200).json({ team });
  } catch (error) {
    next(error);
  }
};

const leaveFromTeam = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id } = req.user;
    await TeamPlayer.destroy({ where: { userId: id } });
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const inviteTeamtoGame = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const ipAddress = req.headers['x-forwarded-for'] as string;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id } = req.user;
    const { teamId, gameId } = req.body;
    const teamOwner = await Team.findOne({ where: { userId: id } });
    if (!teamOwner) {
      return res.status(400).json({ success: false });
    }
    const team = await Team.findOne({ where: { id: teamId } });
    if (!team) {
      return res.status(400).json({ success: false });
    }
    Invitation.create({
      ip: ipAddress,
      teamId,
      gameId,
      from: teamOwner.name,
      type: INVITATION_TYPES.TEAM,
    });
    await sendPushNotifications([String(team?.userId)], 'Your Team invited to game');
    return res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const getMyTeams = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { id } = req.user;

    const teams = await TeamPlayer.findAll({ where: { userId: id } });
    if (!teams) {
      return res.status(400).json({ success: false });
    }

    const teamIds = teams.map((teamPlayer) => teamPlayer.teamId);

    if (!teamIds) {
      return res.status(400).json({ success: false });
    }
    console.log('========================================================================');

    console.log(teams, '                ', teamIds);
    console.log('========================================================================');
    const userTeams = await Team.findAll({
      where: {
        id: {
          [Op.in]: teamIds,
        },
      },
    });

    res.status(200).json({ success: true, teams: userTeams });
  } catch (error) {
    next(error);
  }
};
export default {
  create,
  getAll,
  remove,
  getUsers,
  addToTeam,
  reamoveForTeam,
  leaveFromTeam,
  getOneTeam,
  inviteTeamtoGame,
  getMyTeams,
};
