import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { WebSiteJsonLd } from '@/components/JsonLd';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: '매일 한입 | AI 뉴스 요약 블로그',
    template: '%s | 매일 한입',
  },
  description:
    '매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다. ChatGPT, Claude, Gemini 등 최신 AI 트렌드와 도구 리뷰, 활용 튜토리얼을 한입 크기로 전달합니다.',
  keywords: [
    'AI 뉴스', '인공지능', 'ChatGPT', 'Claude', 'Gemini', 'LLM', '생성형 AI',
    'AI 도구', 'AI 트렌드', 'AI 튜토리얼', 'AI 리뷰', '매일 한입',
  ],
  authors: [{ name: 'A꿀벌I', url: `${BASE_URL}/about` }],
  creator: 'A꿀벌I',
  publisher: '매일 한입',
  // Canonical은 각 페이지에서 override
  alternates: {
    canonical: BASE_URL,
    types: {
      'application/rss+xml': `${BASE_URL}/feed.xml`,
      'application/atom+xml': `${BASE_URL}/atom.xml`,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: BASE_URL,
    siteName: '매일 한입',
    title: '매일 한입 | AI 뉴스 요약 블로그',
    description:
      '매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다. AI 트렌드, 도구 리뷰, 튜토리얼을 한입 크기로 전달합니다.',
    images: [
      {
        url: `${BASE_URL}/og-default.png`,
        width: 1200,
        height: 630,
        alt: '매일 한입 - AI 뉴스 요약 블로그',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '매일 한입 | AI 뉴스 요약 블로그',
    description: '매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다.',
    images: [`${BASE_URL}/og-default.png`],
    creator: '@daily1bite',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Google Search Console 소유권 확인 시 여기에 추가
    // google: 'VERIFICATION_TOKEN',
    // Naver Search Advisor 소유권 확인 시 여기에 추가
    // other: { 'naver-site-verification': 'NAVER_VERIFICATION_TOKEN' },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <WebSiteJsonLd />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f59e0b" />
      </head>
      <body className={`${notoSansKR.className} bg-gray-50 text-gray-900 antialiased`}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
      <GoogleAnalytics gaId="G-1YMK79BX3G" />
    </html>
  );
}
