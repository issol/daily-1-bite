import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteStats, getPopularPosts } from '@/lib/analytics';
import { getAllPosts } from '@/lib/posts';

export const revalidate = 3600; // 1시간마다 갱신

export const metadata: Metadata = {
  title: '방문 통계 | 매일 한입',
  description: '매일 한입 블로그 방문 통계 및 인기 글 TOP 10',
  alternates: { canonical: 'https://daily1bite.com/stats' },
};

function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '만';
  return n.toLocaleString('ko-KR');
}

export default async function StatsPage() {
  const [stats, popularPosts, allPosts] = await Promise.all([
    getSiteStats(),
    getPopularPosts(10),
    Promise.resolve(getAllPosts()),
  ]);

  const isConfigured = stats !== null;
  const totalPostCount = allPosts.length;

  // GA4 데이터와 블로그 포스트 매핑
  const enrichedPosts = popularPosts.map((p, i) => {
    const slug = p.path.replace(/^\/blog\//, '').replace(/\/$/, '');
    const post = allPosts.find((a) => a.slug === slug);
    return {
      ...p,
      rank: i + 1,
      displayTitle: post?.title || p.title || slug,
      slug,
    };
  });

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* 헤더 */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 방문 통계</h1>
        <p className="text-gray-500 text-sm">
          매일 한입 블로그의 누적 방문 데이터입니다.
          {isConfigured && (
            <span className="ml-2 text-xs text-gray-400">매 1시간마다 갱신</span>
          )}
        </p>
      </div>

      {/* 통계 카드 */}
      {isConfigured ? (
        <>
          <section className="mb-12">
            <h2 className="text-base font-semibold text-gray-700 mb-4">전체 누적</h2>
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon="👤"
                label="총 방문자"
                value={formatNumber(stats.totalUsers)}
                sub="명"
              />
              <StatCard
                icon="👁️"
                label="총 페이지뷰"
                value={formatNumber(stats.totalPageViews)}
                sub="회"
              />
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-base font-semibold text-gray-700 mb-4">최근 30일</h2>
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon="📅"
                label="방문자"
                value={formatNumber(stats.last30DaysUsers)}
                sub="명"
                highlight
              />
              <StatCard
                icon="📄"
                label="페이지뷰"
                value={formatNumber(stats.last30DaysPageViews)}
                sub="회"
                highlight
              />
            </div>
          </section>
        </>
      ) : (
        <section className="mb-12 p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
          <p className="text-amber-700 font-semibold mb-1">통계 설정 필요</p>
          <p className="text-sm text-amber-600">
            GA4 서비스 계정 연동 후 실제 방문 데이터가 표시됩니다.
          </p>
        </section>
      )}

      {/* 총 글 수 */}
      <section className="mb-12">
        <div className="flex items-center gap-3 p-5 bg-gray-50 rounded-2xl border border-gray-100">
          <span className="text-2xl">📝</span>
          <div>
            <p className="text-xs text-gray-400">누적 발행 글</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalPostCount}
              <span className="text-sm font-normal text-gray-500 ml-1">편</span>
            </p>
          </div>
        </div>
      </section>

      {/* 인기 글 TOP 10 */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-4">
          🔥 인기 글 TOP 10
          {isConfigured && (
            <span className="text-xs font-normal text-gray-400 ml-2">최근 90일 기준</span>
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
                      post.rank <= 3
                        ? 'bg-amber-400 text-white'
                        : 'bg-gray-100 text-gray-500'
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
              {isConfigured
                ? '아직 충분한 방문 데이터가 없습니다.'
                : 'GA4 연동 후 인기 글 순위가 표시됩니다.'}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-5 rounded-2xl border ${
        highlight
          ? 'bg-amber-50 border-amber-200'
          : 'bg-white border-gray-100'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${highlight ? 'text-amber-700' : 'text-gray-900'}`}>
        {value}
        <span className="text-sm font-normal ml-1 text-gray-400">{sub}</span>
      </p>
    </div>
  );
}
