import { Router } from "express";
import { getProfile, listUsers, getUser, createUserHandler, updateUserHandler, deleteUserHandler } from "../controllers/users.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);
router.post("/", createUserHandler);
router.get("/me", getProfile);
router.get("/", listUsers);
router.get("/:id", getUser);
router.put("/:id", updateUserHandler);
router.delete("/:id", deleteUserHandler);

export default router;
