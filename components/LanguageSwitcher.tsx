'use client';

import {useLocale, useTranslations} from 'next-intl';
import {usePathname, useRouter} from '@/i18n/navigation';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('language');

  // 블로그 글 상세에서는 언어 전환을 노출하지 않는다.
  // EN 글 URL(/en/blog/...)은 KO 버전이 있으면 서버에서 308로 KO에 되돌리므로,
  // 여기서 "English"를 눌러도 같은 한국어 페이지로 튕겨 돌아오는 루프가 된다.
  // 목록/소개 등 EN이 실제로 렌더되는 경로에서만 버튼을 보여준다.
  const isPostDetail = /^\/blog\/.+/.test(pathname);
  if (isPostDetail) return null;

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
