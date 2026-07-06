import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { unstable_cache } from 'next/cache';

// GA4 결과 캐시 TTL(초). 조회수는 SEO에 무관하고 실시간일 필요가 없으므로
// 1시간 캐시로 렌더당 GA4 왕복을 제거한다. on-demand ISR로 생성되는 오래된 글이
// Googlebot에 처음 크롤될 때, 그리고 매 revalidate 재생성마다 GA4 API를 동기
// 호출하던 병목(느린 TTFB → 크롤 속도 저하)을 없애기 위한 것.
const GA4_CACHE_TTL = 3600;

const propertyId = process.env.GA_PROPERTY_ID || '';
const clientEmail = process.env.GA_CLIENT_EMAIL || '';
const privateKey = (process.env.GA_PRIVATE_KEY || '').replace(/\\n/g, '\n');

function isConfigured() {
  return propertyId && clientEmail && privateKey;
}

function getClient() {
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  });
}

export interface SiteStats {
  totalPageViews: number;
  todayPageViews: number;
}

export interface PopularPost {
  path: string;
  title: string;
  pageViews: number;
}

async function fetchSiteStats(): Promise<SiteStats | null> {
  if (!isConfigured()) return null;

  try {
    const client = getClient();

    const [allTimeRes] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '2020-01-01', endDate: 'today' }],
      metrics: [{ name: 'screenPageViews' }],
    });

    const [todayRes] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: 'today', endDate: 'today' }],
      metrics: [{ name: 'screenPageViews' }],
    });

    return {
      totalPageViews: parseInt(allTimeRes.rows?.[0]?.metricValues?.[0]?.value || '0'),
      todayPageViews: parseInt(todayRes.rows?.[0]?.metricValues?.[0]?.value || '0'),
    };
  } catch (e) {
    console.error('GA4 getSiteStats error:', e);
    return null;
  }
}

async function fetchPopularPosts(limit = 10): Promise<PopularPost[]> {
  if (!isConfigured()) return [];

  try {
    const client = getClient();

    const [res] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: { matchType: 'CONTAINS', value: '/blog/' },
        },
      },
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit,
    });

    return (res.rows || []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || '',
      title: row.dimensionValues?.[1]?.value || '',
      pageViews: parseInt(row.metricValues?.[0]?.value || '0'),
    }));
  } catch (e) {
    console.error('GA4 getPopularPosts error:', e);
    return [];
  }
}

// ─────────────────────────────────────────
// 캐시 래퍼 — 렌더당 GA4 왕복을 제거한다.
// unstable_cache는 (함수, keyParts, opts)로 결과를 서버 캐시에 저장하며,
// 인자(limit)가 캐시 키에 포함되므로 limit별로 최대 1회만 GA4를 호출한다.
// 여러 글/목록 페이지의 ISR 재생성이 같은 결과를 공유 → GA4 API 호출·지연·쿼터 부담 급감.
// ─────────────────────────────────────────
export const getSiteStats = unstable_cache(fetchSiteStats, ['ga4-site-stats'], {
  revalidate: GA4_CACHE_TTL,
  tags: ['ga4'],
});

export const getPopularPosts = unstable_cache(fetchPopularPosts, ['ga4-popular-posts'], {
  revalidate: GA4_CACHE_TTL,
  tags: ['ga4'],
});
