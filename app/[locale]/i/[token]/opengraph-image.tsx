import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'dayseed에서 함께 쓰기 초대';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: Promise<{ locale: string; token: string }>;
}

export default async function Image({ params }: Props) {
  const { locale } = await params;
  const isKo = locale === 'ko';
  const title = isKo ? '함께 쓰는 캘린더' : 'A calendar to share';
  const subtitle = isKo
    ? '연인·가족·친구와 일정을 같이 보세요'
    : 'Share days with the one closest to you';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f2efe8',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: '#2c2a26',
          }}
        />
        <div style={{ fontSize: 96, marginBottom: 12 }}>🌱</div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#2c2a26',
            marginBottom: 18,
            letterSpacing: -1.5,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#6b6760',
            marginBottom: 12,
            padding: '0 80px',
            textAlign: 'center',
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            fontSize: 22,
            color: '#6b6760',
          }}
        >
          <span style={{ fontWeight: 600, color: '#2c2a26' }}>dayseed</span>
          <span style={{ opacity: 0.6 }}>·</span>
          <span>daily1bite.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
