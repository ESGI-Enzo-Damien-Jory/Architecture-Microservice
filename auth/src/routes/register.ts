import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";

const router = Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  console.log("[REGISTER] Registration attempt started");
  
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(4),
    role: z.nativeEnum(Role),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    console.log("[REGISTER] Invalid input data provided", parsed.error.flatten());
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { email, password, role } = parsed.data;
  console.log(`[REGISTER] Registration attempt for email: ${email}, role: ${role}`);

  if (parsed.data.role === Role.admin) {
    console.log(`[REGISTER] Rejected admin registration attempt for email: ${email}`);
    res.status(403).json({ error: "Cannot register as admin" });
    return;
  }

  try {
    console.log(`[REGISTER] Hashing password for email: ${email}`);
    const hashed = await bcrypt.hash(password, 10);
    
    console.log(`[REGISTER] Creating user in database for email: ${email}`);
    const user = await prisma.user.create({
      data: { email, password: hashed, role },
    });
    
    const duration = Date.now() - startTime;
    console.log(`[REGISTER] User created successfully - ID: ${user.id}, email: ${user.email}, role: ${user.role} (${duration}ms)`);
    
    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`[REGISTER] Registration failed for email: ${email} (${duration}ms)`, err);
    res.status(400).json({ error: "User already exists" });
  }
});

export default router;