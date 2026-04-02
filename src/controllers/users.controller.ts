import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { findUserByEmail, findUserById, getAllUsers, createUser, updateUser, deleteUser } from "../repositories/user.repository";
import { hashPassword } from "../services/auth.service";
import { UserFilterDto } from "../dtos/filters.dto";

import { User } from "../models/User";

export type UserPayload = Omit<User, "id" | "createdAt">;

export const toUserPayload = (body: any): UserPayload | null => {
  const allowedGenders = ["male", "female", "other"] as const;
  if (
    !!body &&
    typeof body.email === "string" &&
    !!body.email.trim() &&
    typeof body.password === "string" &&
    !!body.password.trim() &&
    typeof body.dateOfBirth === "string" &&
    !!body.dateOfBirth.trim() &&
    typeof body.gender === "string" &&
    allowedGenders.includes(body.gender) &&
    typeof body.isActive === "boolean"
  ) {
    return {
      email: body.email,
      password: body.password,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
      isActive: body.isActive
    };
  }
  return null;
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const user = await findUserById(userId);
  if (!user) return res.status(404).json({ message: "Not found" });

  return res.json({ id: user.id, email: user.email, dateOfBirth: user.dateOfBirth, gender: user.gender, isActive: user.isActive, createdAt: user.createdAt });
};

export const createUserHandler = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const payload = toUserPayload(req.body);
  if (!payload) {
    return res.status(400).json({ message: "All user fields are required" });
  }

  const existing = await findUserByEmail(payload.email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const created = await createUser({
    email: payload.email.toLowerCase(),
    password: await hashPassword(payload.password),
    dateOfBirth: payload.dateOfBirth,
    gender: payload.gender,
    isActive: payload.isActive
  });

  return res.status(201).json({ id: created.id, email: created.email, dateOfBirth: created.dateOfBirth, gender: created.gender, isActive: created.isActive, createdAt: created.createdAt });
};

export const listUsers = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const filters: UserFilterDto = {
    email: req.query.email as string | undefined,
    dateOfBirthStart: req.query.dateOfBirthStart as string | undefined,
    dateOfBirthEnd: req.query.dateOfBirthEnd as string | undefined,
    invertDateOfBirth: req.query.invertDateOfBirth === "true",
    gender: req.query.gender as User["gender"] | undefined,
    isActive: req.query.isActive !== undefined ? req.query.isActive === "true" : undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    sortBy: typeof req.query.sortBy === "string" ? req.query.sortBy.split(",") : undefined,
    sortOrder: typeof req.query.sortOrder === "string" ? req.query.sortOrder.split(",") : undefined
  };

  const users = await getAllUsers(filters);
  return res.json(users);
};

export const getUser = async (req: AuthRequest, res: Response) => {
  const targetId = String(req.params.id);
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  if (userId !== targetId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const user = await findUserById(targetId);
  if (!user) return res.status(404).json({ message: "Not found" });

  return res.json({ id: user.id, email: user.email, dateOfBirth: user.dateOfBirth, gender: user.gender, isActive: user.isActive, createdAt: user.createdAt });
};

export const updateUserHandler = async (req: AuthRequest, res: Response) => {
  const targetId = String(req.params.id);
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  if (userId !== targetId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const payload = toUserPayload(req.body);
  if (!payload) {
    return res.status(400).json({ message: "All user fields are required" });
  }

  const normalizedEmail = payload.email.toLowerCase();
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser && existingUser.id !== targetId) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const updatePayload: any = {
    email: normalizedEmail,
    password: await hashPassword(payload.password),
    dateOfBirth: payload.dateOfBirth,
    gender: payload.gender,
    isActive: payload.isActive
  };

  const updated = await updateUser(targetId, updatePayload);
  if (!updated) return res.status(404).json({ message: "Not found" });

  return res.json({
    id: updated.id,
    email: updated.email,
    dateOfBirth: updated.dateOfBirth,
    gender: updated.gender,
    isActive: updated.isActive,
    createdAt: updated.createdAt
  });
};

export const deleteUserHandler = async (req: AuthRequest, res: Response) => {
  const targetId = String(req.params.id);
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  if (userId !== targetId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const result = await deleteUser(targetId);
  if (result.affected === 0) return res.status(404).json({ message: "Not found" });

  return res.status(204).send();
};
