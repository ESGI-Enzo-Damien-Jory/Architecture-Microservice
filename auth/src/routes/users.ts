import { Router, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { require_auth } from "../middleware/require_auth";
import { require_role } from "../middleware/require_role";
import { Role } from "@prisma/client";
import { RefreshTokenService } from "../lib/refresh-token-service";

const router = Router();

// GET /users - Récupérer tous les utilisateurs (admin seulement)
router.get(
  "/",
  require_auth,
  require_role(Role.admin),
  async (req: Request, res: Response): Promise<void> => {
    console.log("[USERS] Get all users request");

    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
        },
        orderBy: {
          email: "asc",
        },
      });

      console.log(`[USERS] Retrieved ${users.length} users`);
      res.json(users);
    } catch (error) {
      console.error("[USERS] Error retrieving users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /users - Créer un utilisateur (admin seulement)
router.post(
  "/",
  require_auth,
  require_role(Role.admin),
  async (req: Request, res: Response): Promise<void> => {
    console.log("[USERS] Create user request");

    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(4),
      role: z.nativeEnum(Role),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      console.log("[USERS] Invalid create data", parsed.error.flatten());
      res.status(400).json({ error: "Invalid data" });
      return;
    }

    const { email, password, role } = parsed.data;

    try {
      console.log(`[USERS] Creating user: ${email}, role: ${role}`);

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      console.log(`[USERS] User created successfully: ${user.id}`);
      res.status(201).json(user);
    } catch (error: any) {
      console.error(`[USERS] Error creating user:`, error);
      if (error.code === "P2002") {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

// PUT /users/:id - Mettre à jour un utilisateur (admin seulement)
router.put(
  "/:id",
  require_auth,
  require_role(Role.admin),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    console.log(`[USERS] Update user request: ${id}`);

    const schema = z.object({
      email: z.string().email().optional(),
      password: z.string().min(4).optional(),
      role: z.nativeEnum(Role).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      console.log(
        `[USERS] Invalid update data for ${id}`,
        parsed.error.flatten()
      );
      res.status(400).json({ error: "Invalid data" });
      return;
    }

    const updateData = parsed.data;

    try {
      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        console.log(`[USERS] User not found: ${id}`);
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Préparer les données de mise à jour
      const data: any = {};
      if (updateData.email) data.email = updateData.email;
      if (updateData.role) data.role = updateData.role;
      if (updateData.password) {
        console.log(`[USERS] Hashing new password for ${id}`);
        data.password = await bcrypt.hash(updateData.password, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      console.log(`[USERS] User updated successfully: ${updatedUser.id}`);
      res.json(updatedUser);
    } catch (error: any) {
      console.error(`[USERS] Error updating user ${id}:`, error);
      if (error.code === "P2002") {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

// DELETE /users/:id - Supprimer un utilisateur (admin seulement)
router.delete(
  "/:id",
  require_auth,
  require_role(Role.admin),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUser = (req as any).user;

    console.log(`[USERS] Delete user request: ${id}`);

    // Empêcher de se supprimer soi-même
    if (currentUser.id === id) {
      console.log(`[USERS] User tried to delete themselves: ${id}`);
      res.status(400).json({ error: "Cannot delete your own account" });
      return;
    }

    try {
      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        console.log(`[USERS] User not found for deletion: ${id}`);
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Supprimer les refresh tokens en premier
      await prisma.refreshToken.deleteMany({
        where: { userId: id },
      });

      // Supprimer l'utilisateur
      await prisma.user.delete({
        where: { id },
      });

      console.log(`[USERS] User deleted successfully: ${existingUser.email}`);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error(`[USERS] Error deleting user ${id}:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /users/:id/revoke-sessions - Révoquer toutes les sessions d'un utilisateur
router.post(
  "/:id/revoke-sessions",
  require_auth,
  require_role(Role.admin),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    console.log(`[USERS] Revoke sessions for user: ${id}`);

    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        console.log(`[USERS] User not found for session revocation: ${id}`);
        res.status(404).json({ error: "User not found" });
        return;
      }

      await RefreshTokenService.revokeAllUserTokens(id);

      console.log(`[USERS] All sessions revoked for user: ${user.email}`);
      res.json({ message: "All sessions revoked successfully" });
    } catch (error) {
      console.error(`[USERS] Error revoking sessions for ${id}:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
