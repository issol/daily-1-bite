import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 구 URL(/ko/*, /en/*)을 robots로 막지 않는다.
      // 이들은 301로 루트 URL을 가리키는데, 크롤을 막으면 Googlebot이 그 리디렉션
      // 신호를 볼 수 없어 "robots 차단"·"리디렉션 오류" 노이즈만 남는다.
      // 크롤을 허용해야 구 URL의 신호가 새 URL로 넘어간다.
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
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
    ],
    host: BASE_URL,
    // GEO: llms.txt — AI 크롤러용 사이트 설명
    // See: https://llmstxt.org
    // Available at: ${BASE_URL}/llms.txt
  };
}
