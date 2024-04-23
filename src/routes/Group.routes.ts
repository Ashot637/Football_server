import Router from "express";
import checkRole from "../middlewares/checkRole";
import { ROLES } from "../types/Roles";
import { GroupController } from "../controllers";

const router = Router();

router.get("/group/getAll", checkRole(ROLES.USER), GroupController.getAll);
router.get("/group/getOne/:id", checkRole(ROLES.USER), GroupController.getOne);
router.post("/group/create", checkRole(ROLES.USER), GroupController.create);
router.delete(
  "/group/leave/:id",
  checkRole(ROLES.USER),
  GroupController.leaveFromGrop
);

export default router;
