import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {WebSiteJsonLd} from '@/components/JsonLd';
import {AUTHOR} from '@/lib/author';
import type {Metadata} from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const isKo = locale === 'ko';

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: isKo ? '매일 한입 | AI 뉴스 요약 블로그' : 'Daily 1 Bite | AI News Digest',
      template: isKo ? '%s | 매일 한입' : '%s | Daily 1 Bite',
    },
    description: isKo
      ? '매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다. ChatGPT, Claude, Gemini 등 최신 AI 트렌드와 도구 리뷰, 활용 튜토리얼을 한입 크기로 전달합니다.'
      : 'Daily AI news digests in bite-sized format. Latest trends, tool reviews, and tutorials covering ChatGPT, Claude, Gemini and more.',
    keywords: isKo
      ? ['AI 뉴스', '인공지능', 'ChatGPT', 'Claude', 'Gemini', 'LLM', '생성형 AI', 'AI 도구', 'AI 트렌드', 'AI 튜토리얼', 'AI 리뷰', '매일 한입']
      : ['AI news', 'artificial intelligence', 'ChatGPT', 'Claude', 'Gemini', 'LLM', 'generative AI', 'AI tools', 'AI trends', 'AI tutorials'],
    authors: [{name: AUTHOR.name, url: `${BASE_URL}/about`}],
    creator: AUTHOR.name,
    publisher: isKo ? '매일 한입' : 'Daily 1 Bite',
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        'ko': `${BASE_URL}/ko`,
        'en': `${BASE_URL}/en`,
        'x-default': `${BASE_URL}/ko`,
      },
      types: {
        'application/rss+xml': `${BASE_URL}/feed.xml`,
        'application/atom+xml': `${BASE_URL}/atom.xml`,
      },
    },
    openGraph: {
      type: 'website',
      locale: isKo ? 'ko_KR' : 'en_US',
      alternateLocale: isKo ? 'en_US' : 'ko_KR',
      url: `${BASE_URL}/${locale}`,
      siteName: isKo ? '매일 한입' : 'Daily 1 Bite',
      title: isKo ? '매일 한입 | AI 뉴스 요약 블로그' : 'Daily 1 Bite | AI News Digest',
      description: isKo
        ? '매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다.'
        : 'Daily AI news digests in bite-sized format.',
      images: [{url: `${BASE_URL}/og-default.png`, width: 1200, height: 630, alt: isKo ? '매일 한입' : 'Daily 1 Bite'}],
    },
    twitter: {
      card: 'summary_large_image',
      title: isKo ? '매일 한입 | AI 뉴스 요약 블로그' : 'Daily 1 Bite | AI News Digest',
      description: isKo ? '매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다.' : 'Daily AI news digests in bite-sized format.',
      images: [`${BASE_URL}/og-default.png`],
      creator: '@daily1bite',
    },
    // EN 섹션 전체 noindex — KO 통합 전략에 맞춰 영어 정적/목록 페이지(/en, /en/blog,
    // /en/about, /en/contact, /en/privacy-policy 등)를 색인에서 제외한다.
    // 저품질 영어 번역 중복 표면을 없애 사이트 평균 품질을 올린다. robots 미설정 하위
    // 페이지는 이 값을 상속하므로, 여기서 locale로 분기하면 EN 섹션이 통째로 noindex된다.
    // (EN 블로그 글은 이미 page.tsx에서 KO로 308 redirect + noindex 처리됨.)
    robots: isKo
      ? {
          index: true,
          follow: true,
          googleBot: {index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1},
        }
      : {index: false, follow: true},
    verification: {
      other: {'naver-site-verification': 'df304bda19da5080e0fc42e56de4dd425715f552'},
    },
  };
}

export default async function LocaleLayout({children, params}: Props) {
  const {locale} = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <WebSiteJsonLd />
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </NextIntlClientProvider>
  );
}
