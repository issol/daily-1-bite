import type {Metadata} from 'next';
import {Noto_Sans_KR} from 'next/font/google';
import {GoogleAnalytics} from '@next/third-parties/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {WebSiteJsonLd} from '@/components/JsonLd';
import {AUTHOR} from '@/lib/author';
import './globals.css';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

// 이전에는 app/[locale]/layout.tsx 의 generateMetadata 가 locale로 분기했다.
// 언어가 하나뿐이므로 정적 metadata 로 합쳤다.
export const metadata: Metadata = {
  // 루트에서 metadataBase를 설정 → 모든 하위 라우트가 상속받아
  // OG/트위터 이미지가 localhost:3000 대신 실제 도메인으로 해석된다.
  metadataBase: new URL(BASE_URL),
  title: {
    default: '매일 한입 | 1인 앱 개발일지',
    template: '%s | 매일 한입',
  },
  description:
    '혼자 iOS 앱 다섯 개(Joiny·DaySeed·Utakoto·Airout·Oftway)를 만들고 운영하는 개발자의 개발일지. 매일 한 앱, 한 가지 변경을 골라 왜 그렇게 했는지와 실제로 무엇이 바뀌었는지를 기록합니다.',
  keywords: [
    '개발일지', '1인 개발', '인디 개발자', 'iOS 앱 개발', 'React Native', 'Expo', 'Supabase',
    'App Store 심사', 'Claude Code', 'Joiny', 'DaySeed', 'Utakoto', 'Airout', 'Oftway', '매일 한입',
  ],
  authors: [{name: AUTHOR.name, url: `${BASE_URL}/about`}],
  creator: AUTHOR.name,
  publisher: '매일 한입',
  alternates: {
    canonical: BASE_URL,
    // hreflang은 내보내지 않는다. 언어가 하나뿐이면 대체 언어 버전이 존재하지 않고,
    // x-default 단독 선언은 아무 정보도 주지 않는다. (개정된 I2)
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
    title: '매일 한입 | 1인 앱 개발일지',
    description: '혼자 앱 다섯 개를 만들고 운영하는 개발자의 개발일지. 매일 한 앱, 한 가지 변경.',
    images: [{url: `${BASE_URL}/og-default.png`, width: 1200, height: 630, alt: '매일 한입'}],
  },
  twitter: {
    card: 'summary_large_image',
    title: '매일 한입 | 1인 앱 개발일지',
    description: '혼자 앱 다섯 개를 만들고 운영하는 개발자의 개발일지. 매일 한 앱, 한 가지 변경.',
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
    other: {'naver-site-verification': 'df304bda19da5080e0fc42e56de4dd425715f552'},
  },
};

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f59e0b" />
      </head>
      <body className={`${notoSansKR.className} bg-gray-50 text-gray-900 antialiased`}>
        <WebSiteJsonLd />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
      <GoogleAnalytics gaId="G-1YMK79BX3G" />
    </html>
  );
}
