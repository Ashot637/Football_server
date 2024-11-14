import Router from 'express';
import checkRole from '../middlewares/checkRole';
import { ROLES } from '../types/Roles';
import ChatController from '../controllers/Chat.controller';
const router = Router();

router.post('/chat/sendMessage', checkRole(ROLES.USER), ChatController.send);
router.post('/chat/create', checkRole(ROLES.USER), ChatController.create);

router.post('/chat/deleteMessage', checkRole(ROLES.USER), ChatController.deleteMessage);

router.post('/chat/readChatMessages', checkRole(ROLES.USER), ChatController.readChatMessage);
router.post('/chat/react', checkRole(ROLES.USER), ChatController.onReactToMessage);

export default router;
