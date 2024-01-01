import Router from 'express';
import { UserController } from '../controllers';
import checkRole from '../middlewares/checkRole';
import { ROLES } from '../types/Roles';
const router = Router();

router.post('/auth/register', UserController.register);
router.post('/auth/login', UserController.login);
router.post('/auth/verifyCode', UserController.code);
router.get('/auth', checkRole(ROLES.USER, ROLES.ADMIN), UserController.authMe);
router.patch('/user/update', checkRole(ROLES.USER), UserController.update);
router.get('/user/getAll', UserController.getAll);

export default router;
