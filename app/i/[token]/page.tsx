import type { Metadata } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface Props {
  params: Promise<{ token: string }>;
}

/**
 * 초대 링크는 한국어 사용자만 받는 게 아니다. 이전에는 URL의 locale 세그먼트가
 * 언어를 정했지만(/ko/i/... vs /en/i/...), i18n 제거로 그 세그먼트가 사라졌다.
 * 이 페이지는 force-dynamic이고 색인 대상도 아니므로 Accept-Language로 고른다.
 *
 * 블로그 쪽에서 자동 로케일 감지를 끈 것(구 I3)은 크롤러가 색인 대상 URL에서
 * 다른 곳으로 튕기는 문제였다. 색인되지 않는 이 페이지의 문구 선택과는 무관하다.
 */
async function preferKorean(): Promise<boolean> {
  const accept = (await headers()).get('accept-language') ?? '';
  return !accept || /\bko\b/i.test(accept);
}

export async function generateMetadata(): Promise<Metadata> {
  const isKo = await preferKorean();
  const title = isKo ? 'dayseed — 함께 쓰는 캘린더 초대' : 'dayseed — A shared calendar invite';
  const description = isKo
    ? '연인·가족·친구와 일정을 같이 보세요. dayseed를 설치하면 자동으로 이어집니다.'
    : 'Share calendars with the one closest to you. Install dayseed to continue.';
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'dayseed',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

/**
 * dayseed v1.3 invite-link fallback page.
 *
 * On iOS with the dayseed app installed, Apple's Universal Links
 * intercept the URL `https://daily1bite.com/i/<token>` *before*
 * Next.js gets a chance to render anything — the user lands directly
 * in app/i/[token].tsx inside dayseed. This page is the fallback for:
 *   - dayseed not installed (offer App Store)
 *   - opened in a context where Universal Links don't apply (older
 *     iOS, in-app browsers that strip the deep link, etc.)
 *
 * Pure server-rendered HTML + an inline script that tries the
 * dayseed:// custom scheme once and falls back to the App Store
 * after a short timeout. Custom scheme attempt is a no-op when the
 * app isn't installed.
 */
export default async function InviteFallback({ params }: Props) {
  const { token } = await params;

  const isKo = await preferKorean();
  const safeToken = encodeURIComponent(token);
  const appUrl = `dayseed:///i/${safeToken}`;
  const appStoreUrl = 'https://apps.apple.com/app/id6764353269';

  // Inline script as a JSON-encoded string. We embed `safeToken` and
  // `appStoreUrl` via JSON.stringify so any unexpected characters can't
  // break out of the string literal.
  const script = `
    (function () {
      var appUrl = ${JSON.stringify(appUrl)};
      var storeUrl = ${JSON.stringify(appStoreUrl)};
      var btn = document.getElementById('open-app');
      if (!btn) return;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = appUrl;
        setTimeout(function () { window.location.href = storeUrl; }, 1200);
      });
    })();
  `;

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#f2efe8',
        fontFamily:
          '-apple-system, "Pretendard", BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: '#ffffff',
          borderRadius: 20,
          padding: '32px 24px',
          boxShadow: '0 2px 16px rgba(40, 30, 20, 0.05)',
          textAlign: 'center',
          color: '#2c2a26',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: '12px 0 8px' }}>
          {isKo
            ? 'dayseed에서 함께 쓰기 초대'
            : 'A dayseed sharing invite'}
        </h1>
        <p
          style={{
            color: '#6b6760',
            fontSize: 14,
            lineHeight: 1.5,
            margin: '0 0 20px',
          }}
        >
          {isKo
            ? '이 링크를 받았다면 누군가가 일정을 함께 보자고 청한 거예요. dayseed를 설치하면 자동으로 이어집니다.'
            : 'Someone invited you to share calendars on dayseed. Install the app to continue.'}
        </p>
        <a
          id="open-app"
          href={appUrl}
          style={{
            display: 'inline-block',
            background: '#2c2a26',
            color: '#ffffff',
            textDecoration: 'none',
            fontSize: 15,
            fontWeight: 500,
            padding: '14px 24px',
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          {isKo ? '앱에서 열기' : 'Open in app'}
        </a>
        <br />
        <a
          href={appStoreUrl}
          style={{
            display: 'inline-block',
            color: '#6b6760',
            fontSize: 13,
            textDecoration: 'none',
            padding: 8,
          }}
        >
          {isKo ? 'App Store에서 받기' : 'Get from the App Store'}
        </a>
        <div
          style={{
            marginTop: 24,
            fontSize: 11,
            color: '#6b6760',
            opacity: 0.7,
          }}
        >
          dayseed
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </main>
  );
}
