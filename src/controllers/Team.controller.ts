import type { NextFunction, Request, Response } from 'express';
import {
  Invitation,
  Team,
  TeamChat,
  TeamGame,
  TeamPlayer,
  UserForChat,
  UserGroup,
  Notification,
  User,
} from '../models';
import { ROLES } from '../types/Roles';
import type { RequestWithUser } from '../types/RequestWithUser';
import sendPushNotifications from '../helpers/sendPushNotification';
import { INVITATION_TYPES } from '../models/Invitation.model';

import { Model, Op } from 'sequelize';
import { error } from 'console';

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
      await TeamPlayer.create({
        teamId: team.id,
        userId: id,
        playerPosition: null,
        playerStatus: null,
      });
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

    const { id: userId } = req.user;
    const { id } = req.params;

    const team = await Team.findOne({
      where: { id: id, userId },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found or you do not have access to it',
      });
    }

    await Team.destroy({ where: { id: id } });
    await TeamPlayer.destroy({ where: { id } });
    await TeamGame.destroy({ where: { id } });

    return res.status(204).send();
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
    const users = await TeamPlayer.findAll({
      where: { teamId: +teamId },
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });

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
    await Invitation.findOrCreate({
      where: {
        ip: ipAddress,
        teamId,
        gameId,
        from: teamOwner.name,
        type: INVITATION_TYPES.TEAM,
      },
      defaults: {
        ip: ipAddress,
        teamId,
        gameId,
        from: teamOwner.name,
        type: INVITATION_TYPES.TEAM,
      },
    });

    await Notification.create({
      isNew: true,
      userId: team.userId,
      teamId,
      gameId,
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

    const teams = await TeamPlayer.findAll({
      where: { userId: id },
    });

    if (!teams.length) {
      return res.status(404).json({ success: false, message: 'No teams found' });
    }

    const teamIds = teams.map((teamPlayer) => teamPlayer.teamId);

    const teamDetails = await Team.findAll({
      where: { id: teamIds },
    });

    res.status(200).json({ success: true, teams: teamDetails });
  } catch (error) {
    next(error);
  }
};
const acceptGameInvitation = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { id, gameId } = req.body;

    const invitation = await Invitation.findOne({
      where: {
        id,
      },
    });
    if (!invitation) {
      return res.status(404).json({ success: false });
    }
    const userTeams = await TeamPlayer.findAll({ where: { userId } });

    for (const userTeam of userTeams) {
      if (userTeam.id == id) {
        return res.status(409).json({ success: false });
      }
    }
    const teams = await Team.findAll({
      where: {
        id: invitation.teamId,
      },
    });

    for (const team of teams) {
      const teamGame = await TeamGame.findOne({
        where: {
          teamId: team.id,
          gameId: gameId,
        },
      });

      if (!teamGame) {
        await TeamGame.create({
          teamId: team.id,
          gameId: +gameId,
        });
      }
    }
    const teamChat = await TeamChat.create({
      lastMessageTimestamp: new Date(),
      forPublic: false,
    });
    await UserForChat.create({ userId: id, chatId: teamChat.id, lastSeenMessageTime: undefined });
  } catch (error) {
    next(error);
  }
};
const acceptTeamInvitation = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { id, teamId } = req.body;
    const invitation = await Invitation.findOne({
      where: {
        id,
      },
    });

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }
    if (invitation.type === 'TEAM') {
      const team = await Team.findByPk(teamId);
      if (!team) {
        return res.status(404).send();
      }
      await TeamPlayer.create({ userId: +userId, teamId });
      const chat = await TeamChat.findOne({ where: { teamId } });
      if (chat) {
        await UserForChat.create({ chatId: chat.id, userId });
      }
      await Invitation.destroy({ where: { id } });
      await Notification.create({
        teamId,
        isNew: true,
        userId,
      });
    }
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const deleteFromTeam = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { id, teamId } = req.body;
    const teamOwner = await Team.findAll({ where: { userId, id: teamId } });
    if (!teamOwner) {
      return res.status(404).json({ success: false });
    }
    await TeamPlayer.destroy({
      where: {
        userId: id,
        teamId,
      },
    });
    const teamChat = await TeamChat.findByPk(teamId);
    if (!teamChat) {
      return res.status(404).json({ success: false });
    }
    await UserForChat.destroy({ where: { userId: id, chatId: teamChat.id } });
    return res.status(200).send();
  } catch (error) {
    next(error);
  }
};

const givePlayerInfo = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id: userId } = req.user;
    const { id, number, position, teamId } = req.body;

    await TeamPlayer.update(
      {
        playerNumber: number,
        playerPosition: position,
      },
      {
        where: {
          teamId: teamId,
          userId: id,
        },
      },
    );

    return res.status(200).send();
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
  leaveFromTeam,
  getOneTeam,
  inviteTeamtoGame,
  getMyTeams,
  acceptGameInvitation,
  acceptTeamInvitation,
  deleteFromTeam,
  givePlayerInfo,
};
