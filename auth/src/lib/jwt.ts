import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const getPrivateKey = (): string => {
  console.log("[JWT] Reading private key from /app/secrets/private.pem");
  try {
    const key = fs.readFileSync(path.join("/app/secrets", "private.pem"), "utf8");
    console.log("[JWT] Private key loaded successfully");
    return key;
  } catch (error) {
    console.error("[JWT] Failed to read private key:", error);
    throw new Error("Private key not found");
  }
};

const getPublicKey = (): string => {
  console.log("[JWT] Reading public key from /app/secrets/public.pem");
  try {
    const key = fs.readFileSync(path.join("/app/secrets", "public.pem"), "utf8");
    console.log("[JWT] Public key loaded successfully");
    return key;
  } catch (error) {
    console.error("[JWT] Failed to read public key:", error);
    throw new Error("Public key not found");
  }
};

export const sign_access_token = (payload: { id: string; role: Role }): string => {
  const startTime = Date.now();
  console.log(`[JWT] Starting access token signing for user ID: ${payload.id}, role: ${payload.role}`);
  
  try {
    const privateKey = getPrivateKey();
    console.log("[JWT] Signing token with RS256 algorithm, 1h expiry");
    
    const token = jwt.sign(payload, privateKey, { 
      algorithm: "RS256",
      expiresIn: "1h",
      issuer: "auth-service",
      audience: "microservices"
    });
    
    const duration = Date.now() - startTime;
    console.log(`[JWT] Access token signed successfully for user ID: ${payload.id} (${duration}ms)`);
    return token;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[JWT] Access token signing failed for user ID: ${payload.id} (${duration}ms):`, error);
    throw new Error("Failed to sign access token");
  }
};

export const sign_refresh_token = (): string => {
  console.log("[JWT] Generating secure refresh token");
  const token = crypto.randomBytes(32).toString('hex');
  console.log("[JWT] Refresh token generated successfully (64 chars)");
  return token;
};

export const verify_access_token = (token: string): { id: string; role: Role } | null => {
  const startTime = Date.now();
  const tokenPreview = token.substring(0, 20) + "...";
  console.log(`[JWT] Starting access token verification for token: ${tokenPreview}`);
  
  try {
    const publicKey = getPublicKey();
    console.log("[JWT] Verifying token with RS256 algorithm");
    
    const payload = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
      issuer: "auth-service",
      audience: "microservices"
    }) as { id: string; role: Role };
    
    const duration = Date.now() - startTime;
    console.log(`[JWT] Token verification successful for user ID: ${payload.id}, role: ${payload.role} (${duration}ms)`);
    return payload;
  } catch (error) {
    const duration = Date.now() - startTime;
    if (error instanceof jwt.TokenExpiredError) {
      console.log(`[JWT] Token expired (${duration}ms)`);
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log(`[JWT] Invalid token format (${duration}ms):`, error.message);
    } else {
      console.error(`[JWT] Token verification failed (${duration}ms):`, error);
    }
    return null;
  }
};