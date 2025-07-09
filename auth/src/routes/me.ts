// routes/me.ts
import { Router, Request, Response } from "express";
import { require_auth } from "../middleware/require_auth";
import { prisma } from "../lib/prisma";

const router = Router();

router.get(
  "/",
  require_auth,
  async (req: Request, res: Response): Promise<void> => {
    console.log("[ME] User info request started");

    try {
      const user = (req as any).user;

      if (!user) {
        console.log(
          "[ME] No user found in request - authentication middleware failed"
        );
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      console.log(
        `[ME] Fetching user info for user ID: ${user.id}, role: ${user.role}`
      );

      // Récupérer l'utilisateur avec son profil
      const userWithProfile = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          profile: true,
        },
      });

      if (!userWithProfile) {
        console.log(`[ME] User ${user.id} not found in database`);
        res.status(404).json({ error: "User not found" });
        return;
      }

      console.log(`[ME] Returning user info for user ID: ${user.id}`);
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
      console.error("[ME] Error fetching user info:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
