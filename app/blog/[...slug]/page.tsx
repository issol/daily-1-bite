import {notFound} from 'next/navigation';
import {getAllSlugs, getPostBySlug, getPostsByCategory, CATEGORIES} from '@/lib/posts';
import MDXContent from '@/components/MDXContent';
import {ArticleJsonLd, BreadcrumbJsonLd, FAQJsonLd, HowToJsonLd} from '@/components/JsonLd';
import {extractFAQs, extractHowToSteps} from '@/lib/geo';
import RelatedPosts from '@/components/RelatedPosts';
import TableOfContents from '@/components/TableOfContents';
import Comments from '@/components/Comments';
import {getPopularPosts} from '@/lib/analytics';
import Link from 'next/link';
import {Suspense} from 'react';
import type {Metadata} from 'next';
import {AUTHOR} from '@/lib/author';
import {S} from '@/lib/strings';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

interface Props {
  params: Promise<{slug: string[]}>;
}

// Individual posts rarely change after publishing, and every deploy (daily, on
// new-post commits) wipes the ISR cache anyway — so staleness is already capped
// at ~1 day. Match revalidate to that cadence instead of 1h: Next emits
// `s-maxage=86400`, cutting background ISR re-renders on the long tail ~24x.
export const revalidate = 86400;

// Build-cost optimization: only pre-render the most recent posts at build time.
// Older posts are generated on-demand on first request and then cached via ISR
// (dynamicParams defaults to true). This keeps every deploy from re-rendering the
// entire back-catalog, which was the main driver of build minutes.
// Older posts still appear in the sitemap and remain fully indexable.
// Set to 0 (or a very large number) to pre-render everything again.
//
// Tunable via env (PRERENDER_RECENT_COUNT). Default raised 40→80: while the site
// is recovering from the April de-indexing, we want Googlebot to hit warm,
// CDN-served HTML (instant TTFB) on as many posts as possible rather than
// cold on-demand ISR. GA4 is now cached (see lib/analytics.ts) so cold renders
// are cheap regardless, but pre-rendered pages still crawl fastest.
const PRERENDER_RECENT_COUNT = Number(process.env.PRERENDER_RECENT_COUNT ?? 80);

export const dynamicParams = true;

export async function generateStaticParams() {
  // getAllSlugs('ko') is date-descending, so the first N entries are the newest posts.
  const slugs = getAllSlugs('ko');
  const recentSlugs =
    PRERENDER_RECENT_COUNT > 0 ? slugs.slice(0, PRERENDER_RECENT_COUNT) : slugs;
  return recentSlugs.map((slug) => ({slug: slug.split('/')}));
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params;
  const fullSlug = slug.join('/');
  const post = getPostBySlug(fullSlug, 'ko');

  if (!post) return {};

  const url = `${BASE_URL}/blog/${fullSlug}`;
  const ogImage = post.thumbnail || `${BASE_URL}/og-default.png`;

  return {
    title: post.title,
    description: post.description,
    keywords: [
      ...post.tags,
      CATEGORIES[post.category] || post.category,
      'AI',
      '인공지능',
      '매일 한입',
    ],
    authors: [{name: AUTHOR.name, url: `${BASE_URL}/about`}],
    // frontmatter noindex:true 글은 색인에서 제외한다(시효 지난 저가치 글).
    robots: post.noindex ? {index: false, follow: true} : undefined,
    alternates: {
      canonical: url,
      // hreflang 없음 — 단일 언어다. (개정된 I2)
    },
    openGraph: {
      type: 'article',
      url,
      locale: 'ko_KR',
      siteName: '매일 한입',
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      authors: [`${BASE_URL}/about`],
      section: CATEGORIES[post.category] || post.category,
      tags: post.tags,
      images: [{url: ogImage, width: 1200, height: 630, alt: post.title}],
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

export default async function PostPage({params}: Props) {
  const {slug} = await params;
  const fullSlug = slug.join('/');

  const post = getPostBySlug(fullSlug, 'ko');
  if (!post) notFound();

  const categoryLabel = CATEGORIES[post.category] || post.category;
  const postUrl = `${BASE_URL}/blog/${fullSlug}`;

  const faqs = extractFAQs(post.content);
  const howToSteps = post.category === 'ai-tutorial' ? extractHowToSteps(post.content) : [];

  const popularPosts = await getPopularPosts(100);
  const viewData = popularPosts.find(
    // GA4 경로는 이전 전후가 섞인다 — /ko/blog/x 와 /blog/x 를 모두 벗긴다.
    (p) => p.path.replace(/^\/(ko|en)\/blog\//, '').replace(/^\/blog\//, '').replace(/\/$/, '') === fullSlug
  );
  const views = viewData?.pageViews || 0;

  return (
    <>
      <ArticleJsonLd
        title={post.title}
        description={post.description}
        date={post.date}
        dateModified={post.updated || post.date}
        slug={fullSlug}
        category={categoryLabel}
        tags={post.tags}
        thumbnail={post.thumbnail}
      />
      <BreadcrumbJsonLd
        items={[
          {name: S.nav.home, url: BASE_URL},
          {name: categoryLabel, url: `${BASE_URL}/category/${post.category}`},
          {name: post.title, url: postUrl},
        ]}
      />
      {faqs.length > 0 && <FAQJsonLd faqs={faqs} />}
      {howToSteps.length > 0 && (
        <HowToJsonLd
          title={post.title}
          description={post.description}
          steps={howToSteps}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 py-10">
        <nav aria-label="breadcrumb" className="text-sm text-gray-400 mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-amber-500">{S.nav.home}</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/category/${post.category}`} className="hover:text-amber-500">
            {categoryLabel}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-600 truncate max-w-[200px]">{post.title}</span>
        </nav>

        <header className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href={`/category/${post.category}`}
              className="text-xs font-semibold text-amber-500 bg-amber-50 px-2 py-1 rounded-full hover:bg-amber-100 transition-colors"
            >
              {categoryLabel}
            </Link>
            <span className="text-xs text-gray-400">
              📖 {S.post.readingTime(parseInt(post.readingTime))}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 leading-snug mb-4">
            {post.title}
          </h1>

          {post.description && (
            <p className="post-description sr-only">{post.description}</p>
          )}

          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Link href="/about" rel="author" className="font-medium text-gray-600 hover:text-amber-500">
              {AUTHOR.name}
            </Link>
            <span aria-hidden="true">·</span>
            <time dateTime={post.date}>{post.date}</time>
            <span aria-hidden="true">·</span>
            <span>📖 {S.post.readingTime(parseInt(post.readingTime))}</span>
            {views > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>👁 {views.toLocaleString()}회</span>
              </>
            )}
          </div>

          {post.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-4" aria-label={S.post.tags}>
              {post.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <hr className="border-gray-100 mb-10" />
        <TableOfContents />

        <article itemScope itemType="https://schema.org/BlogPosting" className="min-w-0">
          <meta itemProp="headline" content={post.title} />
          <meta itemProp="datePublished" content={post.date} />
          <meta itemProp="author" content={AUTHOR.name} />
          <MDXContent source={post.content} />
        </article>

        <RelatedPosts
          currentSlug={fullSlug}
          posts={getPostsByCategory(post.category, 'ko')}
        />

        <Suspense fallback={null}>
          <Comments />
        </Suspense>

        <hr className="border-gray-100 mt-12 mb-8" />

        <div className="flex justify-between items-center">
          <Link href={`/category/${post.category}`} className="text-sm text-amber-500 hover:underline">
            {S.post.backToCategory(categoryLabel)}
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            {S.post.backHome}
          </Link>
        </div>
      </div>
    </>
  );
}
