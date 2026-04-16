import {Link} from '@/i18n/navigation';
import {getAllPosts, CATEGORIES} from '@/lib/posts';
import type {Locale} from '@/lib/posts';
import PostCard from '@/components/PostCard';
import {getPopularPosts} from '@/lib/analytics';
import {getTranslations, setRequestLocale} from 'next-intl/server';

export const revalidate = 3600;

interface Props {
  params: Promise<{locale: string}>;
}

export default async function HomePage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const allPosts = getAllPosts(locale as Locale);
  const recentPosts = allPosts.slice(0, 9);
  const popularPosts = await getPopularPosts(5);

  const enrichedPopular = popularPosts
    .map((p) => {
      const slug = p.path.replace(/^\/(ko|en)\/blog\//, '').replace(/^\/blog\//, '').replace(/\/$/, '');
      const post = allPosts.find((a) => a.slug === slug);
      return post ? {post, pageViews: p.pageViews} : null;
    })
    .filter(Boolean) as {post: (typeof allPosts)[0]; pageViews: number}[];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Hero */}
      <section className="mb-12 text-center py-10 bg-white rounded-3xl border border-amber-100 shadow-sm">
        <div className="text-5xl mb-4">🐝</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('home.siteName')}</h1>
        <p className="text-gray-500 text-base max-w-md mx-auto leading-relaxed">
          {t('home.tagline')}
          <br />
          {t('home.subTagline')}
        </p>
      </section>

      {/* Category chips */}
      <section className="mb-8 flex flex-wrap gap-2">
        {Object.entries(CATEGORIES).map(([key]) => (
          <Link
            key={key}
            href={`/category/${key}`}
            className="text-sm font-medium px-4 py-2 rounded-full border border-gray-200 hover:border-amber-400 hover:text-amber-600 transition-colors bg-white"
          >
            {t(`category.${key}`)}
          </Link>
        ))}
      </section>

      {/* Popular posts */}
      {enrichedPopular.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{t('home.popular')}</h2>
            <Link href="/stats" className="text-sm text-amber-500 hover:underline">
              {t('home.allStats')}
            </Link>
          </div>
          <ol className="space-y-2">
            {enrichedPopular.map((item, i) => (
              <li key={item.post.slug}>
                <Link
                  href={`/blog/${item.post.slug}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-amber-200 hover:shadow-sm transition-all group"
                >
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                      i < 3 ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-800 group-hover:text-amber-600 transition-colors leading-snug">
                    {item.post.title}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    👁️ {item.pageViews.toLocaleString()}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Recent posts */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{t('home.recent')}</h2>
          <Link href="/blog" className="text-sm text-amber-500 hover:underline">
            {t('home.viewAll')}
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>{t('home.noPosts')}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
