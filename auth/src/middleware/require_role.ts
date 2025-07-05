import { Request, Response, NextFunction } from "express";
import { Role } from "../generated/prisma";

export const require_role = (role: Role) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
};
