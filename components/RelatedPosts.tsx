import Link from 'next/link';
import type {PostMeta} from '@/lib/posts';

interface RelatedPostsProps {
  currentSlug: string;
  posts: PostMeta[];
  maxCount?: number;
}

export default function RelatedPosts({ currentSlug, posts, maxCount = 8 }: RelatedPostsProps) {
  const others = posts.filter((p) => p.slug !== currentSlug);
  // 인바운드 링크 분산: 최신 절반 + 오래된 글 절반에서 슬러그 해시 기반 결정적 선택
  const half = Math.ceil(maxCount / 2);
  const latest = others.slice(0, half);
  const older = others.slice(half);
  // 결정적 시드(현재 슬러그 해시)로 오래된 글 중 일부 선택 — 매 빌드 일관
  const hash = currentSlug.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
  const olderPicks: typeof older = [];
  for (let i = 0; i < half && older.length > 0; i++) {
    const idx = Math.abs(hash + i * 7919) % older.length;
    olderPicks.push(older[idx]);
    older.splice(idx, 1);
  }
  const related = [...latest, ...olderPicks].slice(0, maxCount);

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
