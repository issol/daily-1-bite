import Link from 'next/link';

interface PostMeta {
  slug: string;
  title: string;
  date: string;
  category: string;
  readingTime: string;
}

const CATEGORIES: Record<string, string> = {
  'ai': 'AI',
  'dev-life': 'Dev Life & Opinion',
  'ai-tools': 'AI Tools & Review',
  'ai-tutorial': 'AI Tutorial & How-to',
  'seo': 'SEO',
  'blog-info': 'Blog Info',
};

interface PostListProps {
  posts: PostMeta[];
}

export default function PostList({ posts }: PostListProps) {
  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <article key={post.slug} className="group">
          <Link
            href={`/blog/${post.slug}`}
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-amber-200 hover:shadow-sm transition-all"
          >
            <time className="text-xs text-gray-400 whitespace-nowrap shrink-0 sm:w-24">
              {post.date}
            </time>
            <span className="text-xs font-semibold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full shrink-0 w-fit">
              {CATEGORIES[post.category] || post.category}
            </span>
            <span className="flex-1 text-sm font-medium text-gray-800 group-hover:text-amber-600 transition-colors leading-snug">
              {post.title}
            </span>
            <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
              📖 {post.readingTime}
            </span>
          </Link>
        </article>
      ))}
    </div>
  );
}
