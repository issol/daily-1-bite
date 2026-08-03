import {MetadataRoute} from 'next';
import {getAllPosts, CATEGORIES} from '@/lib/posts';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

// Site launch date — used as a floor for stable pages that don't change frequently.
const SITE_FLOOR = new Date('2026-03-24');

// alternates.languages 는 내보내지 않는다.
//
// 언어가 하나뿐이면 대체 언어 버전이라는 개념 자체가 없다. x-default 만 단독으로
// 자기 자신을 가리키는 선언은 Google에게 아무 정보도 주지 않으면서 hreflang 검증
// 대상만 늘린다. (개정된 I2 — docs/SEO-INVARIANTS.md)

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // noindex:true 글은 사이트맵에서 제외 — 색인 제외 신호와 일관성 유지. (I5)
  const posts = getAllPosts('ko').filter((p) => !p.noindex);

  // Latest post date — used as dynamic lastModified for home/blog index/category roots.
  // Falls back to SITE_FLOOR when no posts exist yet.
  const latestPostDate = posts.length > 0 ? new Date(posts[0].date) : SITE_FLOOR;

  // Per-category latest date — so each category's lastModified reflects its own activity.
  const categoryLatest: Record<string, Date> = {};
  for (const post of posts) {
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
    entries.push({
      url: `${BASE_URL}${page.path}`,
      lastModified: page.lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
  }

  // Category pages — lastModified reflects each category's most recent post.
  for (const category of Object.keys(CATEGORIES)) {
    entries.push({
      url: `${BASE_URL}/category/${category}`,
      lastModified: categoryLatest[category] || SITE_FLOOR,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }

  for (const post of posts) {
    entries.push({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updated || post.date),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  return entries;
}
