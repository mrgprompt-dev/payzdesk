import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const ACCESS_COOKIE  = 'accessToken'
const ADMIN_COOKIE   = 'adminToken'

// ─── Public user page routes ──────────────────────────────────────────────────
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/onboarding',
]

// ─── Public user API routes ───────────────────────────────────────────────────
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

// ─── Public admin API routes (no token needed) ────────────────────────────────
const PUBLIC_ADMIN_API_PATHS = [
  '/api/admin/auth/login',
  '/api/admin/auth/logout',
]

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // ── 1. Next.js internals & static assets ────────────────────────────────────
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // ── 2. Public user API routes ────────────────────────────────────────────────
  if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── 3. Public admin auth API routes ─────────────────────────────────────────
  if (PUBLIC_ADMIN_API_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── 4. Secret admin login page: /{adminKey}/login ───────────────────────────
  // Must run before any other route check to avoid being caught by user auth.
  // Any 2-segment path ending in /login is treated as a candidate.
  // Wrong key → 404. Correct key → show login (or redirect to /admin if already authed).
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 2 && segments[1] === 'login') {
    const key = segments[0]
    const validKey = process.env.ADMIN_SECRET_KEY

    if (!validKey || key !== validKey) {
      // Unknown key — return 404, not a redirect (no information leakage)
      return new NextResponse(null, { status: 404 })
    }

    // Valid key — if admin is already logged in, skip the form
    const adminToken = req.cookies.get(ADMIN_COOKIE)?.value
    if (adminToken) {
      try {
        const secret = new TextEncoder().encode(
          process.env.ADMIN_JWT_SECRET as string
        )
        await jwtVerify(adminToken, secret)
        return NextResponse.redirect(new URL('/admin', req.url))
      } catch {
        // Token expired or invalid — fall through to show login page
      }
    }

    return NextResponse.next()
  }

  // ── 5. Admin pages: /admin and /admin/* ──────────────────────────────────────
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const adminToken = req.cookies.get(ADMIN_COOKIE)?.value
    const adminKey   = process.env.ADMIN_SECRET_KEY

    if (!adminKey) {
      // ADMIN_SECRET_KEY not configured — refuse to expose admin
      return new NextResponse(null, { status: 404 })
    }

    if (!adminToken) {
      return NextResponse.redirect(new URL(`/${adminKey}/login`, req.url))
    }

    try {
      const secret = new TextEncoder().encode(
        process.env.ADMIN_JWT_SECRET as string
      )
      await jwtVerify(adminToken, secret)
      return NextResponse.next()
    } catch {
      return NextResponse.redirect(new URL(`/${adminKey}/login`, req.url))
    }
  }

  // ── 6. Protected admin API routes: /api/admin/* ───────────────────────────
  if (pathname.startsWith('/api/admin/')) {
    const adminToken = req.cookies.get(ADMIN_COOKIE)?.value

    if (!adminToken) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    try {
      const secret = new TextEncoder().encode(
        process.env.ADMIN_JWT_SECRET as string
      )
      await jwtVerify(adminToken, secret)
      return NextResponse.next()
    } catch {
      return NextResponse.json(
        { success: false, message: 'Session expired' },
        { status: 401 }
      )
    }
  }

  // ── 7. User auth ─────────────────────────────────────────────────────────────
  const isPublicPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const token = req.cookies.get(ACCESS_COOKIE)?.value

  let isValidToken = false
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET as string)
      await jwtVerify(token, secret)
      isValidToken = true
    } catch {
      isValidToken = false
    }
  }

  // Authenticated user on auth page → redirect to dashboard
  if (isPublicPage && isValidToken) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Unauthenticated user on protected page → redirect to login
  if (!isPublicPage && !isValidToken) {
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
