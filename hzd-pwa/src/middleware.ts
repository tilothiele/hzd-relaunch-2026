import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const jwt = request.cookies.get("jwt");
    const { pathname } = request.nextUrl;

    // Define public paths that don't require authentication
    const isPublicPath =
        pathname === "/login" ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/static") ||
        pathname.includes("."); // Files like images, manifest.json, sw.js

    if (!jwt && !isPublicPath) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (jwt && pathname === "/login") {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
