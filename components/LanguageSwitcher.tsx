'use client';

import {useLocale, useTranslations} from 'next-intl';
import {usePathname, useRouter} from '@/i18n/navigation';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('language');

  const switchLocale = () => {
    const nextLocale = locale === 'ko' ? 'en' : 'ko';
    router.replace(pathname, {locale: nextLocale});
  };

  return (
    <button
      onClick={switchLocale}
      className="text-sm text-gray-500 hover:text-amber-500 transition-colors flex items-center gap-1"
      aria-label={`Switch to ${t('switchTo')}`}
    >
      🌐 {t('switchTo')}
    </button>
  );
}
