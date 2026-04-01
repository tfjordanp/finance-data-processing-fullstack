import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./users.routes";
import transactionRoutes from "./transactions.routes";
import categoryRoutes from "./categories.routes";

const router = Router();
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/transactions", transactionRoutes);
router.use("/categories", categoryRoutes);

export default router;
