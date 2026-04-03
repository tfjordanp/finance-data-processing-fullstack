import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/auth.service";
import { findUserById } from "../repositories/user.repository";
import { User } from "../models/User";

export interface AuthRequest extends Request {
  user?: { id: string; email: string, role: User["role"] };
}

export interface AuthorizeParams {
  allowedRoles?: User['role'][];
  unallowedRoles?: User['role'][];
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
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const authorize = (rule?: AuthorizeParams) => async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!rule){
    rule = {};
  }
    // req.user.role was populated by your authentication middleware
    const userRole = req.user?.role; 

    if (!userRole) {
      return res.status(401).json({ message: "Unauthorized: No role found" });
    }

    const { allowedRoles, unallowedRoles } = rule;

    // 1. If allowed roles are defined, use ONLY that logic
    if (allowedRoles && allowedRoles.length > 0) {
      if (allowedRoles.includes(userRole)) {
        return next();
      }
      return res.status(403).json({ message: "Forbidden: Role not allowed" });
    }

    // 2. If no allowed roles, check unallowed roles
    if (unallowedRoles && unallowedRoles.length > 0) {
      if (unallowedRoles.includes(userRole)) {
        return res.status(403).json({ message: "Forbidden: Role is explicitly restricted" });
      }
      return next();
    }

    // 3. If both fields are empty, all roles are allowed
    next();
  };


