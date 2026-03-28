import {Link} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import type {Metadata} from 'next';

export const metadata: Metadata = {
  title: '404',
};

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="max-w-2xl mx-auto px-4 py-32 text-center">
      <div className="text-6xl mb-6">🐝</div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('title')}</h1>
      <p className="text-lg text-gray-500 mb-8">{t('message')}</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-amber-400 text-white font-medium hover:bg-amber-500 transition-colors"
        >
          {t('goHome')}
        </Link>
        <Link
          href="/blog"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-gray-200 text-gray-700 font-medium hover:border-amber-400 hover:text-amber-600 transition-colors"
        >
          {t('viewAll')}
        </Link>
      </div>
    </div>
  );
}
