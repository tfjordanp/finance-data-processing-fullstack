import { Router } from "express";
import { login } from "../controllers/auth.controller";
import { authLimiter } from "../middleware/rate-limit.middleware";

const router = Router();
router.use(authLimiter);
router.post("/login", login);

export default router;
