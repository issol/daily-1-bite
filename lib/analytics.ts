import { BetaAnalyticsDataClient } from '@google-analytics/data';

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
  totalUsers: number;
  totalPageViews: number;
  last30DaysUsers: number;
  last30DaysPageViews: number;
}

export interface PopularPost {
  path: string;
  title: string;
  pageViews: number;
}

export async function getSiteStats(): Promise<SiteStats | null> {
  if (!isConfigured()) return null;

  try {
    const client = getClient();

    const [allTimeRes] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '2020-01-01', endDate: 'today' }],
      metrics: [{ name: 'totalUsers' }, { name: 'screenPageViews' }],
    });

    const [last30Res] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [{ name: 'totalUsers' }, { name: 'screenPageViews' }],
    });

    const allTime = allTimeRes.rows?.[0]?.metricValues;
    const last30 = last30Res.rows?.[0]?.metricValues;

    return {
      totalUsers: parseInt(allTime?.[0]?.value || '0'),
      totalPageViews: parseInt(allTime?.[1]?.value || '0'),
      last30DaysUsers: parseInt(last30?.[0]?.value || '0'),
      last30DaysPageViews: parseInt(last30?.[1]?.value || '0'),
    };
  } catch (e) {
    console.error('GA4 getSiteStats error:', e);
    return null;
  }
}

export async function getPopularPosts(limit = 10): Promise<PopularPost[]> {
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
          stringFilter: { matchType: 'BEGINS_WITH', value: '/blog/' },
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
