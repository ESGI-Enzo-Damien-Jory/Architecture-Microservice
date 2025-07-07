import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

const router = Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  console.log("[HEALTH] Health check started");
  
  try {
    console.log("[HEALTH] Testing database connection");
    await prisma.$queryRaw`SELECT 1`;
    console.log("[HEALTH] Database connection successful");
    
    const privateKeyPath = path.join("/app/secrets", "private.pem");
    const publicKeyPath = path.join("/app/secrets", "public.pem");
    
    console.log("[HEALTH] Checking RSA key files");
    const privateKeyExists = fs.existsSync(privateKeyPath);
    const publicKeyExists = fs.existsSync(publicKeyPath);
    
    console.log(`[HEALTH] Private key exists: ${privateKeyExists}`);
    console.log(`[HEALTH] Public key exists: ${publicKeyExists}`);
    
    if (!privateKeyExists || !publicKeyExists) {
      console.log("[HEALTH] RSA keys missing - service unhealthy");
      res.status(503).json({ 
        status: "unhealthy", 
        error: "RSA keys not found",
        privateKey: privateKeyExists,
        publicKey: publicKeyExists
      });
      return;
    }

    const duration = Date.now() - startTime;
    console.log(`[HEALTH] Health check completed successfully (${duration}ms)`);
    
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      database: "connected (Prisma Accelerate)",
      keys: "available"
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[HEALTH] Health check failed (${duration}ms)`, error);
    
    res.status(503).json({ 
      status: "unhealthy", 
      error: error instanceof Error ? error.message : "Database connection failed"
    });
  }
});

export default router;