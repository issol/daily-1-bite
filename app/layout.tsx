import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://daily-1-bite.com'),
  title: {
    default: '매일 한입 | AI 뉴스 요약 블로그',
    template: '%s | 매일 한입',
  },
  description: '매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다. AI 트렌드, 도구 리뷰, 튜토리얼을 한입 크기로 전달합니다.',
  keywords: ['AI', 'AI 뉴스', '인공지능', 'ChatGPT', 'LLM', 'AI 도구', 'AI 트렌드'],
  authors: [{ name: 'A꿀벌I' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '매일 한입',
    title: '매일 한입 | AI 뉴스 요약 블로그',
    description: '매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다.',
  },
  twitter: {
    card: 'summary_large_image',
    title: '매일 한입 | AI 뉴스 요약 블로그',
    description: '매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.className} bg-gray-50 text-gray-900 antialiased`}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
