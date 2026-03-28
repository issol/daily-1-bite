import {getAllPosts} from '@/lib/posts';
import type {Locale} from '@/lib/posts';
import PostListWithToggle from '@/components/PostListWithToggle';
import SearchBar from '@/components/SearchBar';
import {BlogJsonLd} from '@/components/JsonLd';
import {getPopularPosts} from '@/lib/analytics';
import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';

export const revalidate = 3600;

interface Props {
  params: Promise<{locale: string}>;
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const isKo = locale === 'ko';
  return {
    title: isKo ? '전체 글' : 'All Posts',
    description: isKo
      ? '매일 한입 블로그의 모든 글을 확인하세요. AI 뉴스 요약, 도구 리뷰, 튜토리얼.'
      : 'Browse all posts on the Daily 1 Bite blog. AI news, tool reviews, and tutorials.',
  };
}

export default async function BlogPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const posts = getAllPosts(locale as Locale);
  const popularPosts = await getPopularPosts(100);
  const viewsMap: Record<string, number> = {};
  for (const p of popularPosts) {
    const slug = p.path.replace(/^\/blog\//, '').replace(/\/$/, '');
    viewsMap[slug] = p.pageViews;
  }

  return (
    <>
      <BlogJsonLd />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('blog.postCount', {count: posts.length})}
          </h1>
          <div className="w-full sm:w-64">
            <SearchBar posts={posts} />
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>{t('home.noPosts')}</p>
          </div>
        ) : (
          <PostListWithToggle posts={posts} viewsMap={viewsMap} />
        )}
      </div>
    </>
  );
}
