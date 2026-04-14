import {Noto_Sans_KR} from 'next/font/google';
import {GoogleAnalytics} from '@next/third-parties/google';
import './globals.css';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f59e0b" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8050736558065382"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${notoSansKR.className} bg-gray-50 text-gray-900 antialiased`}>
        {children}
      </body>
      <GoogleAnalytics gaId="G-1YMK79BX3G" />
    </html>
  );
}
