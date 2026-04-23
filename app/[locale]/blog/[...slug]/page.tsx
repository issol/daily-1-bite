import {notFound} from 'next/navigation';
import {getAllSlugs, getPostBySlug, getPostsByCategory, CATEGORIES, hasTranslation} from '@/lib/posts';
import type {Locale} from '@/lib/posts';
import MDXContent from '@/components/MDXContent';
import {ArticleJsonLd, BreadcrumbJsonLd, FAQJsonLd, HowToJsonLd} from '@/components/JsonLd';
import {extractFAQs, extractHowToSteps} from '@/lib/geo';
import RelatedPosts from '@/components/RelatedPosts';
import TableOfContents from '@/components/TableOfContents';
import Comments from '@/components/Comments';
import {getPopularPosts} from '@/lib/analytics';
import {Link} from '@/i18n/navigation';
import {Suspense} from 'react';
import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {routing} from '@/i18n/routing';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

interface Props {
  params: Promise<{locale: string; slug: string[]}>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const params: {locale: string; slug: string[]}[] = [];
  for (const locale of routing.locales) {
    const slugs = getAllSlugs(locale as Locale);
    for (const slug of slugs) {
      params.push({locale, slug: slug.split('/')});
    }
  }
  return params;
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale, slug} = await params;
  const fullSlug = slug.join('/');
  const post = getPostBySlug(fullSlug, locale as Locale);

  if (!post) return {};

  const url = `${BASE_URL}/${locale}/blog/${fullSlug}`;
  const ogImage = post.thumbnail || `${BASE_URL}/og-default.png`;
  const isKo = locale === 'ko';

  const languages: Record<string, string> = {
    'x-default': `${BASE_URL}/ko/blog/${fullSlug}`,
  };
  for (const loc of routing.locales) {
    if (hasTranslation(fullSlug, loc as Locale)) {
      languages[loc] = `${BASE_URL}/${loc}/blog/${fullSlug}`;
    }
  }

  // EN 포스트는 KO를 canonical로 지정 — 동일 주제 중복 콘텐츠 해소
  const canonicalUrl = isKo ? url : `${BASE_URL}/ko/blog/${fullSlug}`;

  return {
    title: post.title,
    description: post.description,
    keywords: [
      ...post.tags,
      CATEGORIES[post.category] || post.category,
      'AI',
      isKo ? '인공지능' : 'artificial intelligence',
      isKo ? '매일 한입' : 'Daily 1 Bite',
    ],
    authors: [{name: 'A꿀벌I', url: `${BASE_URL}/about`}],
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      type: 'article',
      url,
      locale: isKo ? 'ko_KR' : 'en_US',
      alternateLocale: isKo ? 'en_US' : 'ko_KR',
      siteName: isKo ? '매일 한입' : 'Daily 1 Bite',
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.date,
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
  const {locale, slug} = await params;
  setRequestLocale(locale);
  const fullSlug = slug.join('/');
  const post = getPostBySlug(fullSlug, locale as Locale);
  const t = await getTranslations();

  if (!post) {
    const otherLocale = locale === 'ko' ? 'en' : 'ko';
    if (hasTranslation(fullSlug, otherLocale as Locale)) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-6">🌐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('post.notAvailable')}
          </h1>
          <a
            href={`/${otherLocale}/blog/${fullSlug}`}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-amber-400 text-white font-medium hover:bg-amber-500 transition-colors"
          >
            {t('post.viewOriginal')}
          </a>
        </div>
      );
    }
    notFound();
  }

  const categoryLabel = CATEGORIES[post.category] || post.category;
  const postUrl = `${BASE_URL}/${locale}/blog/${fullSlug}`;

  const faqs = extractFAQs(post.content);
  const howToSteps = post.category === 'ai-tutorial' ? extractHowToSteps(post.content) : [];

  const popularPosts = await getPopularPosts(100);
  const viewData = popularPosts.find(
    (p) => p.path.replace(/^\/(ko|en)\/blog\//, '').replace(/^\/blog\//, '').replace(/\/$/, '') === fullSlug
  );
  const views = viewData?.pageViews || 0;

  return (
    <>
      <ArticleJsonLd
        title={post.title}
        description={post.description}
        date={post.date}
        slug={fullSlug}
        category={categoryLabel}
        tags={post.tags}
        thumbnail={post.thumbnail}
        locale={locale}
      />
      <BreadcrumbJsonLd
        items={[
          {name: t('nav.home'), url: `${BASE_URL}/${locale}`},
          {name: categoryLabel, url: `${BASE_URL}/${locale}/category/${post.category}`},
          {name: post.title, url: postUrl},
        ]}
      />
      {faqs.length > 0 && <FAQJsonLd faqs={faqs} />}
      {howToSteps.length > 0 && (
        <HowToJsonLd
          title={post.title}
          description={post.description}
          steps={howToSteps}
          locale={locale}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 py-10">
        <nav aria-label="breadcrumb" className="text-sm text-gray-400 mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-amber-500">{t('nav.home')}</Link>
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
              📖 {t('post.readingTime', {minutes: parseInt(post.readingTime)})}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 leading-snug mb-4">
            {post.title}
          </h1>

          {post.description && (
            <p className="post-description sr-only">{post.description}</p>
          )}

          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="font-medium text-gray-600">A꿀벌I</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.date}>{post.date}</time>
            <span aria-hidden="true">·</span>
            <span>📖 {t('post.readingTime', {minutes: parseInt(post.readingTime)})}</span>
            {views > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>👁 {t('post.views', {count: views.toLocaleString()})}</span>
              </>
            )}
          </div>

          {post.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-4" aria-label={t('post.tags')}>
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
          <meta itemProp="author" content="A꿀벌I" />
          <MDXContent source={post.content} />
        </article>

        <RelatedPosts
          currentSlug={fullSlug}
          posts={getPostsByCategory(post.category, locale as Locale)}
        />

        <Suspense fallback={null}>
          <Comments />
        </Suspense>

        <hr className="border-gray-100 mt-12 mb-8" />

        <div className="flex justify-between items-center">
          <Link href={`/category/${post.category}`} className="text-sm text-amber-500 hover:underline">
            {t('post.backToCategory', {category: categoryLabel})}
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            {t('post.backHome')}
          </Link>
        </div>
      </div>
    </>
  );
}
