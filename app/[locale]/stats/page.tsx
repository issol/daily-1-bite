import type { Metadata } from 'next';
import { getSiteStats, getPopularPosts } from '@/lib/analytics';
import { getAllPosts } from '@/lib/posts';
import type { Locale } from '@/lib/posts';
import { Link } from '@/i18n/navigation';
import { setRequestLocale } from 'next-intl/server';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '방문 통계',
  description: '매일 한입 블로그 방문 통계',
};

interface Props {
  params: Promise<{ locale: string }>;
}

function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '만';
  return n.toLocaleString('ko-KR');
}

export default async function StatsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [stats, popularPosts, allPosts] = await Promise.all([
    getSiteStats(),
    getPopularPosts(10),
    Promise.resolve(getAllPosts(locale as Locale)),
  ]);
  const isKo = locale === 'ko';

  const enrichedPosts = popularPosts.map((p, i) => {
    const slug = p.path.replace(/^\/(ko|en)\/blog\//, '').replace(/^\/blog\//, '').replace(/\/$/, '');
    const post = allPosts.find((a) => a.slug === slug);
    return { ...p, rank: i + 1, displayTitle: post?.title || p.title || slug, slug };
  });

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isKo ? '📊 방문 통계' : '📊 Site Stats'}
        </h1>
        <p className="text-gray-500 text-sm">
          {isKo
            ? '매일 한입 블로그의 방문 데이터입니다.'
            : 'Visitor data for the Daily 1 Bite blog.'}
          {stats && (
            <span className="ml-2 text-xs text-gray-400">
              {isKo ? '매 1시간마다 갱신' : 'Updated hourly'}
            </span>
          )}
        </p>
      </div>

      {stats ? (
        <section className="grid grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl border border-gray-100 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">👁️</span>
              <p className="text-xs text-gray-400">
                {isKo ? '전체 누적 페이지뷰' : 'Total Page Views'}
              </p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatNumber(stats.totalPageViews)}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📅</span>
              <p className="text-xs text-gray-400">
                {isKo ? '오늘 페이지뷰' : 'Today\'s Page Views'}
              </p>
            </div>
            <p className="text-3xl font-bold text-amber-700">
              {formatNumber(stats.todayPageViews)}
            </p>
          </div>
        </section>
      ) : (
        <section className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
          <p className="text-amber-700 font-semibold mb-1">
            {isKo ? '통계 설정 필요' : 'Stats Setup Required'}
          </p>
          <p className="text-sm text-amber-600">
            {isKo
              ? 'GA4 서비스 계정 연동 후 실제 방문 데이터가 표시됩니다.'
              : 'Connect a GA4 service account to display visitor data.'}
          </p>
        </section>
      )}

      {/* 인기 글 TOP 10 */}
      <section className="mt-12">
        <h2 className="text-base font-semibold text-gray-700 mb-4">
          {isKo ? '🔥 인기 글 TOP 10' : '🔥 Popular Posts TOP 10'}
          {stats && (
            <span className="text-xs font-normal text-gray-400 ml-2">
              {isKo ? '최근 90일 기준' : 'Last 90 days'}
            </span>
          )}
        </h2>

        {enrichedPosts.length > 0 ? (
          <ol className="space-y-3">
            {enrichedPosts.map((post) => (
              <li key={post.path}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-amber-200 hover:shadow-sm transition-all group"
                >
                  <span
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold shrink-0 ${
                      post.rank <= 3 ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {post.rank}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-800 group-hover:text-amber-600 transition-colors leading-snug">
                    {post.displayTitle}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    👁️ {formatNumber(post.pageViews)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-3xl mb-2">📈</p>
            <p className="text-sm">
              {stats
                ? (isKo ? '아직 충분한 방문 데이터가 없습니다.' : 'Not enough visitor data yet.')
                : (isKo ? 'GA4 연동 후 인기 글 순위가 표시됩니다.' : 'Connect GA4 to see popular posts.')}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
