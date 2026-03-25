// JSON-LD 구조화 데이터 컴포넌트
// SEO + GEO (Generative Engine Optimization) 모두 커버

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily-1-bite.com';

export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '매일 한입',
    alternateName: 'daily-1-bite',
    url: BASE_URL,
    description: '매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다. AI 트렌드, 도구 리뷰, 튜토리얼을 한입 크기로 전달합니다.',
    inLanguage: 'ko-KR',
    publisher: {
      '@type': 'Person',
      name: 'A꿀벌I',
      url: `${BASE_URL}/about`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/blog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BlogJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: '매일 한입',
    url: `${BASE_URL}/blog`,
    description: '매일 쏟아지는 AI 뉴스를 보기 쉽게 요약합니다. AI 트렌드, 도구 리뷰, 개발 인사이트를 다룹니다.',
    inLanguage: 'ko-KR',
    author: {
      '@type': 'Person',
      name: 'A꿀벌I',
      url: `${BASE_URL}/about`,
      knowsAbout: ['인공지능', 'AI 도구', 'LLM', 'ChatGPT', '생성형 AI'],
    },
    publisher: {
      '@type': 'Organization',
      name: '매일 한입',
      url: BASE_URL,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ArticleJsonLdProps {
  title: string;
  description: string;
  date: string;
  slug: string;
  category: string;
  tags: string[];
  thumbnail?: string;
}

export function ArticleJsonLd({
  title,
  description,
  date,
  slug,
  category,
  tags,
  thumbnail,
}: ArticleJsonLdProps) {
  const url = `${BASE_URL}/blog/${slug}`;
  const imageUrl = thumbnail || `${BASE_URL}/og-default.png`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    datePublished: date,
    dateModified: date,
    inLanguage: 'ko-KR',
    image: {
      '@type': 'ImageObject',
      url: imageUrl,
      width: 1200,
      height: 630,
    },
    author: {
      '@type': 'Person',
      name: 'A꿀벌I',
      url: `${BASE_URL}/about`,
      knowsAbout: ['인공지능', 'AI 도구', 'LLM', 'ChatGPT', '생성형 AI', 'SEO'],
    },
    publisher: {
      '@type': 'Organization',
      name: '매일 한입',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/favicon.ico`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: category,
    keywords: tags.join(', '),
    // GEO: speakable 섹션 - AI 어시스턴트가 읽기 좋은 요약 위치 지정
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.post-description', 'article h2', 'article p:first-of-type'],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: { name: string; url: string }[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FAQJsonLdProps {
  faqs: { question: string; answer: string }[];
}

// GEO: FAQ 스키마 - AI 검색 엔진의 직접 답변(featured snippet) 최적화
export function FAQJsonLd({ faqs }: FAQJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface PersonJsonLdProps {
  name: string;
  url: string;
  description: string;
}

// GEO: 저자 신뢰도 (E-E-A-T) 강화
export function PersonJsonLd({ name, url, description }: PersonJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url,
    description,
    sameAs: [],
    knowsAbout: [
      '인공지능 (Artificial Intelligence)',
      '대형 언어 모델 (LLM)',
      'ChatGPT',
      'Claude',
      'Gemini',
      'AI 도구 활용',
      '생성형 AI',
      '검색엔진 최적화 (SEO)',
      'Next.js',
    ],
    jobTitle: 'AI 뉴스 큐레이터 & 블로거',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
