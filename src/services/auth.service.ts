import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";

const secret: jwt.Secret = process.env.JWT_SECRET || "secret";
const expiresIn = process.env.JWT_EXPIRES_IN || "1h";

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const signToken = (payload: { userId: string }) => {
  return jwt.sign(payload, secret as jwt.Secret, { expiresIn } as jwt.SignOptions);
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, secret as jwt.Secret) as { userId: string };
};
