import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { getAllCategories } from "../repositories/category.repository";

export const listCategories = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const categories = await getAllCategories();
  return res.json(categories);
};
