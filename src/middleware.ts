import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {

  const url = req.nextUrl
  const { pathname } = url

  if (pathname.startsWith(`/api/`)) {
    const url = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    if (!(url === process.env.NEXTAUTH_URL)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next()

}

export const config = {
  matcher: ['/((?!_next|fonts|examples|svg|[\\w-]+\\.\\w+).*)']
}