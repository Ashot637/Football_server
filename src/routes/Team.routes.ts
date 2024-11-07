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
router.get('/team/getAll', checkRole(ROLES.USER), TeamController.getAll);
router.get('/team/getUsers', checkRole(ROLES.USER), TeamController.getUsers);
router.post('/team/addMember', checkRole(ROLES.USER), TeamController.addToTeam);
export default router;
