import type { Metadata } from 'next';
import { getSiteStats } from '@/lib/analytics';
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

  const stats = await getSiteStats();
  const isKo = locale === 'ko';

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
    </main>
  );
}
