import { Router } from "express";
import { 
  getDashboardOverview, 
  getSummary, 
  getTrends 
} from "../controllers/dashboard.controller";

const router = Router();

router.get("/", getDashboardOverview);
router.get("/summary", getSummary);
router.get("/trends", getTrends);

export default router;
