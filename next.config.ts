import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─────────────────────────────────────────
  // 구 URL → 루트 리디렉션
  // ─────────────────────────────────────────
  //
  // 이전에는 middleware.ts가 `/` → `/ko` 와 무prefix 레거시 경로 → `/ko/...` 를
  // 처리했다. i18n을 걷어내면서 방향이 반대가 됐다: 이제 무prefix URL이 정답이고
  // `/ko/*`·`/en/*` 가 구 URL이다.
  //
  // 미들웨어 대신 config로 옮긴 이유: Vercel에서 config 리디렉션은 함수 호출 전
  // 엣지에서 처리되므로 더 빠르고 실행 비용이 0이다. 미들웨어가 사라지면서
  // 모든 요청에 붙던 미들웨어 실행 비용도 함께 사라진다.
  //
  // ⚠️ `permanent: true` 는 308을 낸다. GSC가 가장 보편적으로 "영구 이동"으로
  //    인식하는 301을 쓰기 위해 statusCode를 명시한다. (I4)
  async redirects() {
    return [
      {source: '/ko', destination: '/', statusCode: 301},
      {source: '/ko/:path*', destination: '/:path*', statusCode: 301},
      {source: '/en', destination: '/', statusCode: 301},
      {source: '/en/:path*', destination: '/:path*', statusCode: 301},
    ];
  },
  // ─────────────────────────────────────────
  // 보안 + SEO/GEO HTTP 헤더
  // ─────────────────────────────────────────
  async headers() {
    return [
      // 1) 전체 페이지: 보안 헤더
      {
        source: '/(.*)',
        headers: [
          // 클릭재킹 방지
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // MIME 스니핑 방지
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer 정책 — 외부 링크에 minimal 정보만
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // XSS 필터 (구형 브라우저)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Permissions Policy — 불필요한 기능 비활성화
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // 2) 정적 자산: 장기 캐시 (JS·CSS·폰트 등 _next/static)
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // 3) 이미지: 장기 캐시
      {
        source: '/(.*)\\.(png|jpg|jpeg|gif|webp|avif|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      // 4) RSS 피드: 1시간 캐시 (AI 크롤러 친화)
      {
        source: '/feed.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      // 5) sitemap / robots: 1일 캐시
      {
        source: '/(sitemap\\.xml|robots\\.txt)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=3600',
          },
        ],
      },
    ];
  },
  // Apple Universal Links: serve AASA from a route handler so we can
  // force Content-Type: application/json. The AASA filename has no
  // extension, so serving it from public/ leaves MIME detection to the
  // CDN → octet-stream → Apple silent reject. (구 Amplify 호스팅에서 겪은
  // 문제지만 확장자 없는 파일이라는 원인은 호스팅과 무관해 Vercel에서도 필요하다.)
  async rewrites() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        destination: '/api/aasa',
      },
    ];
  },
};

export default nextConfig;
