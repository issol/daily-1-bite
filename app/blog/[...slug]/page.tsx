import { notFound } from 'next/navigation';
import { getAllSlugs, getPostBySlug, CATEGORIES } from '@/lib/posts';
import MDXContent from '@/components/MDXContent';
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd';
import Link from 'next/link';
import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily-1-bite.com';

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

  const url = `${BASE_URL}/blog/${fullSlug}`;
  const ogImage = post.thumbnail || `${BASE_URL}/og-default.png`;

  return {
    title: post.title,
    description: post.description,
    // GEO: keywords는 태그 기반으로 풍부하게
    keywords: [
      ...post.tags,
      CATEGORIES[post.category] || post.category,
      'AI', '인공지능', '매일 한입',
    ],
    authors: [{ name: 'A꿀벌I', url: `${BASE_URL}/about` }],
    // Canonical URL - 중복 색인 방지
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      url,
      locale: 'ko_KR',
      siteName: '매일 한입',
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.date,
      authors: [`${BASE_URL}/about`],
      section: CATEGORIES[post.category] || post.category,
      tags: post.tags,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [ogImage],
      creator: '@daily1bite',
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const fullSlug = slug.join('/');
  const post = getPostBySlug(fullSlug);

  if (!post) notFound();

  const categoryLabel = CATEGORIES[post.category] || post.category;
  const postUrl = `${BASE_URL}/blog/${fullSlug}`;

  return (
    <>
      {/* JSON-LD 구조화 데이터 */}
      <ArticleJsonLd
        title={post.title}
        description={post.description}
        date={post.date}
        slug={fullSlug}
        category={categoryLabel}
        tags={post.tags}
        thumbnail={post.thumbnail}
      />
      <BreadcrumbJsonLd
        items={[
          { name: '홈', url: BASE_URL },
          { name: categoryLabel, url: `${BASE_URL}/category/${post.category}` },
          { name: post.title, url: postUrl },
        ]}
      />

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* 시맨틱 브레드크럼 (SEO: BreadcrumbList + 가시적 UI 일치) */}
        <nav aria-label="breadcrumb" className="text-sm text-gray-400 mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-amber-500">홈</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/category/${post.category}`} className="hover:text-amber-500">
            {categoryLabel}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-600 truncate max-w-[200px]">{post.title}</span>
        </nav>

        {/* 포스트 헤더 */}
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href={`/category/${post.category}`}
              className="text-xs font-semibold text-amber-500 bg-amber-50 px-2 py-1 rounded-full hover:bg-amber-100 transition-colors"
            >
              {categoryLabel}
            </Link>
            <span className="text-xs text-gray-400">{post.readingTime} 소요</span>
          </div>

          {/* h1은 페이지당 하나 — SEO 핵심 */}
          <h1 className="text-3xl font-bold text-gray-900 leading-snug mb-4">
            {post.title}
          </h1>

          {/* GEO: .post-description 클래스 — speakable 스키마 타겟 */}
          {post.description && (
            <p className="post-description text-gray-500 text-base leading-relaxed mb-4">
              {post.description}
            </p>
          )}

          {/* 작성자 + 날짜 — E-E-A-T 강화 */}
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="font-medium text-gray-600">A꿀벌I</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.date}>{post.date}</time>
            <span aria-hidden="true">·</span>
            <span>{post.readingTime} 소요</span>
          </div>

          {post.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-4" aria-label="태그">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <hr className="border-gray-100 mb-10" />

        {/* 본문 — article 시맨틱 태그로 감싸기 */}
        <article
          itemScope
          itemType="https://schema.org/BlogPosting"
          className="min-w-0"
        >
          <meta itemProp="headline" content={post.title} />
          <meta itemProp="datePublished" content={post.date} />
          <meta itemProp="author" content="A꿀벌I" />
          <MDXContent source={post.content} />
        </article>

        <hr className="border-gray-100 mt-12 mb-8" />

        {/* 하단 네비게이션 */}
        <div className="flex justify-between items-center">
          <Link
            href={`/category/${post.category}`}
            className="text-sm text-amber-500 hover:underline"
          >
            ← {categoryLabel} 글 더 보기
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            홈으로
          </Link>
        </div>
      </div>
    </>
  );
}
