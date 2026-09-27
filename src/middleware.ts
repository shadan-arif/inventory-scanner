import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

const WEB_PREVIEW_ORIGIN = "http://localhost:8081";

function addDevelopmentCors(request: NextRequest, response: NextResponse) {
  if (request.headers.get("origin") === WEB_PREVIEW_ORIGIN && request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", WEB_PREVIEW_ORIGIN);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
    response.headers.append("Vary", "Origin");
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") && request.method === "OPTIONS") {
    return addDevelopmentCors(request, new NextResponse(null, { status: 204 }));
  }

  // We are protecting everything EXCEPT:
  // - root (login page)
  // - auth APIs (/api/auth)
  // - db test route (/api/db-test)
  // - static files and assets
  const publicPaths = ["/", "/api/auth/login", "/api/auth/logout", "/api/db-test", "/logo.jpg"];
  const isPublicRoute = publicPaths.includes(pathname);

  const isSettingsRoute = pathname.startsWith("/wholesale/settings");

  if (!isPublicRoute) {
    let token = request.cookies.get("ws_session")?.value;
    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      if (pathname.startsWith("/api/")) {
        return addDevelopmentCors(request, NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
      }
      const url = new URL("/", request.url);
      return NextResponse.redirect(url);
    }

    const payload = await verifyToken(token);

    if (!payload) {
      const response = pathname.startsWith("/api/") 
        ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        : NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("ws_session");
      return addDevelopmentCors(request, response);
    }

    // Role-based protection for wholesale settings & admin module
    const isAdminRouteUI = pathname.startsWith("/admin");
    if ((isSettingsRoute || isAdminRouteUI) && payload.role !== "ADMIN") {
      const url = new URL("/modules", request.url);
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

  return addDevelopmentCors(request, NextResponse.next());
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
