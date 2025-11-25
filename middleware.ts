import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Check if the request is for an admin route
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Skip auth check for login page
    if (request.nextUrl.pathname.startsWith("/admin/login")) {
      return NextResponse.next();
    }
    
    // Check for NextAuth session cookie (lightweight check)
    // NextAuth stores the session in a cookie named "authjs.session-token" or "next-auth.session-token"
    const sessionToken = request.cookies.get("authjs.session-token") || 
                         request.cookies.get("next-auth.session-token") ||
                         request.cookies.get("__Secure-authjs.session-token") ||
                         request.cookies.get("__Secure-next-auth.session-token");
    
    // If no session token, redirect to login
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
