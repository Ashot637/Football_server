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
  '/team/delete',
  checkRole(ROLES.USER, ROLES.ADMIN, ROLES.STADION_OWNER),
  TeamController.remove,
);
router.delete(
  '/team/deletePlayer',
  checkRole(ROLES.USER, ROLES.ADMIN, ROLES.STADION_OWNER),
  TeamController.reamoveForTeam,
);

export default router;
