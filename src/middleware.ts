import { NextRequest, NextResponse } from 'next/server'
import { ACCESS_COOKIE, verifyAccessToken } from '@/lib/auth'

// Public routes that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/onboarding',
]

// API routes that are public
const PUBLIC_API_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/otp/send',
  '/api/auth/otp/verify',
  '/api/health',
]

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // Allow public API routes
  if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const isPublicPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const token = req.cookies.get(ACCESS_COOKIE)?.value

  // Try to verify token
  let isValidToken = false
  if (token) {
    try {
      verifyAccessToken(token)
      isValidToken = true
    } catch {
      isValidToken = false
    }
  }

  // Redirect authenticated users away from auth pages
  if (isPublicPage && isValidToken) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Redirect unauthenticated users to login
  if (!isPublicPage && !isValidToken) {
    // For expired tokens, try to allow refresh via client-side interceptor
    // For API routes with no token, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
