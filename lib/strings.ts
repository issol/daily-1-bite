/**
 * UI 문자열.
 *
 * 이전에는 next-intl + messages/{ko,en}.json 이었다. EN에 고유 콘텐츠가 0편이었고
 * EN 섹션 전체가 noindex여서 색인 대상에 애초에 없었으므로, 다국어 기계를 걷어내고
 * 단일 언어 상수로 바꿨다. 자세한 경위는
 * docs/superpowers/specs/2026-08-03-vercel-migration-design.md 참조.
 *
 * 카테고리 라벨은 여기 두지 않는다 — lib/categories.ts 의 CATEGORIES 가 단일 출처다.
 * (messages/ko.json 의 category.* 는 그것과 글자 단위로 같은 중복이었다.)
 */

export const S = {
  nav: {
    home: '홈',
    blog: '블로그',
    about: '소개',
    contact: '문의',
    stats: '통계',
    privacy: '개인정보처리방침',
  },
  home: {
    siteName: '매일 한입',
    tagline: '매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다.',
    subTagline: '한입 크기로 읽는 AI 트렌드, 도구 리뷰, 튜토리얼.',
    popular: '🔥 인기 글',
    allStats: '전체 통계 →',
    recent: '최근 글',
    viewAll: '전체 보기 →',
    noPosts: '아직 게시된 글이 없습니다.',
  },
  post: {
    relatedPosts: '관련 글 추천',
    backHome: '홈으로',
    tags: '태그',
    readingTime: (minutes: number) => `${minutes}분 읽기`,
    views: (count: number) => `${count}회`,
    backToCategory: (category: string) => `← ${category} 글 더 보기`,
  },
  blog: {
    allPosts: '전체 글',
    description: '매일 한입 블로그의 모든 글을 확인하세요.',
    search: '검색...',
    postCount: (count: number) => `전체 글 (${count})`,
  },
  footer: {
    siteName: '매일 한입',
    tagline: '매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다',
    copyright: (year: number) => `© ${year} 매일 한입. All rights reserved.`,
  },
  notFound: {
    title: '404',
    message: '앗, 이 페이지는 존재하지 않거나 이동되었어요.',
    goHome: '홈으로 돌아가기',
    viewAll: '전체 글 보기',
  },
} as const;
