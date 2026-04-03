import { Router } from "express";
import { getProfile, listUsers, getUser, createUserHandler, updateUserHandler, deleteUserHandler } from "../controllers/users.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);
router.get("/me", authorize(), getProfile,);

router.use(authorize({allowedRoles:['admin']}));
router.post("/", createUserHandler);
router.get("/", listUsers);
router.get("/:id", getUser);
router.put("/:id", updateUserHandler);
router.delete("/:id", deleteUserHandler);

export default router;
