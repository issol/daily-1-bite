import { getAllPosts, CATEGORIES } from '@/lib/posts';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const posts = getAllPosts('ko').slice(0, 50);

  const entries = posts
    .map((post) => {
      const url = `${BASE_URL}/ko/blog/${post.slug}`;
      const category = escapeXml(CATEGORIES[post.category] || post.category);

      return `  <entry>
    <title><![CDATA[${post.title}]]></title>
    <link href="${escapeXml(url)}" rel="alternate" type="text/html"/>
    <id>${escapeXml(url)}</id>
    <published>${new Date(post.date).toISOString()}</published>
    <updated>${new Date(post.date).toISOString()}</updated>
    <summary><![CDATA[${post.description}]]></summary>
    <author><name>A꿀벌I</name></author>
    <category term="${category}"/>
    ${post.tags.map((tag) => `<category term="${escapeXml(tag)}"/>`).join('\n    ')}
  </entry>`;
    })
    .join('\n');

  const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="ko">
  <title>매일 한입 | AI 뉴스 요약 블로그</title>
  <subtitle>매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다.</subtitle>
  <link href="${BASE_URL}/ko" rel="alternate" type="text/html"/>
  <link href="${BASE_URL}/atom.xml" rel="self" type="application/atom+xml"/>
  <id>${BASE_URL}/</id>
  <updated>${new Date().toISOString()}</updated>
  <author>
    <name>A꿀벌I</name>
    <uri>${BASE_URL}/about</uri>
  </author>
  <icon>${BASE_URL}/icon</icon>
${entries}
</feed>`;

  return new Response(atom, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
