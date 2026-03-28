import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
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
};

export default withNextIntl(nextConfig);
