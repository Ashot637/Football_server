import Router from 'express';
import { StadionController } from '../controllers';
const router = Router();

router.post('/stadion/create', StadionController.create);
router.get('/stadion/getAll', StadionController.getAll);
router.get('/stadion/getOne/:id', StadionController.getOne);
router.get('/stadion/search', StadionController.search);
router.delete('/stadion/delete', StadionController.remove);
router.patch('/stadion/update/:id', StadionController.update);

export default router;
