import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import {CATEGORIES} from './categories';

export {CATEGORIES};

const contentDirectory = path.join(process.cwd(), 'content/posts');

export type Locale = 'ko' | 'en';

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  category: string;
  tags: string[];
  readingTime: string;
  thumbnail?: string;
}

export interface Post extends PostMeta {
  content: string;
}

function getPostsDirectory(locale: Locale): string {
  return path.join(contentDirectory, locale);
}

function getAllMdxFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, {withFileTypes: true});
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllMdxFiles(fullPath));
    } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function formatReadingTime(minutes: number, locale: Locale): string {
  return locale === 'ko' ? `${minutes}분` : `${minutes} min`;
}

export function getAllPosts(locale: Locale = 'ko'): PostMeta[] {
  const postsDir = getPostsDirectory(locale);
  const files = getAllMdxFiles(postsDir);

  const posts = files.map((filePath) => {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const {data, content} = matter(fileContents);

    const relativePath = path.relative(postsDir, filePath);
    const slug = relativePath.replace(/\.(mdx|md)$/, '').replace(/\\/g, '/');

    const stats = readingTime(content);

    return {
      slug,
      title: data.title || 'Untitled',
      date: data.date || new Date().toISOString().split('T')[0],
      description: data.description || '',
      category: data.category || 'ai',
      tags: data.tags || [],
      readingTime: formatReadingTime(Math.ceil(stats.minutes), locale),
      thumbnail: data.thumbnail || null,
    } as PostMeta;
  });

  return posts.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPostBySlug(slug: string, locale: Locale = 'ko'): Post | null {
  const postsDir = getPostsDirectory(locale);
  const extensions = ['.mdx', '.md'];

  for (const ext of extensions) {
    const filePath = path.join(postsDir, `${slug}${ext}`);
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const {data, content} = matter(fileContents);
      const stats = readingTime(content);

      return {
        slug,
        title: data.title || 'Untitled',
        date: data.date || '',
        description: data.description || '',
        category: data.category || 'ai',
        tags: data.tags || [],
        readingTime: formatReadingTime(Math.ceil(stats.minutes), locale),
        thumbnail: data.thumbnail || null,
        content,
      };
    }
  }
  return null;
}

export function getPostsByCategory(category: string, locale: Locale = 'ko'): PostMeta[] {
  return getAllPosts(locale).filter((post) => post.category === category);
}

export function getAllSlugs(locale: Locale = 'ko'): string[] {
  return getAllPosts(locale).map((post) => post.slug);
}

export function hasTranslation(slug: string, locale: Locale): boolean {
  const postsDir = getPostsDirectory(locale);
  return (
    fs.existsSync(path.join(postsDir, `${slug}.mdx`)) ||
    fs.existsSync(path.join(postsDir, `${slug}.md`))
  );
}
