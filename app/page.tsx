import Link from 'next/link';
import {getAllPosts, CATEGORIES} from '@/lib/posts';
import PostCard from '@/components/PostCard';
import {getPopularPosts} from '@/lib/analytics';
import {S} from '@/lib/strings';

export const revalidate = 3600;

export default async function HomePage() {
  const allPosts = getAllPosts('ko');
  const recentPosts = allPosts.slice(0, 24);
  const popularPosts = await getPopularPosts(5);

  const enrichedPopular = popularPosts
    .map((p) => {
      // GA4가 돌려주는 경로는 이전 전후가 섞인다. 과거 데이터는 /ko/blog/x,
      // 이전 후 데이터는 /blog/x 다. 두 형태를 모두 벗겨야 인기 글 집계가
      // URL 이전을 넘어 이어진다.
      const slug = p.path.replace(/^\/(ko|en)\/blog\//, '').replace(/^\/blog\//, '').replace(/\/$/, '');
      const post = allPosts.find((a) => a.slug === slug);
      return post ? {post, pageViews: p.pageViews} : null;
    })
    .filter(Boolean) as {post: (typeof allPosts)[0]; pageViews: number}[];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Hero */}
      <section className="mb-12 text-center py-10 bg-white rounded-3xl border border-amber-100 shadow-sm">
        <div className="text-5xl mb-4">🐝</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{S.home.siteName}</h1>
        <p className="text-gray-500 text-base max-w-md mx-auto leading-relaxed">
          {S.home.tagline}
          <br />
          {S.home.subTagline}
        </p>
      </section>

      {/* Category chips */}
      <section className="mb-8 flex flex-wrap gap-2">
        {Object.entries(CATEGORIES).map(([key]) => (
          <Link
            key={key}
            href={`/category/${key}`}
            className="text-sm font-medium px-4 py-2 rounded-full border border-gray-200 hover:border-amber-400 hover:text-amber-600 transition-colors bg-white"
          >
            {CATEGORIES[key]}
          </Link>
        ))}
      </section>

      {/* Popular posts */}
      {enrichedPopular.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{S.home.popular}</h2>
            <Link href="/stats" className="text-sm text-amber-500 hover:underline">
              {S.home.allStats}
            </Link>
          </div>
          <ol className="space-y-2">
            {enrichedPopular.map((item, i) => (
              <li key={item.post.slug}>
                <Link
                  href={`/blog/${item.post.slug}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-amber-200 hover:shadow-sm transition-all group"
                >
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                      i < 3 ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-800 group-hover:text-amber-600 transition-colors leading-snug">
                    {item.post.title}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    👁️ {item.pageViews.toLocaleString()}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Recent posts */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{S.home.recent}</h2>
          <Link href="/blog" className="text-sm text-amber-500 hover:underline">
            {S.home.viewAll}
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>{S.home.noPosts}</p>
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
