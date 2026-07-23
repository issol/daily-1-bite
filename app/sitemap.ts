import {MetadataRoute} from 'next';
import {getAllPosts, CATEGORIES} from '@/lib/posts';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

// Site launch date — used as a floor for stable pages that don't change frequently.
const SITE_FLOOR = new Date('2026-03-24');

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // noindex:true 글은 사이트맵에서 제외 — 색인 제외 신호와 일관성 유지.
  const koPosts = getAllPosts('ko').filter((p) => !p.noindex);

  // Latest post date — used as dynamic lastModified for home/blog index/category roots.
  // Falls back to SITE_FLOOR when no posts exist yet.
  const latestPostDate = koPosts.length > 0 ? new Date(koPosts[0].date) : SITE_FLOOR;

  // Per-category latest date — so each category's lastModified reflects its own activity.
  const categoryLatest: Record<string, Date> = {};
  for (const post of koPosts) {
    const d = new Date(post.date);
    if (!categoryLatest[post.category] || d > categoryLatest[post.category]) {
      categoryLatest[post.category] = d;
    }
  }

  // Static pages — home + blog index move with latest post; About/Contact/Privacy stay on SITE_FLOOR.
  const staticPages = [
    {path: '', priority: 1.0, changeFrequency: 'daily' as const, lastModified: latestPostDate},
    {path: '/blog', priority: 0.9, changeFrequency: 'daily' as const, lastModified: latestPostDate},
    {path: '/about', priority: 0.5, changeFrequency: 'monthly' as const, lastModified: SITE_FLOOR},
    {path: '/contact', priority: 0.3, changeFrequency: 'yearly' as const, lastModified: SITE_FLOOR},
    {path: '/privacy-policy', priority: 0.2, changeFrequency: 'yearly' as const, lastModified: SITE_FLOOR},
  ];
  for (const page of staticPages) {
    // KO only — EN routes are crawl-blocked via robots.ts and redirected at the app level.
    entries.push({
      url: `${BASE_URL}/ko${page.path}`,
      lastModified: page.lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: {
          'x-default': `${BASE_URL}/ko${page.path}`,
          ko: `${BASE_URL}/ko${page.path}`,
        },
      },
    });
  }

  // Category pages — KO only, lastModified reflects each category's most recent post.
  for (const category of Object.keys(CATEGORIES)) {
    entries.push({
      url: `${BASE_URL}/ko/category/${category}`,
      lastModified: categoryLatest[category] || SITE_FLOOR,
      changeFrequency: 'weekly',
      priority: 0.6,
      alternates: {
        languages: {
          'x-default': `${BASE_URL}/ko/category/${category}`,
          ko: `${BASE_URL}/ko/category/${category}`,
        },
      },
    });
  }

  // Blog posts — KO only.
  //
  // EN alternate는 의도적으로 내보내지 않는다. EN 글 URL은 KO로 308 redirect되므로
  // hreflang="en"으로 지목하면 "리디렉트되는 URL을 대체 버전으로 선언"하는 꼴이 되어
  // Google이 hreflang 클러스터 자체를 무효 처리한다(이전엔 79개가 이 상태였다).
  // 존재하지 않는 언어 버전을 광고하는 것보다 KO 단일 클러스터가 정확하다.
  for (const post of koPosts) {
    const languages: Record<string, string> = {
      'x-default': `${BASE_URL}/ko/blog/${post.slug}`,
      ko: `${BASE_URL}/ko/blog/${post.slug}`,
    };

    entries.push({
      url: `${BASE_URL}/ko/blog/${post.slug}`,
      lastModified: new Date(post.updated || post.date),
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: {languages},
    });
  }

  return entries;
}
