import Link from 'next/link';
import { PostMeta, CATEGORIES } from '@/lib/posts';

interface PostCardProps {
  post: PostMeta;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="group border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-amber-200 transition-all bg-white">
      <Link href={`/blog/${post.slug}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-amber-500 bg-amber-50 px-2 py-1 rounded-full">
            {CATEGORIES[post.category] || post.category}
          </span>
          <span className="text-xs text-gray-400">📖 {post.readingTime} 읽기</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors leading-snug">
          {post.title}
        </h2>
        {post.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
            {post.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <time className="text-xs text-gray-400">{post.date}</time>
          {post.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap justify-end">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
