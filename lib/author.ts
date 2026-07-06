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
  // TODO(identity): 실명 또는 일관되게 유지할 필명으로 확정할 것.
  //   현재 'A꿀벌I'는 발음상 'AI'를 연상시켜, AI 콘텐츠로 강등된 사이트에는 불리한 신호.
  name: 'A꿀벌I',

  url: `${BASE_URL}/ko/about`,
  email: 'isolatorv@gmail.com',
  jobTitle: 'AI 뉴스 큐레이터 & 개발자',
  description:
    '현직 개발자로서 AI 도구를 실무에서 매일 사용하며, 개발자 관점에서 AI 뉴스와 도구를 솔직하게 정리합니다.',

  // 검증 가능한 실존 인물 신호(sameAs). Google이 저자를 실제 웹 엔티티와 연결한다.
  //   프로필을 추가할수록(LinkedIn/X 등) 신뢰 신호가 강해진다.
  sameAs: ['https://github.com/issol'] as string[],

  knowsAbout: [
    '인공지능',
    'AI 도구',
    'LLM',
    'ChatGPT',
    'Claude',
    'Gemini',
    '생성형 AI',
    '검색엔진 최적화 (SEO)',
    'Next.js',
  ],
} as const;
