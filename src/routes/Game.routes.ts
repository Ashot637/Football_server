import Router from 'express';
import { GameController } from '../controllers';
import checkRole from '../middlewares/checkRole';
import { ROLES } from '../types/Roles';

const router = Router();

router.post('/game/create', GameController.create);
router.get('/game/getAll', GameController.getAll);
router.get('/game/getAll', GameController.getAll);
router.get('/game/getByStadionId/:stadionId', GameController.getByStadionId);
router.get('/game/getOne/:id', GameController.getOne);
router.get('/game/getUpcomings', checkRole(ROLES.USER), GameController.getUpcomingGames);
router.get('/game/getActivity', checkRole(ROLES.USER), GameController.getActivity);
router.post('/game/cancel/:gameId', checkRole(ROLES.USER), GameController.cancel);
router.post('/game/register/:gameId', checkRole(ROLES.USER), GameController.register);
router.delete('/game/delete', GameController.remove);
router.patch('/game/update/:id', GameController.update);

export default router;
