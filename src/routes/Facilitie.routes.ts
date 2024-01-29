import Router from 'express';
import { FacilitieController } from '../controllers';
import checkRole from '../middlewares/checkRole';
import { ROLES } from '../types/Roles';
const router = Router();

router.post('/facilitie/create', checkRole(ROLES.ADMIN), FacilitieController.create);
router.get('/facilitie/getAll', checkRole(ROLES.ADMIN), FacilitieController.getAll);
router.get('/facilitie/getOne/:id', checkRole(ROLES.ADMIN), FacilitieController.getOne);
router.delete('/facilitie/delete', checkRole(ROLES.ADMIN), FacilitieController.remove);
router.patch('/facilitie/update/:id', checkRole(ROLES.ADMIN), FacilitieController.update);

export default router;
