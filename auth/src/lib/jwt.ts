import jwt from "jsonwebtoken";
import { Role } from "../generated/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

export const sign_token = (payload: { id: string; role: Role }) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

export const verify_token = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; role: Role };
  } catch {
    return null;
  }
};
