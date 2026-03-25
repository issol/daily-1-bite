import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 일반 검색엔진 — 모두 허용
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
      // GEO: Perplexity AI 크롤러 명시 허용
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
      // GEO: OpenAI / ChatGPT 크롤러 허용
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
      // GEO: ChatGPT-User (실시간 검색 플러그인)
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
      },
      // GEO: Claude (Anthropic) 크롤러
      {
        userAgent: 'ClaudeBot',
        allow: '/',
      },
      // GEO: Google AI (SGE / AI Overviews)
      {
        userAgent: 'Google-Extended',
        allow: '/',
      },
      // GEO: Meta AI 크롤러
      {
        userAgent: 'meta-externalagent',
        allow: '/',
      },
      // GEO: Cohere AI 크롤러
      {
        userAgent: 'cohere-ai',
        allow: '/',
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
