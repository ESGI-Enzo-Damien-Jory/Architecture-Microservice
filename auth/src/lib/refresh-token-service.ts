import { prisma } from "./prisma";
import { sign_refresh_token } from "./jwt";

export class RefreshTokenService {
  static async createRefreshToken(userId: string): Promise<string> {
    const token = sign_refresh_token();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  static async validateRefreshToken(token: string): Promise<{ userId: string; role: any } | null> {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!refreshToken) {
      return null;
    }

    if (refreshToken.expiresAt < new Date()) {
      await this.revokeRefreshToken(token);
      return null;
    }

    if (refreshToken.isRevoked) {
      return null;
    }

    return {
      userId: refreshToken.userId,
      role: refreshToken.user.role,
    };
  }

  static async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  }

  static async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  static async cleanupExpiredTokens(): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true },
        ],
      },
    });
  }
}