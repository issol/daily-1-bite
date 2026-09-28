import { ImageResponse } from 'next/og';

import { cityNames, fetchInvitePreview, loadGoogleFont, tripRange } from '@/lib/joiny';

export const runtime = 'edge';
export const alt = 'Joiny 여행 초대';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Joiny 우표 브랜드(앱 DESIGN.md): 바다색 탑승권 + 금잔화 우표. 지도 이미지는 쓰지 않는다(invite Q107).
const INK = '#1D2B30';
const PAPER = '#FFF4E0';
const TICKET = '#0E4A5A';
const MARIGOLD = '#F2A007';

/**
 * 링크 미리보기 이미지. 카카오톡 등은 주소마다 캐시하므로 바뀌는 값(참여 인원)은 넣지 않는다.
 * 기본 글꼴에는 한글이 없어 구글 폰트(주아·Noto Sans KR)에서 쓰는 글자만 받아 넣는다.
 */
export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const preview = await fetchInvitePreview(token, null);
  const ok = preview && preview !== 'error';
  const title = ok ? preview.title : 'Joiny 여행 초대';
  const when = ok ? tripRange(preview.start_date, preview.end_date).split(' · ')[0] : '';
  const where = ok ? cityNames(preview) : '';
  const lead = '함께 여행 일정을 짜요';

  const [jua, noto] = await Promise.all([
    loadGoogleFont('Jua', 400, `${title}Joiny`),
    loadGoogleFont('Noto Sans KR', 700, `${when}${where}${lead}·–()`),
  ]);
  const fonts = [
    ...(jua ? [{ name: 'Jua', data: jua, weight: 400 as const, style: 'normal' as const }] : []),
    ...(noto ? [{ name: 'Noto Sans KR', data: noto, weight: 700 as const, style: 'normal' as const }] : []),
  ];

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PAPER }}>
        <div
          style={{
            width: 1040,
            height: 470,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: TICKET,
            borderRadius: 36,
            padding: '56px 64px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', fontFamily: 'Noto Sans KR', fontSize: 30, color: MARIGOLD }}>{lead}</div>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 12,
                background: MARIGOLD,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(-8deg)',
                fontFamily: 'Jua',
                fontSize: 64,
                color: TICKET,
              }}
            >
              J
            </div>
          </div>
          <div style={{ display: 'flex', fontFamily: 'Jua', fontSize: title.length > 12 ? 76 : 92, color: PAPER, lineHeight: 1.1 }}>{title}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', height: 0, borderTop: `3px dashed rgba(255,244,224,0.4)` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Noto Sans KR', fontSize: 30, color: PAPER }}>
              <span>{when}</span>
              <span>{where}</span>
            </div>
          </div>
          <div style={{ position: 'absolute', left: -24, top: 300, width: 48, height: 48, borderRadius: 24, background: PAPER }} />
          <div style={{ position: 'absolute', right: -24, top: 300, width: 48, height: 48, borderRadius: 24, background: PAPER }} />
        </div>
        <div style={{ position: 'absolute', bottom: 22, display: 'flex', fontFamily: 'Jua', fontSize: 28, color: INK }}>Joiny</div>
      </div>
    ),
    { ...size, fonts },
  );
}
