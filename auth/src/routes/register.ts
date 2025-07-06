import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";


const router = Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(4),
    role: z.nativeEnum(Role),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  if (parsed.data.role === Role.admin) {
    res.status(403).json({ error: "Cannot register as admin" });
    return;
  }

  const { email, password, role } = parsed.data;
  const hashed = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { email, password: hashed, role },
    });
    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    res.status(400).json({ error: "User already exists" });
  }
});

export default router;
