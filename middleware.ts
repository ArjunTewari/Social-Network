import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Allow access to auth pages and public routes
    const publicPaths = ["/login", "/signup"]
    const isPublicPath = publicPaths.includes(req.nextUrl.pathname)

    // If user is authenticated and trying to access auth pages, redirect to home
    if (req.nextauth.token && isPublicPath) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    // Allow access to public profile and message pages
    if (req.nextUrl.pathname.startsWith("/profile/") || req.nextUrl.pathname.startsWith("/messages")) {
      return NextResponse.next()
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const publicPaths = ["/login", "/signup"]
        return publicPaths.includes(req.nextUrl.pathname) || !!token
      },
    },
    pages: {
      signIn: "/login",
    },
  }
)

// Protect all routes except the ones specified
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
} 