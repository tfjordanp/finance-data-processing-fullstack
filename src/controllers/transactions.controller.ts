import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { createTransaction, getAllTransactions, getTransactionById, updateTransaction, deleteTransaction } from "../repositories/transaction.repository";

import { Transaction } from "../models/Transaction";

export type TransactionPayload = Omit<Transaction, "id" | "category">;

const isDateNotInFuture = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date <= now;
};


export const toTransactionPayload = (body: any): TransactionPayload | null => {
  /* 
   if validation fails becaues of date being in the future, then it is better to provide a more descriptive feedback rather than a generic "Invalid Payload".
    The impl is left as such for simplicity, this comment is meant to be a note for improvement in the future when we can have more time to refactor the validation logic and error handling
   */
  if (
    !!body &&
    typeof body.amount === "number" &&
    ["income", "expense"].includes(body.type) &&
    typeof body.categoryId === "string" &&
    !!body.categoryId.trim() &&
    typeof body.date === "string" &&
    !!body.date.trim() &&
    isDateNotInFuture(body.date) &&
    (body.notes === undefined || typeof body.notes === "string")
  ) {
    return {
      amount: body.amount,
      type: body.type,
      categoryId: body.categoryId,
      date: body.date,
      notes: body.notes
    };
  }
  return null;
};

export const toTransactionUpdatePayload = (body: any): Partial<TransactionPayload> | null => {
  if (!body || typeof body !== "object") return null;
  const { amount, type, categoryId, date, notes } = body;
  if (amount !== undefined && typeof amount !== "number") return null;
  if (type !== undefined && !["income", "expense"].includes(type)) return null;
  if (categoryId !== undefined && typeof categoryId !== "string") return null;
  if (date !== undefined && (!date || !isDateNotInFuture(date))) return null;
  if (notes !== undefined && typeof notes !== "string") return null;

  const update: Partial<TransactionPayload> = {};
  if (amount !== undefined) update.amount = amount;
  if (type !== undefined) update.type = type;
  if (categoryId !== undefined) update.categoryId = categoryId;
  if (date !== undefined) update.date = date;
  if (notes !== undefined) update.notes = notes;

  return update;
};

export const listTransactions = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const records = await getAllTransactions();
  return res.json(records);
};

export const createTransactionHandler = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const payload = toTransactionPayload(req.body);
  if (!payload) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const { amount, type, categoryId, date, notes } = payload;
  const tx = await createTransaction({
    amount,
    type,
    category: { id: categoryId } as any,
    date,
    notes: notes || "",
  });

  return res.status(201).json(tx);
};

export const getTransaction = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const id = String(req.params.id);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const tx = await getTransactionById(id);
  if (!tx) return res.status(404).json({ message: "Not found" });
  return res.json(tx);
};

export const removeTransaction = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const id = String(req.params.id);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const tx = await getTransactionById(id);
  if (!tx) return res.status(404).json({ message: "Not found" });

  await deleteTransaction(id);
  return res.status(204).send();
};

export const updateTransactionHandler = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const id = String(req.params.id);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const payload = toTransactionUpdatePayload(req.body);
  if (!payload) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const updated = await updateTransaction(id, {
    ...(payload.amount !== undefined ? { amount: payload.amount } : {}),
    ...(payload.type !== undefined ? { type: payload.type } : {}),
    ...(payload.categoryId !== undefined ? { category: { id: payload.categoryId } as any } : {}),
    ...(payload.date !== undefined ? { date: payload.date } : {}),
    ...(payload.notes !== undefined ? { notes: payload.notes } : {})
  });

  if (!updated) return res.status(404).json({ message: "Not found" });
  return res.json(updated);
};
