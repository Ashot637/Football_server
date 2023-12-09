import Router from 'express';
import { GameController } from '../controllers';
import checkRole from '../middlewares/checkRole';
import { ROLES } from '../types/Roles';
const router = Router();

router.post('/game/create', GameController.create);
router.get('/game/getAll', GameController.getAll);
router.get('/game/getOne/:id', GameController.getOne);
router.post('/game/register/:gameId', checkRole(ROLES.USER), GameController.register);

export default router;
