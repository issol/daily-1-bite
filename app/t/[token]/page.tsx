import type { Metadata } from 'next';
import { headers } from 'next/headers';

import {
  cityNames,
  cleanFrom,
  fetchInvitePreview,
  inviteHeadline,
  joinyInstall,
  tripRange,
  type JoinyInvitePreview,
} from '@/lib/joiny';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ from?: string }>;
}

// Joiny 우표 브랜드 색(앱 DESIGN.md)
const C = {
  ground: '#FFF4E0',
  surface: '#FFFCF5',
  field: '#F5E9D2',
  ink: '#1D2B30',
  mid: '#4F5D63',
  low: '#5C686E',
  accent: '#0E4A5A',
  onAccent: '#FFF4E0',
  highlight: '#F2A007',
  stamp: '#C7385F',
};

/**
 * 초대 페이지는 색인 대상이 아니다(블로그 글이 아니다, docs/SEO-INVARIANTS.md I1).
 * sitemap에도 없고, noindex로 둔다. 링크 미리보기(카카오톡 등)용 og 태그만 둔다.
 * 참여 인원처럼 바뀌는 값은 넣지 않는다(카카오가 주소마다 미리보기를 캐시한다).
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { token } = await params;
  const { from } = await searchParams;
  const preview = await fetchInvitePreview(token, cleanFrom(from));
  const ok = preview && preview !== 'error';
  const title = ok ? inviteHeadline(preview) : 'Joiny 여행 초대';
  const description = ok
    ? `${tripRange(preview.start_date, preview.end_date).split(' · ')[0]} · ${cityNames(preview)} · Joiny에서 함께 일정을 짜요`
    : 'Joiny에서 함께 여행 일정을 짜요';
  return {
    // 블로그 제목 꼬리("| 매일 한입")를 붙이지 않는다. 링크 미리보기에 그대로 보인다.
    title: { absolute: title },
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: 'website', siteName: 'Joiny' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        background: C.surface,
        border: `1.5px solid ${C.ink}`,
        borderRadius: 16,
        padding: '24px 20px',
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  );
}

function Preview({ p }: { p: JoinyInvitePreview }) {
  const shown = p.members.slice(0, 5).join(', ');
  const more = p.member_count - Math.min(p.members.length, 5);
  return (
    <Card>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 10px', color: C.ink }}>{p.title}</h1>
      <p style={{ margin: '0 0 4px', fontSize: 14, color: C.mid }}>{tripRange(p.start_date, p.end_date)}</p>
      <p style={{ margin: '0 0 16px', fontSize: 14, color: C.mid }}>{cityNames(p)}</p>
      <div style={{ background: C.field, borderRadius: 12, padding: '10px 12px', fontSize: 13, color: C.ink }}>
        <div>{more > 0 ? `${shown} 외 ${more}명이 함께해요` : `${shown} 함께해요`}</div>
        <div style={{ color: C.mid, marginTop: 2 }}>
          일정 {p.item_count}개 · 보관함 {p.stash_count}개
        </div>
      </div>
    </Card>
  );
}

/**
 * Joiny 초대 링크의 웹 페이지(ADR-0009).
 * - iOS에 앱이 있으면 Universal Links가 이 주소를 가로채 앱의 /t/[token]이 바로 열린다.
 * - 카카오톡 같은 앱 안 브라우저는 Universal Links를 쓰지 않아 이 페이지가 열린다.
 *   "Joiny 앱에서 열기"가 joiny:// 로 앱을 열고, 없으면 스토어로 보낸다.
 * - 앱이 없으면 설치 뒤 이어간다: Android는 스토어 링크의 referrer로, iOS는 링크를 다시 눌러서.
 *   iOS는 App Store로 보낸다(2026-10-07 출시). Android는 Play 출시 전까지 "준비 중"을 보여준다.
 */
export default async function JoinyInvite({ params, searchParams }: Props) {
  const { token } = await params;
  const { from: rawFrom } = await searchParams;
  const from = cleanFrom(rawFrom);
  const preview = await fetchInvitePreview(token, from);
  const ua = (await headers()).get('user-agent') ?? '';
  const isAndroid = /android/i.test(ua);

  const appUrl = `joiny://t/${encodeURIComponent(token)}${from ? `?from=${encodeURIComponent(from)}` : ''}`;
  const install = joinyInstall(isAndroid, token, from);
  const storeUrl = install?.url ?? null;
  const script = `
    (function () {
      var appUrl = ${JSON.stringify(appUrl)};
      var storeUrl = ${JSON.stringify(storeUrl)};
      var btn = document.getElementById('open-app');
      if (!btn) return;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = appUrl;
        if (storeUrl) setTimeout(function () { window.location.href = storeUrl; }, 1200);
      });
    })();
  `;

  const valid = preview && preview !== 'error';

  return (
    // 블로그 레이아웃(머리글)을 그대로 두고 초대 화면으로 덮는다. 루트 레이아웃은 SEO 불변식 대상이라 건드리지 않는다.
    <main
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        overflowY: 'auto',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: C.ground,
        color: C.ink,
        fontFamily: '-apple-system, "Pretendard", BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div
          aria-hidden
          style={{
            width: 64,
            height: 64,
            borderRadius: 8,
            background: C.highlight,
            transform: 'rotate(-6deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            fontWeight: 800,
            color: C.accent,
          }}
        >
          J
        </div>

        {preview === 'error' ? (
          <Card>
            <p style={{ margin: 0, fontSize: 15 }}>초대를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>
          </Card>
        ) : !preview ? (
          <Card>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>더 이상 쓸 수 없는 초대 링크예요</h1>
            <p style={{ margin: 0, fontSize: 14, color: C.mid }}>보낸 사람에게 새 링크를 부탁해 주세요.</p>
          </Card>
        ) : (
          <>
            <p style={{ margin: 0, fontSize: 14, color: C.mid }}>
              {preview.inviter ? `${preview.inviter} 님이 초대했어요` : '여행에 초대받았어요'}
            </p>
            <Preview p={preview} />
            {preview.full && (
              <p style={{ margin: 0, fontSize: 14, color: C.stamp }}>함께하는 사람이 20명이라 더 참여할 수 없어요.</p>
            )}
          </>
        )}

        {valid && !preview.full && (
          <>
            <a
              id="open-app"
              href={appUrl}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                background: C.accent,
                color: C.onAccent,
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: 700,
                padding: '14px 24px',
                borderRadius: 999,
              }}
            >
              Joiny 앱에서 열기
            </a>
            {install ? (
              <>
                <a
                  href={install.url}
                  style={{
                    display: 'block',
                    width: '100%',
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    background: C.surface,
                    color: C.ink,
                    border: `2px solid ${C.ink}`,
                    textDecoration: 'none',
                    fontSize: 15,
                    fontWeight: 700,
                    padding: '12px 24px',
                    borderRadius: 999,
                  }}
                >
                  {install.label}
                </a>
                <p style={{ margin: 0, fontSize: 13, color: C.low, textAlign: 'center' }}>{install.hint}</p>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: C.low, textAlign: 'center' }}>
                {isAndroid ? 'Android 앱은 준비 중이에요. 곧 Google Play에서 만날 수 있어요.' : 'Joiny는 곧 App Store·Google Play에서 만날 수 있어요.'}
              </p>
            )}
          </>
        )}

        <div style={{ marginTop: 8, fontSize: 12, color: C.low }}>Joiny · 함께 짜고, 같이 다니는 여행</div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </main>
  );
}
