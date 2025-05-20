// frontend/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/kitchen", "/delivery"];

export function middleware(request: NextRequest) {
  const token = "ValidToken"; //request.cookies.get("token")?.value

  const url = request.nextUrl.clone();

  if (protectedRoutes.includes(url.pathname)) {
    if (!token) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/kitchen", "/delivery"],
};
