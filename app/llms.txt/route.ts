import { getAllPosts, CATEGORIES } from '@/lib/posts';
import type { Locale } from '@/lib/posts';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

export async function GET() {
  const posts = getAllPosts('ko' as Locale);
  const enPosts = getAllPosts('en' as Locale);

  const categorySections = Object.entries(CATEGORIES)
    .map(([key, label]) => {
      const categoryPosts = posts.filter((p) => p.category === key);
      if (categoryPosts.length === 0) return '';

      const postLines = categoryPosts
        .map((p) => `- [${p.title}](${BASE_URL}/ko/blog/${p.slug}): ${p.description}`)
        .join('\n');

      return `## ${label}\n\n${postLines}`;
    })
    .filter(Boolean)
    .join('\n\n');

  const enCategorySections = Object.entries(CATEGORIES)
    .map(([key, label]) => {
      const categoryPosts = enPosts.filter((p) => p.category === key);
      if (categoryPosts.length === 0) return '';

      const postLines = categoryPosts
        .map((p) => `- [${p.title}](${BASE_URL}/en/blog/${p.slug}): ${p.description}`)
        .join('\n');

      return `## ${label}\n\n${postLines}`;
    })
    .filter(Boolean)
    .join('\n\n');

  const content = `# 매일 한입 / Daily 1 Bite (daily1bite.com)

> 매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다. AI 트렌드, 도구 리뷰, 튜토리얼을 한입 크기로 전달합니다.
> Daily AI news digest — trends, tool reviews, and tutorials in bite-sized format.

- 운영자 / Author: A꿀벌I
- 언어 / Languages: 한국어 (ko-KR), English (en-US)
- RSS: ${BASE_URL}/feed.xml
- 사이트맵 / Sitemap: ${BASE_URL}/sitemap.xml
- 총 글 수 / Total posts: 한국어 ${posts.length}개, English ${enPosts.length}개

## Korean Posts (한국어)

${categorySections}

## English Posts

${enCategorySections}
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  });
}
