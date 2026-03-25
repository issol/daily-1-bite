import { notFound } from 'next/navigation';
import { getPostsByCategory, CATEGORIES } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const label = CATEGORIES[category];
  if (!label) return {};

  return {
    title: label,
    description: `${label} 카테고리의 모든 글을 확인하세요.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const label = CATEGORIES[category];

  if (!label) notFound();

  const posts = getPostsByCategory(category);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <span className="text-xs font-semibold text-amber-500 bg-amber-50 px-3 py-1 rounded-full">
          카테고리
        </span>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">{label}</h1>
        <p className="text-sm text-gray-400 mt-1">총 {posts.length}개의 글</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>이 카테고리에는 아직 글이 없습니다.</p>
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
