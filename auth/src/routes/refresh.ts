import { Router, Request, Response } from "express";
import { z } from "zod";
import { sign_access_token } from "../lib/jwt";
import { RefreshTokenService } from "../lib/refresh-token-service";

const router = Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  console.log("[REFRESH] Refresh token request started");

  const schema = z.object({
    refreshToken: z.string(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    console.log("[REFRESH] Invalid data format provided", parsed.error.flatten());
    res.status(400).json({ error: "Invalid data" });
    return;
  }

  const { refreshToken } = parsed.data;
  console.log("[REFRESH] Validating refresh token");

  try {
    const tokenData = await RefreshTokenService.validateRefreshToken(refreshToken);
    
    if (!tokenData) {
      console.log("[REFRESH] Invalid or expired refresh token");
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    console.log(`[REFRESH] Valid refresh token for user ID: ${tokenData.userId}`);

    const newAccessToken = sign_access_token({ 
      id: tokenData.userId, 
      role: tokenData.role 
    });

    const newRefreshToken = await RefreshTokenService.createRefreshToken(tokenData.userId);
    await RefreshTokenService.revokeRefreshToken(refreshToken);

    const duration = Date.now() - startTime;
    console.log(`[REFRESH] New tokens generated for user ID: ${tokenData.userId} (${duration}ms)`);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[REFRESH] Error during token refresh (${duration}ms)`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;