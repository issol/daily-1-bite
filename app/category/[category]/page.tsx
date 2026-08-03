import {notFound} from 'next/navigation';
import {getPostsByCategory, CATEGORIES} from '@/lib/posts';
import PostCard from '@/components/PostCard';
import {S} from '@/lib/strings';
import type {Metadata} from 'next';

interface Props {
  params: Promise<{category: string}>;
}

export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map((category) => ({category}));
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {category} = await params;
  const label = CATEGORIES[category];
  if (!label) return {};

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

  // Pull recent posts + tags so the meta description carries actual category signal
  // instead of one boilerplate line — addresses GSC "thin content" indexing skips.
  const posts = getPostsByCategory(category, 'ko');
  const recent = posts.slice(0, 3);
  const tagPool = Array.from(new Set(posts.flatMap((p) => p.tags))).slice(0, 8);

  const description = `${label} 카테고리 — 매일 한입이 정리한 ${posts.length}개의 글. ${
    recent.length > 0 ? `최신: ${recent.map((p) => p.title).join(' / ').slice(0, 90)}. ` : ''
  }${tagPool.length > 0 ? `핵심 키워드: ${tagPool.join(', ')}.` : ''}`.trim().slice(0, 300);

  const canonicalUrl = `${BASE_URL}/category/${category}`;

  return {
    title: `${label} (${posts.length}개 글)`,
    description,
    keywords: [label, ...tagPool, 'AI', '매일 한입'],
    alternates: {
      canonical: canonicalUrl,
      // hreflang 없음 — 단일 언어다. (개정된 I2)
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title: `${label} | 매일 한입`,
      description,
    },
  };
}

export default async function CategoryPage({params}: Props) {
  const {category} = await params;

  const label = CATEGORIES[category];
  if (!label) notFound();

  const posts = getPostsByCategory(category, 'ko');

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <span className="text-xs font-semibold text-amber-500 bg-amber-50 px-3 py-1 rounded-full">
          {S.blog.allPosts}
        </span>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">{label}</h1>
        <p className="text-sm text-gray-400 mt-1">
          {S.blog.postCount(posts.length)}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>{S.home.noPosts}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
