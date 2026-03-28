import {MetadataRoute} from 'next';
import {getAllPosts, CATEGORIES} from '@/lib/posts';
import type {Locale} from '@/lib/posts';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';
const locales: Locale[] = ['ko', 'en'];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  const staticPages = ['', '/blog', '/about', '/contact', '/stats', '/privacy-policy'];
  for (const page of staticPages) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'daily' : page === '/blog' ? 'daily' : 'weekly',
        priority: page === '' ? 1 : page === '/blog' ? 0.9 : 0.3,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${BASE_URL}/${l}${page}`])
          ),
        },
      });
    }
  }

  // Category pages
  for (const category of Object.keys(CATEGORIES)) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/category/${category}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${BASE_URL}/${l}/category/${category}`])
          ),
        },
      });
    }
  }

  // Blog posts - all locales
  for (const locale of locales) {
    const posts = getAllPosts(locale);
    for (const post of posts) {
      const alternateLanguages: Record<string, string> = {};
      for (const l of locales) {
        const otherPosts = getAllPosts(l);
        if (otherPosts.some((p) => p.slug === post.slug)) {
          alternateLanguages[l] = `${BASE_URL}/${l}/blog/${post.slug}`;
        }
      }

      entries.push({
        url: `${BASE_URL}/${locale}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: {
          languages: alternateLanguages,
        },
      });
    }
  }

  return entries;
}
