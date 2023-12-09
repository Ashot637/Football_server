import Router from 'express';
import { UserController } from '../controllers';
import checkRole from '../middlewares/checkRole';
import { ROLES } from '../types/Roles';
const router = Router();

router.post('/auth/register', UserController.register);
router.post('/auth/login', UserController.login);
router.get('/auth', checkRole(ROLES.USER, ROLES.ADMIN), UserController.authMe);

export default router;
