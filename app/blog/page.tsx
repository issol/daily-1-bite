import {getAllPosts} from '@/lib/posts';
import PostListWithToggle from '@/components/PostListWithToggle';
import SearchBar from '@/components/SearchBar';
import {BlogJsonLd} from '@/components/JsonLd';
import {getPopularPosts} from '@/lib/analytics';
import {S} from '@/lib/strings';
import type {Metadata} from 'next';

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

export const metadata: Metadata = {
  title: '전체 글',
  description: '매일 한입 블로그의 모든 글을 확인하세요. AI 뉴스 요약, 도구 리뷰, 튜토리얼.',
  alternates: {
    canonical: `${BASE_URL}/blog`,
    // hreflang 없음 — 단일 언어다. (개정된 I2)
  },
};

export default async function BlogPage() {
  const posts = getAllPosts('ko');
  const popularPosts = await getPopularPosts(100);
  const viewsMap: Record<string, number> = {};
  for (const p of popularPosts) {
    // GA4 경로는 이전 전후가 섞인다 — /ko/blog/x 와 /blog/x 를 모두 벗긴다.
    const slug = p.path.replace(/^\/(ko|en)\/blog\//, '').replace(/^\/blog\//, '').replace(/\/$/, '');
    viewsMap[slug] = p.pageViews;
  }

  return (
    <>
      <BlogJsonLd />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {S.blog.postCount(posts.length)}
          </h1>
          <div className="w-full sm:w-64">
            <SearchBar posts={posts} />
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>{S.home.noPosts}</p>
          </div>
        ) : (
          <PostListWithToggle posts={posts} viewsMap={viewsMap} />
        )}
      </div>
    </>
  );
}
