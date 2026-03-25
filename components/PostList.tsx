import Link from 'next/link';

const CATEGORIES: Record<string, string> = {
  'dev-life': 'Dev Life & Opinion',
  'ai-tools': 'AI Tools & Review',
  'ai-tutorial': 'AI Tutorial & How-to',
  'seo': 'SEO',
  'blog-info': 'Blog Info',
};

interface PostMeta {
  slug: string;
  title: string;
  date: string;
  category: string;
  readingTime: string;
}

interface PostListProps {
  posts: PostMeta[];
  viewsMap?: Record<string, number>;
}

export default function PostList({ posts, viewsMap = {} }: PostListProps) {
  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const views = viewsMap[post.slug];
        return (
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
              <div className="flex items-center gap-3 shrink-0">
                {views !== undefined && views > 0 && (
                  <span className="text-xs text-gray-400 hidden sm:block">
                    👁 {views.toLocaleString('ko-KR')}
                  </span>
                )}
                <span className="text-xs text-gray-400 hidden sm:block">
                  📖 {post.readingTime}
                </span>
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
