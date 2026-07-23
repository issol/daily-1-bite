import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import {NextRequest, NextResponse} from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  // 루트 도메인 → /ko 를 301(영구)로 고정한다.
  //
  // next-intl에 맡기면 307(임시)이 나가는데, 임시 리디렉션은 Google이 링크 신호를
  // 목적지로 넘기지 않고 원본 URL(=daily1bite.com/)을 계속 색인 후보로 붙잡아 둔다.
  // 사이트에서 외부 링크가 가장 많이 꽂히는 URL이라 여기서 신호가 새면 손해가 크다.
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/ko';
    return NextResponse.redirect(url, 301);
  }

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
