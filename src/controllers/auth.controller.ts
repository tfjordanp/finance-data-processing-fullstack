import { Request, Response } from "express";
import { findUserByEmail } from "../repositories/user.repository";
import { comparePassword, signToken } from "../services/auth.service";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await findUserByEmail(email.toLowerCase());
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({ userId: user.id });
  return res.json({ id: user.id, email: user.email, token });
};
