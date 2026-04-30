import {MetadataRoute} from 'next';
import {getAllPosts, CATEGORIES} from '@/lib/posts';
import type {Locale} from '@/lib/posts';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';
const locales: Locale[] = ['ko', 'en'];

// Site launch date — used for stable pages that don't change frequently.
// Update this manually when a static page is significantly revised.
const SITE_UPDATED = new Date('2026-03-24');

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  const staticPages = [
    {path: '', priority: 1.0, changeFrequency: 'daily' as const},
    {path: '/blog', priority: 0.9, changeFrequency: 'daily' as const},
    {path: '/about', priority: 0.5, changeFrequency: 'monthly' as const},
    {path: '/contact', priority: 0.3, changeFrequency: 'yearly' as const},
    {path: '/privacy-policy', priority: 0.2, changeFrequency: 'yearly' as const},
  ];
  for (const page of staticPages) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: SITE_UPDATED,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: {
            'x-default': `${BASE_URL}/ko${page.path}`,
            ...Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}${page.path}`])),
          },
        },
      });
    }
  }

  // Category pages
  for (const category of Object.keys(CATEGORIES)) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/category/${category}`,
        lastModified: SITE_UPDATED,
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: {
          languages: {
            'x-default': `${BASE_URL}/ko/category/${category}`,
            ...Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/category/${category}`])),
          },
        },
      });
    }
  }

  // Blog posts — KO locale only.
  // EN posts carry noindex (canonical points to KO), so including them in the
  // sitemap wastes crawl budget and inflates the "crawled – not indexed" count.
  // EN alternates are referenced in hreflang so Google still understands the
  // language relationship without treating EN as an independent indexable URL.
  const koPosts = getAllPosts('ko');
  const enPostSlugs = new Set(getAllPosts('en').map((p) => p.slug));

  for (const post of koPosts) {
    const languages: Record<string, string> = {
      'x-default': `${BASE_URL}/ko/blog/${post.slug}`,
      ko: `${BASE_URL}/ko/blog/${post.slug}`,
    };
    if (enPostSlugs.has(post.slug)) {
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
