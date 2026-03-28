import {Link} from '@/i18n/navigation';
import type {PostMeta} from '@/lib/posts';

interface RelatedPostsProps {
  currentSlug: string;
  posts: PostMeta[];
  maxCount?: number;
}

export default function RelatedPosts({ currentSlug, posts, maxCount = 4 }: RelatedPostsProps) {
  const related = posts
    .filter((p) => p.slug !== currentSlug)
    .slice(0, maxCount);

  if (related.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-4">📚 관련 글</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {related.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="flex flex-col gap-1 p-4 rounded-xl border border-gray-100 bg-white hover:border-amber-200 hover:shadow-sm transition-all group"
          >
            <span className="text-sm font-medium text-gray-800 group-hover:text-amber-600 transition-colors leading-snug line-clamp-2">
              {post.title}
            </span>
            <span className="text-xs text-gray-400">{post.date}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
