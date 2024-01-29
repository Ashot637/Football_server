import Router from 'express';
import { MessageController } from '../controllers';
import checkRole from '../middlewares/checkRole';
import { ROLES } from '../types/Roles';
const router = Router();

router.get('/message/getAllGroups', checkRole(ROLES.USER), MessageController.getAllGroups);
router.get('/message/getGroupMessages', checkRole(ROLES.USER), MessageController.getGroupMessages);
router.post('/message/send', checkRole(ROLES.USER), MessageController.send);
router.post('/message/delete', checkRole(ROLES.USER), MessageController.deleteMessage);
router.post(
  '/message/markUserMessagesRead',
  checkRole(ROLES.USER),
  MessageController.markUserMessagesRead,
);
router.post(
  '/message/readGroupMessages',
  checkRole(ROLES.USER),
  MessageController.readGroupMessages,
);
router.post('/message/react', checkRole(ROLES.USER), MessageController.onReactToMessage);

export default router;
