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
router.post('/auth/checkPhone', UserController.checkPhone);
router.post('/auth/checkCode', UserController.checkCode);
router.post('/auth/changePassword', UserController.changePassword);
router.post('/auth/logout', checkRole(ROLES.USER), UserController.logout);

router.delete('/user/remove', checkRole(ROLES.USER), UserController.remove);
router.patch('/user/update', checkRole(ROLES.USER), UserController.update);
// router.post('/user/updateStatus', checkRole(ROLES.USER), UserController.updateStatus);

router.get('/user/getAll', checkRole(ROLES.ADMIN), UserController.getAll);
router.get('/user/getOne/:id', checkRole(ROLES.ADMIN), UserController.getOne);

router.get('/auth', checkRole(ROLES.USER, ROLES.ADMIN, ROLES.STADION_OWNER), UserController.authMe);

export default router;
