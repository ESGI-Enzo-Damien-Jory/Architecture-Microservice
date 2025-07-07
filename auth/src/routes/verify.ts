import { Router, Request, Response } from "express";
import { verify_access_token } from "../lib/jwt";

const router = Router();

router.post("/", (req: Request, res: Response): void => {
  const startTime = Date.now();
  console.log("[VERIFY] Token verification request started");

  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    console.log("[VERIFY] No token provided in Authorization header");
    res.status(400).json({ 
      valid: false, 
      error: "No token provided in Authorization header" 
    });
    return;
  }

  console.log("[VERIFY] Verifying access token");

  const payload = verify_access_token(token);
  
  if (!payload) {
    const duration = Date.now() - startTime;
    console.log(`[VERIFY] Invalid token (${duration}ms)`);
    res.status(401).json({ 
      valid: false, 
      error: "Invalid or expired token" 
    });
    return;
  }

  const duration = Date.now() - startTime;
  console.log(`[VERIFY] Valid token for user ID: ${payload.id}, role: ${payload.role} (${duration}ms)`);

  res.json({
    valid: true,
    user: {
      id: payload.id,
      role: payload.role,
    },
  });
});

export default router;