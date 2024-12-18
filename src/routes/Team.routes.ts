import Router from 'express';
import checkRole from '../middlewares/checkRole';
import { ROLES } from '../types/Roles';
import TeamController from '../controllers/Team.controller';

const router = Router();

// Роли, применяемые для большинства маршрутов
const DEFAULT_ROLES = [ROLES.USER, ROLES.ADMIN, ROLES.STADION_OWNER];

// Общие маршруты команды
router
  .route('/team')
  .post(checkRole(...DEFAULT_ROLES), TeamController.create) // Создать команду
  .get(checkRole(...DEFAULT_ROLES), TeamController.getAll); // Получить все команды

// Управление участниками команды
router.post('/team/addMember', checkRole(...DEFAULT_ROLES), TeamController.addToTeam);
router.post('/team/leave', checkRole(...DEFAULT_ROLES), TeamController.leaveFromTeam);
router.delete('/team/deletePlayer', checkRole(...DEFAULT_ROLES), TeamController.deleteFromTeam);

// Управление играми
router.post('/team/game/create', checkRole(...DEFAULT_ROLES), TeamController.createGameFromTeam);
router.post('/team/game/invite', checkRole(...DEFAULT_ROLES), TeamController.inviteTeamtoGame);
router.post(
  '/team/game/invitation/accept',
  checkRole(...DEFAULT_ROLES),
  TeamController.acceptGameInvitation,
);

router.post('/team/accept', checkRole(...DEFAULT_ROLES), TeamController.acceptTeamInvitation);

router.get('/team/my', checkRole(...DEFAULT_ROLES), TeamController.getMyTeams);
router.get('/team/:id', checkRole(...DEFAULT_ROLES), TeamController.getOneTeam);

router.put('/team/givePlayerInfo', checkRole(...DEFAULT_ROLES), TeamController.givePlayerInfo);

router.delete('/team/delete/:id', checkRole(...DEFAULT_ROLES), TeamController.remove);

export default router;
