import { getAllPosts } from '@/lib/posts';
import PostListWithToggle from '@/components/PostListWithToggle';
import SearchBar from '@/components/SearchBar';
import { BlogJsonLd } from '@/components/JsonLd';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '전체 글',
  description: '매일 한입 블로그의 모든 글을 확인하세요. AI 뉴스 요약, 도구 리뷰, 튜토리얼.',
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <BlogJsonLd />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">전체 글 ({posts.length})</h1>
          <div className="w-full sm:w-64">
            <SearchBar posts={posts} />
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>아직 게시된 글이 없습니다.</p>
          </div>
        ) : (
          <PostListWithToggle posts={posts} />
        )}
      </div>
    </>
  );
}
