import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith('/generate')) {
    const signinUrl = new URL('/auth/signin', req.url)
    signinUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return NextResponse.redirect(signinUrl)
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
