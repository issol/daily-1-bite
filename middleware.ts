import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import {NextRequest, NextResponse} from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  // Redirect old URLs without locale prefix to /ko/...
  // Only for page routes, not static assets or API routes
  const oldRoutes = ['/blog', '/category', '/about', '/contact', '/stats', '/privacy-policy'];
  const matchesOldRoute = oldRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  if (matchesOldRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `/ko${pathname}`;
    // 301: GSC가 가장 보편적으로 "영구 이동"으로 인식하는 상태 코드.
    return NextResponse.redirect(url, 301);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except static files
    '/((?!_next|.*\\..*).*)'
  ]
};
