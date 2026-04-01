import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/auth.service";
import { findUserById } from "../repositories/user.repository";

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing token" });
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = verifyToken(token);
    if (!payload?.userId) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const user = await findUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
