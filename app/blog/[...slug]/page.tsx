import { notFound } from 'next/navigation';
import { getAllSlugs, getPostBySlug, CATEGORIES } from '@/lib/posts';
import MDXContent from '@/components/MDXContent';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug: slug.split('/') }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const fullSlug = slug.join('/');
  const post = getPostBySlug(fullSlug);

  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const fullSlug = slug.join('/');
  const post = getPostBySlug(fullSlug);

  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-amber-500">홈</Link>
        <span>/</span>
        <Link href={`/category/${post.category}`} className="hover:text-amber-500">
          {CATEGORIES[post.category] || post.category}
        </Link>
      </nav>

      {/* Post header */}
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-amber-500 bg-amber-50 px-2 py-1 rounded-full">
            {CATEGORIES[post.category] || post.category}
          </span>
          <span className="text-xs text-gray-400">{post.readingTime} 소요</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 leading-snug mb-4">
          {post.title}
        </h1>
        {post.description && (
          <p className="text-gray-500 text-base leading-relaxed mb-4">{post.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <time>{post.date}</time>
          <span>·</span>
          <span>A꿀벌I</span>
        </div>
        {post.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <hr className="border-gray-100 mb-10" />

      {/* MDX content */}
      <article>
        <MDXContent source={post.content} />
      </article>

      <hr className="border-gray-100 mt-12 mb-8" />

      {/* Back link */}
      <div className="flex justify-between">
        <Link
          href={`/category/${post.category}`}
          className="text-sm text-amber-500 hover:underline"
        >
          ← {CATEGORIES[post.category]} 글 더 보기
        </Link>
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
          홈으로
        </Link>
      </div>
    </div>
  );
}
