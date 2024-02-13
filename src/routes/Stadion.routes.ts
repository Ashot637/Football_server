import Router from 'express';
import { StadionController } from '../controllers';
import { ROLES } from '../types/Roles';
import checkRole from '../middlewares/checkRole';
const router = Router();

router.get('/stadion/getAll', StadionController.getAll);
router.get('/stadion/getAllForUser', StadionController.getAllForUser);
router.get('/stadion/getOne/:id', StadionController.getOne);
router.get('/stadion/search', StadionController.search);

router.post('/stadion/create', checkRole(ROLES.ADMIN), StadionController.create);
router.delete('/stadion/delete', checkRole(ROLES.ADMIN), StadionController.remove);
router.patch('/stadion/update/:id', checkRole(ROLES.ADMIN), StadionController.update);

export default router;
