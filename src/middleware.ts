import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // We are protecting everything EXCEPT:
  // - root (login page)
  // - auth APIs (/api/auth)
  // - static files and assets
  const publicPaths = ["/", "/api/auth/login", "/api/auth/logout", "/logo.jpg"];
  const isPublicRoute = publicPaths.includes(pathname);

  const isSettingsRoute = pathname.startsWith("/wholesale/settings");

  if (!isPublicRoute) {
    const token = request.cookies.get("ws_session")?.value;

    if (!token) {
      const url = new URL("/", request.url);
      return NextResponse.redirect(url);
    }

    const payload = await verifyToken(token);

    if (!payload) {
      const url = new URL("/", request.url);
      const response = NextResponse.redirect(url);
      response.cookies.delete("ws_session");
      return response;
    }

    // Role-based protection for wholesale settings
    if (isSettingsRoute && payload.role !== "ADMIN") {
      const url = new URL("/wholesale", request.url);
      return NextResponse.redirect(url);
    }
  }

  // If a logged-in user hits root "/", redirect them to modules
  if (pathname === "/") {
    const token = request.cookies.get("ws_session")?.value;
    if (token) {
       const payload = await verifyToken(token);
       if (payload) {
         return NextResponse.redirect(new URL("/modules", request.url));
       }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
