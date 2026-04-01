import { Router } from "express";
import { listCategories } from "../controllers/categories.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);
router.get("/", listCategories);

export default router;
