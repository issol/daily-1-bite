import { getAllPosts, CATEGORIES } from '@/lib/posts';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

export async function GET() {
  const posts = getAllPosts();

  const categorySections = Object.entries(CATEGORIES)
    .map(([key, label]) => {
      const categoryPosts = posts.filter((p) => p.category === key);
      if (categoryPosts.length === 0) return '';

      const postLines = categoryPosts
        .map((p) => `- [${p.title}](${BASE_URL}/blog/${p.slug}): ${p.description}`)
        .join('\n');

      return `## ${label}\n\n${postLines}`;
    })
    .filter(Boolean)
    .join('\n\n');

  const content = `# 매일 한입 (daily1bite.com)

> 매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다. AI 트렌드, 도구 리뷰, 튜토리얼을 한입 크기로 전달합니다.

- 운영자: A꿀벌I
- 언어: 한국어 (ko-KR)
- RSS: ${BASE_URL}/feed.xml
- 사이트맵: ${BASE_URL}/sitemap.xml
- 총 ${posts.length}개의 글

${categorySections}
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  });
}
