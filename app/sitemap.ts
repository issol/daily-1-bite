import {MetadataRoute} from 'next';
import {getAllPosts, CATEGORIES} from '@/lib/posts';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

// Site launch date — used as a floor for stable pages that don't change frequently.
const SITE_FLOOR = new Date('2026-03-24');

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  const koPosts = getAllPosts('ko');
  const enPostSlugs = new Set(getAllPosts('en').map((p) => p.slug));

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
  // EN posts carry noindex + a permanent redirect to KO, so emitting them in
  // the sitemap would only confuse Google about the canonical URL.
  for (const post of koPosts) {
    const languages: Record<string, string> = {
      'x-default': `${BASE_URL}/ko/blog/${post.slug}`,
      ko: `${BASE_URL}/ko/blog/${post.slug}`,
    };
    if (enPostSlugs.has(post.slug)) {
      // Keep the hreflang reference so Google knows the EN translation exists,
      // even though the EN URL itself is not crawled.
      languages.en = `${BASE_URL}/en/blog/${post.slug}`;
    }

    entries.push({
      url: `${BASE_URL}/ko/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: {languages},
    });
  }

  return entries;
}
