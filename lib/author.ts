// 저자 정체성 단일 소스(single source of truth).
//
// E-E-A-T: 이름·프로필(sameAs)·전문 분야를 한 곳에서 관리한다.
// JsonLd 스키마, About 페이지, 포스트 byline이 모두 여기서 읽으므로
// 정체성을 바꿀 때 이 파일만 수정하면 사이트 전체에 반영된다.
//
// ⚠️ 2026-04 색인 붕괴 회복 방침: "검증 가능한 인간 저자"로 전환하기로 결정됨.
//    Google이 저자를 실존 신뢰 엔티티로 인식해야 helpful-content 강등에서 회복된다.
//    → 아래 TODO 두 곳을 채우는 것이 최우선.

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

export const AUTHOR = {
  // 일관 유지 필명. 'A꿀벌I'(발음상 'AI' 연상 → AI-강등 사이트에 역신호)에서
  // GitHub 핸들과 동일한 'issol'로 확정 — sameAs의 github.com/issol와 엔티티 일치.
  name: 'issol',

  url: `${BASE_URL}/about`,
  email: 'isolatorv@gmail.com',
  jobTitle: '1인 앱 개발자',
  description:
    '혼자 iOS 앱 다섯 개(Joiny·DaySeed·Utakoto·Airout·Oftway)를 만들고 운영합니다. 이 블로그에는 그 앱들의 개발일지를 씁니다.',

  // 검증 가능한 실존 인물 신호(sameAs). Google이 저자를 실제 웹 엔티티와 연결한다.
  //   프로필을 추가할수록(LinkedIn/X 등) 신뢰 신호가 강해진다.
  sameAs: ['https://github.com/issol'] as string[],

  knowsAbout: [
    'iOS 앱 개발',
    'React Native',
    'Expo',
    'Swift',
    'Supabase',
    'App Store 심사',
    'Claude Code',
    '1인 개발',
    'Next.js',
  ],
} as const;
