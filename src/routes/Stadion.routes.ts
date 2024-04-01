import Router from 'express';
import { StadionController } from '../controllers';
import { ROLES } from '../types/Roles';
import checkRole from '../middlewares/checkRole';
const router = Router();

router.get('/stadion/getAllForUser', StadionController.getAllForUser);
router.get('/stadion/getOne/:id', StadionController.getOne);
router.get('/stadion/search', StadionController.search);

router.get(
  '/stadion/getAll',
  checkRole(ROLES.ADMIN, ROLES.STADION_OWNER),
  StadionController.getAll,
);
router.post('/stadion/create', checkRole(ROLES.ADMIN), StadionController.create);
router.get(
  '/stadion/getAllNotifications',
  checkRole(ROLES.STADION_OWNER),
  StadionController.getAllNotifications,
);
router.delete('/stadion/delete', checkRole(ROLES.ADMIN), StadionController.remove);
router.patch('/stadion/update/:id', checkRole(ROLES.ADMIN), StadionController.update);

export default router;
