// routes/profile.ts
import { Router, Request, Response } from "express";
import { z } from "zod";
import { require_auth } from "../middleware/require_auth";
import { prisma } from "../lib/prisma";

const router = Router();

const profileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().min(10).max(15).optional(),
  address: z.string().min(5).max(200).optional(),
  city: z.string().min(1).max(50).optional(),
  zipCode: z.string().min(5).max(10).optional(),
});

// GET /profile - Récupérer le profil
router.get(
  "/",
  require_auth,
  async (req: Request, res: Response): Promise<void> => {
    console.log("[PROFILE] Get profile request started");

    try {
      const user = (req as any).user;

      if (!user) {
        console.log("[PROFILE] No user found in request");
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const userWithProfile = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          profile: true,
        },
      });

      if (!userWithProfile) {
        console.log(`[PROFILE] User ${user.id} not found`);
        res.status(404).json({ error: "User not found" });
        return;
      }

      console.log(`[PROFILE] Returning profile for user ID: ${user.id}`);
      res.json({
        user: {
          id: userWithProfile.id,
          email: userWithProfile.email,
          role: userWithProfile.role,
          createdAt: userWithProfile.createdAt,
          profile: userWithProfile.profile,
        },
      });
    } catch (error) {
      console.error("[PROFILE] Error fetching profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /profile - Créer ou mettre à jour le profil
router.put(
  "/",
  require_auth,
  async (req: Request, res: Response): Promise<void> => {
    console.log("[PROFILE] Update/Create profile request started");

    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log("[PROFILE] Validation failed:", parsed.error.flatten());
      res.status(400).json({
        error: "Invalid data",
        details: parsed.error.flatten(),
      });
      return;
    }

    try {
      const user = (req as any).user;

      if (!user) {
        console.log("[PROFILE] No user found in request");
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const { firstName, lastName, phone, address, city, zipCode } =
        parsed.data;

      console.log(`[PROFILE] Updating profile for user ID: ${user.id}`);

      // Upsert (créer ou mettre à jour) le profil
      const profile = await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: {
          firstName,
          lastName,
          phone,
          address,
          city,
          zipCode,
        },
        create: {
          userId: user.id,
          firstName,
          lastName,
          phone,
          address,
          city,
          zipCode,
        },
      });

      // Récupérer l'utilisateur avec son profil mis à jour
      const userWithProfile = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          profile: true,
        },
      });

      console.log(`[PROFILE] Profile updated/created for user ID: ${user.id}`);
      res.json({
        user: {
          id: userWithProfile!.id,
          email: userWithProfile!.email,
          role: userWithProfile!.role,
          createdAt: userWithProfile!.createdAt,
          profile: userWithProfile!.profile,
        },
      });
    } catch (error) {
      console.error("[PROFILE] Error updating profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
