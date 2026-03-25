import { getAllPosts } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '전체 글',
  description: '매일 한입 블로그의 모든 글을 확인하세요.',
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">전체 글 ({posts.length})</h1>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>아직 게시된 글이 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
