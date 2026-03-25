import { MetadataRoute } from 'next';
import { getAllPosts, CATEGORIES } from '@/lib/posts';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily-1-bite.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const postUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const categoryUrls: MetadataRoute.Sitemap = Object.keys(CATEGORIES).map((category) => ({
    url: `${BASE_URL}/category/${category}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...categoryUrls,
    ...postUrls,
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];
}
