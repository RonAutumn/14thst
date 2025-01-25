import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of public paths that don't require authentication
const publicPaths = ['/', '/api']
// List of paths that should be protected
const protectedPaths = ['/store', '/checkout', '/order-confirmation']
// List of paths that should bypass middleware
const bypassPaths = ['/_next', '/api', '/favicon.ico', '/static']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files, API routes, and other special paths
  if (bypassPaths.some(path => pathname.startsWith(path)) || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Get authentication status
  const isAuthenticated = request.cookies.get('site_access')?.value === 'true'

  // Check if current path is public
  const isPublicPath = publicPaths.some(path => pathname === path)
  // Check if current path needs protection
  const needsProtection = protectedPaths.some(path => pathname.startsWith(path))

  // Redirect authenticated users trying to access public paths to /store
  if (isPublicPath && isAuthenticated) {
    const response = NextResponse.redirect(new URL('/store', request.url))
    response.headers.set('x-middleware-cache', 'no-cache')
    return response
  }

  // Redirect unauthenticated users trying to access protected paths to /
  if (needsProtection && !isAuthenticated) {
    const response = NextResponse.redirect(new URL('/', request.url))
    response.headers.set('x-middleware-cache', 'no-cache')
    return response
  }

  // Add cache control headers to prevent caching of protected routes
  const response = NextResponse.next()
  if (needsProtection) {
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    response.headers.set('x-middleware-cache', 'no-cache')
  }
  return response
}

// Configure middleware matching
export const config = {
  matcher: [
    /*
     * Match all paths except static files and images
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}
