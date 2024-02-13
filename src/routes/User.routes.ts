import Router from 'express';
import { UserController } from '../controllers';
import checkRole from '../middlewares/checkRole';
import { ROLES } from '../types/Roles';

const router = Router();

router.post('/auth/register', UserController.register);
router.post('/auth/login', UserController.login);
router.post('/auth/generateCode', UserController.generateUserCode);
router.post('/auth/resend', UserController.regenerateUserCode);
router.post('/auth/verifyCode', UserController.code);
router.post('/auth/logout', checkRole(ROLES.USER), UserController.logout);

router.delete('/user/remove', checkRole(ROLES.USER), UserController.remove);
router.patch('/user/update', checkRole(ROLES.USER), UserController.update);

router.get('/user/getAll', checkRole(ROLES.ADMIN), UserController.getAll);
router.get('/user/getOne/:id', checkRole(ROLES.ADMIN), UserController.getOne);

router.get('/auth', checkRole(ROLES.USER, ROLES.ADMIN), UserController.authMe);

export default router;
