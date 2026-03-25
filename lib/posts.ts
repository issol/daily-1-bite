import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { CATEGORIES } from './categories';

export { CATEGORIES };

const postsDirectory = path.join(process.cwd(), 'content/posts');

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

function getAllMdxFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
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

export function getAllPosts(): PostMeta[] {
  const files = getAllMdxFiles(postsDirectory);

  const posts = files.map((filePath) => {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    const relativePath = path.relative(postsDirectory, filePath);
    const slug = relativePath.replace(/\.(mdx|md)$/, '').replace(/\\/g, '/');

    const stats = readingTime(content);

    return {
      slug,
      title: data.title || 'Untitled',
      date: data.date || new Date().toISOString().split('T')[0],
      description: data.description || '',
      category: data.category || 'ai',
      tags: data.tags || [],
      readingTime: `${Math.ceil(stats.minutes)}분`,
      thumbnail: data.thumbnail || null,
    } as PostMeta;
  });

  return posts.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPostBySlug(slug: string): Post | null {
  const extensions = ['.mdx', '.md'];

  for (const ext of extensions) {
    const filePath = path.join(postsDirectory, `${slug}${ext}`);
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);
      const stats = readingTime(content);

      return {
        slug,
        title: data.title || 'Untitled',
        date: data.date || '',
        description: data.description || '',
        category: data.category || 'ai',
        tags: data.tags || [],
        readingTime: `${Math.ceil(stats.minutes)}분`,
        thumbnail: data.thumbnail || null,
        content,
      };
    }
  }
  return null;
}

export function getPostsByCategory(category: string): PostMeta[] {
  return getAllPosts().filter((post) => post.category === category);
}

export function getAllSlugs(): string[] {
  return getAllPosts().map((post) => post.slug);
}
