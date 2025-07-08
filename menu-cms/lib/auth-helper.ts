import { AuthService } from "@/lib/auth-service";
import { NextRequest } from "next/server";

export async function verifyAuth(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  try {
    const verifyResponse = await AuthService.verifyToken(token);

    if (verifyResponse.valid && verifyResponse.user) {
      return verifyResponse.user;
    }

    return null;
  } catch (error) {
    console.log("Token invalide:", error);
    return null;
  }
}