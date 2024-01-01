import Router from 'express';
import { FacilitieController } from '../controllers';
const router = Router();

router.post('/facilitie/create', FacilitieController.create);
router.get('/facilitie/getAll', FacilitieController.getAll);
router.get('/facilitie/getOne/:id', FacilitieController.getOne);
router.delete('/facilitie/delete', FacilitieController.remove);
router.patch('/facilitie/update/:id', FacilitieController.update);

export default router;
