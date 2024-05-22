import Router from "express";
import checkRole from "../middlewares/checkRole";
import { ROLES } from "../types/Roles";
import { GroupController } from "../controllers";

const router = Router();

router.get("/group/getAll", checkRole(ROLES.USER), GroupController.getAll);
router.get(
  "/group/getAllThatUserOwnes",
  checkRole(ROLES.USER),
  GroupController.getAllThatUserOwnes
);
router.get("/group/getOne/:id", checkRole(ROLES.USER), GroupController.getOne);
router.post("/group/create", checkRole(ROLES.USER), GroupController.create);
router.post(
  "/group/joinToGroup",
  checkRole(ROLES.USER),
  GroupController.joinToGroup
);

router.delete(
  "/group/delete/:id",
  checkRole(ROLES.USER),
  GroupController.remove
);
router.delete(
  "/group/leave/:id",
  checkRole(ROLES.USER),
  GroupController.leaveFromGroup
);

export default router;
