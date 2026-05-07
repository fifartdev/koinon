import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface JWTPayload {
  id?: string
  email?: string
  role?: string
  tenant?: string | { id: string }
  exp?: number
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const base64 = token.split('.')[1]
    if (!base64) return null
    const normalized = base64.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    return JSON.parse(atob(padded)) as JWTPayload
  } catch {
    return null
  }
}

function getTokenUser(request: NextRequest): JWTPayload | null {
  const token = request.cookies.get('payload-token')?.value
  if (!token) return null
  const decoded = decodeJWT(token)
  if (!decoded) return null
  // Check expiry
  if (decoded.exp && decoded.exp * 1000 < Date.now()) return null
  return decoded
}

const SKIP_PREFIXES = [
  '/api',
  '/_next',
  '/favicon',
  '/manifest',
  '/sw.js',
  '/icons',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Skip files (anything with a dot in the last segment)
  const lastSegment = pathname.split('/').pop() ?? ''
  if (lastSegment.includes('.')) return NextResponse.next()

  // ── Payload admin (/admin) — master only ────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const user = getTokenUser(request)
    if (user && user.role !== 'master') {
      // Authenticated non-master: superadmin → their panel; others → home
      const dest = user.role === 'superadmin' ? '/superadmin' : '/'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return NextResponse.next()
  }

  // ── Superadmin area (/superadmin) — superadmin only ─────────────────────
  if (pathname.startsWith('/superadmin')) {
    if (pathname === '/superadmin/login') return NextResponse.next()
    const user = getTokenUser(request)
    if (!user) {
      return NextResponse.redirect(new URL('/superadmin/login', request.url))
    }
    if (user.role !== 'superadmin') {
      const dest = user.role === 'master' ? '/admin' : '/'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return NextResponse.next()
  }

  const segments = pathname.split('/').filter(Boolean)
  if (segments.length < 2) return NextResponse.next()

  const clubSlug = segments[0]
  const subPath = segments[1] // 'dashboard' | 'member-area' | undefined

  const user = getTokenUser(request)

  // Master users belong in Payload admin — redirect them away from all frontend routes
  if (user?.role === 'master') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Superadmin users belong in their panel — redirect away from club frontend
  if (user?.role === 'superadmin') {
    return NextResponse.redirect(new URL('/superadmin', request.url))
  }

  if (subPath === 'dashboard') {
    if (!user) {
      return NextResponse.redirect(
        new URL(`/${clubSlug}/login?redirect=dashboard`, request.url),
      )
    }
    if (!['club-admin'].includes(user.role ?? '')) {
      return NextResponse.redirect(
        new URL(`/${clubSlug}/member-area`, request.url),
      )
    }
  }

  if (subPath === 'member-area') {
    if (!user) {
      return NextResponse.redirect(
        new URL(`/${clubSlug}/login?redirect=member-area`, request.url),
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
