import { Router } from "express";
import { listTransactions, createTransactionHandler, getTransaction, updateTransactionHandler, removeTransaction } from "../controllers/transactions.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);
router.get("/", listTransactions);
router.post("/", createTransactionHandler);
router.get("/:id", getTransaction);
router.patch("/:id", updateTransactionHandler);
router.delete("/:id", removeTransaction);

export default router;
