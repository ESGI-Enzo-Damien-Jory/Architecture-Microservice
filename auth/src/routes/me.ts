import { Router, Request, Response } from "express";
import { require_auth } from "../middleware/require_auth";

const router = Router();

router.get("/", require_auth, (req: Request, res: Response) => {
  console.log("[ME] User info request started");
  
  const user = (req as any).user;
  
  if (!user) {
    console.log("[ME] No user found in request - authentication middleware failed");
    res.status(401).json({ error: "User not authenticated" });
    return;
  }
  
  console.log(`[ME] Returning user info for user ID: ${user.id}, role: ${user.role}`);
  res.json({ user });
});

export default router;