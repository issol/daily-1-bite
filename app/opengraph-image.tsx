import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '매일 한입 - AI 뉴스 요약 블로그';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
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
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: '#f59e0b' }} />
        <div style={{ fontSize: 80, marginBottom: 16 }}>🐝</div>
        <div style={{ fontSize: 56, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>
          매일 한입
        </div>
        <div style={{ fontSize: 28, color: '#6b7280', marginBottom: 12 }}>
          매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다
        </div>
        <div style={{ fontSize: 22, color: '#9ca3af' }}>
          AI 트렌드 · 도구 리뷰 · 튜토리얼
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 20,
            color: '#d97706',
          }}
        >
          daily1bite.com
        </div>
      </div>
    ),
    { ...size },
  );
}
