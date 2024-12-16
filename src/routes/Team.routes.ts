import Router from 'express';
import checkRole from '../middlewares/checkRole';
import { ROLES } from '../types/Roles';
import TeamController from '../controllers/Team.controller';
const router = Router();

router.post(
  '/team/create',
  checkRole(ROLES.USER, ROLES.ADMIN, ROLES.STADION_OWNER),
  TeamController.create,
);
router.get(
  '/team/getAll',
  checkRole(ROLES.USER, ROLES.ADMIN, ROLES.STADION_OWNER),
  TeamController.getAll,
);
router.get(
  '/team/getUsers',
  checkRole(ROLES.USER, ROLES.ADMIN, ROLES.STADION_OWNER),
  TeamController.getUsers,
);
router.post(
  '/team/addMember',
  checkRole(ROLES.USER, ROLES.ADMIN, ROLES.STADION_OWNER),
  TeamController.addToTeam,
);
router.delete(
  '/team/delete/:id',
  checkRole(ROLES.USER, ROLES.ADMIN, ROLES.STADION_OWNER),
  TeamController.remove,
);
router.delete(
  '/team/deletePlayer',
  checkRole(ROLES.USER, ROLES.ADMIN, ROLES.STADION_OWNER),
  TeamController.deleteFromTeam,
);

router.get(
  '/team/my',
  checkRole(ROLES.USER, ROLES.ADMIN, ROLES.STADION_OWNER),
  TeamController.getMyTeams,
);

router.post(
  '/team/leave',
  checkRole(ROLES.USER, ROLES.ADMIN, ROLES.STADION_OWNER),
  TeamController.leaveFromTeam,
);

router.post(
  '/team/invite',
  checkRole(ROLES.USER, ROLES.ADMIN, ROLES.STADION_OWNER),
  TeamController.inviteTeamtoGame,
);

router.post(
  '/team/acceptInvitation',
  checkRole(ROLES.ADMIN, ROLES.STADION_OWNER, ROLES.USER),
  TeamController.acceptGameInvitation,
);

router.post(
  '/team/accept',
  checkRole(ROLES.ADMIN, ROLES.STADION_OWNER, ROLES.USER),
  TeamController.acceptTeamInvitation,
);

router.put(
  '/team/givePlayerInfo',
  checkRole(ROLES.USER, ROLES.ADMIN, ROLES.STADION_OWNER),
  TeamController.givePlayerInfo,
);

router.get(
  '/team/:id',
  checkRole(ROLES.USER, ROLES.ADMIN, ROLES.STADION_OWNER),
  TeamController.getOneTeam,
);

export default router;
