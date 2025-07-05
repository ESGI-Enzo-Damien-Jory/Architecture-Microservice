import { Router, Request, Response } from "express";
import { require_auth } from "../middleware/require_auth";

const router = Router();

router.get("/", require_auth, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({ user });
});

export default router;
