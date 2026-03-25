import Link from 'next/link';
import { getAllPosts, CATEGORIES } from '@/lib/posts';
import PostCard from '@/components/PostCard';

export default function HomePage() {
  const allPosts = getAllPosts();
  const recentPosts = allPosts.slice(0, 9);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Hero */}
      <section className="mb-12 text-center py-10 bg-white rounded-3xl border border-amber-100 shadow-sm">
        <div className="text-5xl mb-4">🐝</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">매일 한입</h1>
        <p className="text-gray-500 text-base max-w-md mx-auto leading-relaxed">
          매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다.
          <br />
          한입 크기로 읽는 AI 트렌드, 도구 리뷰, 튜토리얼.
        </p>
      </section>

      {/* Category chips */}
      <section className="mb-8 flex flex-wrap gap-2">
        {Object.entries(CATEGORIES).map(([key, label]) => (
          <Link
            key={key}
            href={`/category/${key}`}
            className="text-sm font-medium px-4 py-2 rounded-full border border-gray-200 hover:border-amber-400 hover:text-amber-600 transition-colors bg-white"
          >
            {label}
          </Link>
        ))}
      </section>

      {/* Recent posts */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">최근 글</h2>
          <Link href="/blog" className="text-sm text-amber-500 hover:underline">
            전체 보기 →
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>아직 게시된 글이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
