import { verify_access_token } from "../lib/jwt";
import { Request, Response, NextFunction } from "express";

export const require_auth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Missing token" });
    return;
  }

  const payload = verify_access_token(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  (req as any).user = payload;
  next();
};