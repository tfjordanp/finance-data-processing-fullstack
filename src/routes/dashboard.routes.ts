import { Router } from "express";
import { 
  getDashboardOverview, 
  getSummary, 
  getTrends 
} from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);
router.get("/", getDashboardOverview);
router.get("/summary", getSummary);
router.get("/trends", getTrends);

export default router;
