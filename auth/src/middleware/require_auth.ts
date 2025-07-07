import { verify_access_token } from "../lib/jwt";
import { Request, Response, NextFunction } from "express";

export const require_auth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  console.log(`[AUTH_MIDDLEWARE] Authentication check started for ${req.method} ${req.path}`);
  
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    const duration = Date.now() - startTime;
    console.log(`[AUTH_MIDDLEWARE] Missing token (${duration}ms)`);
    res.status(401).json({ error: "Missing token" });
    return;
  }

  console.log("[AUTH_MIDDLEWARE] Token found, verifying...");
  const payload = verify_access_token(token);
  
  if (!payload) {
    const duration = Date.now() - startTime;
    console.log(`[AUTH_MIDDLEWARE] Invalid token (${duration}ms)`);
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const duration = Date.now() - startTime;
  console.log(`[AUTH_MIDDLEWARE] Authentication successful for user ID: ${payload.id}, role: ${payload.role} (${duration}ms)`);
  
  (req as any).user = payload;
  next();
};