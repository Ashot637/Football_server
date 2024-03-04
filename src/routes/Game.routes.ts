import Router from 'express';
import { GameController } from '../controllers';
import checkRole from '../middlewares/checkRole';
import { ROLES } from '../types/Roles';

const router = Router();

router.get('/game/getAll', GameController.getAll);
router.get('/game/getByStadionId/:stadionId', GameController.getByStadionId);
router.get('/game/getOne/:id', GameController.getOne);
router.get('/game/getUpcomings', checkRole(ROLES.USER), GameController.getUpcomingGames);
router.get('/game/getActivity', checkRole(ROLES.USER), GameController.getActivity);
router.post('/game/cancel/:gameId', checkRole(ROLES.USER), GameController.cancel);
router.post('/game/register/:gameId', checkRole(ROLES.USER), GameController.register);
router.get('/game/getAllCreated', checkRole(ROLES.USER), GameController.getAllCreated);

router.post('/game/organizerCreate', checkRole(ROLES.USER), GameController.organizerCreate);
router.post('/game/extendGame', checkRole(ROLES.USER), GameController.extendGame);
router.post('/game/acceptInvitation', checkRole(ROLES.USER), GameController.acceptInvitation);
router.post('/game/declineInvitation', checkRole(ROLES.USER), GameController.declineInvitation);

// router.post('/game/create', checkRole(ROLES.ADMIN), GameController.create);
router.post('/game/create', GameController.create);
router.delete('/game/delete', checkRole(ROLES.ADMIN), GameController.remove);
router.patch('/game/update/:id', checkRole(ROLES.ADMIN), GameController.update);

export default router;
