import { getAllPosts, CATEGORIES } from '@/lib/posts';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

// RSS 2.0 피드 — AI 검색엔진(Perplexity, ChatGPT 등)과 구독 도구가 활용
export async function GET() {
  const posts = getAllPosts().slice(0, 50); // 최근 50개

  const rssItems = posts
    .map((post) => {
      const url = `${BASE_URL}/blog/${post.slug}`;
      const category = CATEGORIES[post.category] || post.category;

      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${post.description}]]></description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <category><![CDATA[${category}]]></category>
      ${post.tags.map((tag) => `<category><![CDATA[${tag}]]></category>`).join('\n      ')}
      <author>noreply@daily1bite.com (A꿀벌I)</author>
      <dc:creator><![CDATA[A꿀벌I]]></dc:creator>
    </item>`.trim();
    })
    .join('\n  ');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>매일 한입 | AI 뉴스 요약 블로그</title>
    <link>${BASE_URL}</link>
    <description>매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다. AI 트렌드, 도구 리뷰, 튜토리얼을 한입 크기로 전달합니다.</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE_URL}/og-default.png</url>
      <title>매일 한입</title>
      <link>${BASE_URL}</link>
    </image>
    ${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
