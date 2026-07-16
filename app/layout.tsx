import type {Metadata} from 'next';
import {Noto_Sans_KR} from 'next/font/google';
import {GoogleAnalytics} from '@next/third-parties/google';
import './globals.css';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

// 루트에서 metadataBase를 설정 → 모든 하위 라우트가 상속받아
// OG/트위터 이미지가 localhost:3000 대신 실제 도메인으로 해석된다.
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
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
        {children}
      </body>
      <GoogleAnalytics gaId="G-1YMK79BX3G" />
    </html>
  );
}
