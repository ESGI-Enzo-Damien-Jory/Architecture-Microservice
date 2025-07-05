import { Router, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { sign_token } from "../lib/jwt";
import { prisma } from "../lib/prisma";

const router = Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid data" });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = sign_token({ id: user.id, role: user.role });
  res.json({ token });
});

export default router;
