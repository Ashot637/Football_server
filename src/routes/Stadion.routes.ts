import Router from 'express';
import { StadionController } from '../controllers';
const router = Router();

router.post('/stadion/create', StadionController.create);

export default router;
