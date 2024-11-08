import Router from 'express';
import checkRole from '../middlewares/checkRole';
import { ROLES } from '../types/Roles';
import ChatController from '../controllers/Chat.controller';
const router = Router();

router.post('/chat/sendMessage', checkRole(ROLES.USER), ChatController.send);
router.post('/chat/create', checkRole(ROLES.USER), ChatController.create);
export default router;
