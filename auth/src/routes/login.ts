import { Router, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { sign_token } from "../lib/jwt";
import { prisma } from "../lib/prisma";

const router = Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  console.log("[AUTH] Login attempt started");
  
  const schema = z.object({
    email: z.string().email(),
    password: z.string(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    console.log("[AUTH] Invalid data format provided", parsed.error.flatten());
    res.status(400).json({ error: "Invalid data" });
    return;
  }

  const { email, password } = parsed.data;
  console.log(`[AUTH] Login attempt for email: ${email}`);

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`[AUTH] User not found for email: ${email}`);
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    console.log(`[AUTH] User found, verifying password for user ID: ${user.id}`);
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log(`[AUTH] Invalid password for user ID: ${user.id}`);
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    console.log(`[AUTH] Password verified, generating token for user ID: ${user.id}`);
    const token = sign_token({ id: user.id, role: user.role });

    const duration = Date.now() - startTime;
    console.log(`[AUTH] Login successful for user ID: ${user.id}, role: ${user.role} (${duration}ms)`);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(`[AUTH] Database error during login for email: ${email}`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;