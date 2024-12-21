import Router from 'express';
import checkRole from '../middlewares/checkRole';
import { ROLES } from '../types/Roles';
import TeamController from '../controllers/Team.controller';

const router = Router();

const DEFAULT_ROLES = [ROLES.USER, ROLES.ADMIN, ROLES.STADION_OWNER];

router
  .route('/team')
  .post(checkRole(...DEFAULT_ROLES), TeamController.create)
  .get(checkRole(...DEFAULT_ROLES), TeamController.getAll);

router.post('/team/addMember', checkRole(...DEFAULT_ROLES), TeamController.addToTeam);
router.post('/team/leave', checkRole(...DEFAULT_ROLES), TeamController.leaveFromTeam);
router.delete('/team/deletePlayer', checkRole(...DEFAULT_ROLES), TeamController.deleteFromTeam);
router.get('/team/getUsers', checkRole(...DEFAULT_ROLES), TeamController.getUsers);

router.post('/team/game/create', checkRole(...DEFAULT_ROLES), TeamController.createGameFromTeam);
router.post('/team/game/invite', checkRole(...DEFAULT_ROLES), TeamController.inviteTeamtoGame);
router.post(
  '/team/game/invitation/accept',
  checkRole(...DEFAULT_ROLES),
  TeamController.acceptGameInvitation,
);
router.post(
  '/team/invitation/accept',
  checkRole(...DEFAULT_ROLES),
  TeamController.acceptTeamInvitation,
);

router.get('/team/my', checkRole(...DEFAULT_ROLES), TeamController.getMyTeams);
router.get('/team/:id', checkRole(...DEFAULT_ROLES), TeamController.getOneTeam);

router.put('/team/givePlayerInfo', checkRole(...DEFAULT_ROLES), TeamController.givePlayerInfo);

router.delete('/team/delete/:id', checkRole(...DEFAULT_ROLES), TeamController.remove);

export default router;
