import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const getPrivateKey = (): string => {
  try {
    return fs.readFileSync(path.join("/app/secrets", "private.pem"), "utf8");
  } catch (error) {
    console.error("Failed to read private key:", error);
    throw new Error("Private key not found");
  }
};

const getPublicKey = (): string => {
  try {
    return fs.readFileSync(path.join("/app/secrets", "public.pem"), "utf8");
  } catch (error) {
    console.error("Failed to read public key:", error);
    throw new Error("Public key not found");
  }
};

export const sign_access_token = (payload: { id: string; role: Role }): string => {
  try {
    const privateKey = getPrivateKey();
    return jwt.sign(payload, privateKey, { 
      algorithm: "RS256",
      expiresIn: "1h",
      issuer: "auth-service",
      audience: "microservices"
    });
  } catch (error) {
    console.error("Access token signing failed:", error);
    throw new Error("Failed to sign access token");
  }
};

export const sign_refresh_token = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const verify_access_token = (token: string): { id: string; role: Role } | null => {
  try {
    const publicKey = getPublicKey();
    const payload = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
      issuer: "auth-service",
      audience: "microservices"
    }) as { id: string; role: Role };
    
    return payload;
  } catch (error) {
    console.error("Access token verification failed:", error);
    return null;
  }
};