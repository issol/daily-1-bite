import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
  localePrefix: 'always',

  // next-intl이 자동으로 붙이던 `Link:` hreflang 응답 헤더를 끈다.
  //
  // 기본값(true)일 때 모든 페이지에 아래 3개가 붙었는데, 2개가 잘못된 대상을 가리켰다:
  //   <.../en/blog/x>; hreflang="en"        → 308 redirect(→KO) 또는 noindex
  //   <.../blog/x>;    hreflang="x-default" → 301 redirect(→/ko), 4월 이전 레거시 URL
  // hreflang은 색인 가능하고 상호 참조되는 URL만 가리켜야 하며, 리디렉트/noindex 대상이
  // 섞이면 Google이 클러스터 전체를 무시한다. 특히 x-default가 prefix 없는 레거시 URL을
  // 가리키는 바람에 "기본 버전은 prefix 없는 URL"이라고 매 페이지가 선언하고 있었다.
  // hreflang은 각 page의 metadata.alternates(HTML <link>)와 sitemap이 담당한다.
  alternateLinks: false,

  // Accept-Language / NEXT_LOCALE 쿠키 기반 자동 로케일 감지를 끈다.
  //
  // 켜져 있으면 `/`가 클라이언트 언어에 따라 다른 곳으로 간다:
  //   Accept-Language: ko → /ko (색인 대상)
  //   Accept-Language: en → /en (noindex!)
  // 즉 영어권 크롤/클라이언트에게 루트 도메인이 noindex 페이지로 해석됐다.
  // Google도 언어 자동 리디렉션을 권장하지 않는다(모든 버전 크롤을 막을 수 있음).
  // 언어 전환은 LanguageSwitcher의 명시적 사용자 액션으로만 일어나야 한다.
  localeDetection: false
});
