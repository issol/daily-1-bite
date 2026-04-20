import type { Metadata } from 'next';
import { PersonJsonLd } from '@/components/JsonLd';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: '소개',
    description:
      '매일 한입을 운영하는 A꿀벌I를 소개합니다. AI 뉴스 큐레이터로서 매일 쏟아지는 인공지능 트렌드를 쉽게 정리합니다.',
    alternates: {
      canonical: `${BASE_URL}/${locale}/about`,
    },
    openGraph: {
      title: 'A꿀벌I 소개 | 매일 한입',
      description: 'AI 뉴스 큐레이터 A꿀벌I가 운영하는 매일 한입 블로그를 소개합니다.',
      url: `${BASE_URL}/${locale}/about`,
    },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  return (
    <>
      <PersonJsonLd
        name="A꿀벌I"
        url={`${BASE_URL}/${locale}/about`}
        description="매일 쏟아지는 AI 뉴스를 보기 쉽게 요약하는 AI 뉴스 큐레이터. ChatGPT, Claude, Gemini 등 최신 AI 트렌드와 도구를 리뷰합니다."
      />

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4" role="img" aria-label="꿀벌 이모지">🐝</div>
          <h1 className="text-3xl font-bold text-gray-900">매일 한입</h1>
          <p className="text-gray-500 mt-2">AI 뉴스 요약 블로그</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-8 text-gray-700 leading-relaxed">
          <section aria-labelledby="about-blog">
            <h2 id="about-blog" className="text-xl font-bold text-gray-900 mb-3">블로그 소개</h2>
            <p>
              매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드리는 블로그입니다.
              ChatGPT, Claude, Gemini 등 주요 AI 모델의 업데이트부터
              스타트업 동향, 실용적인 AI 도구까지 복잡한 기술 이야기를
              한입 크기로 정리해, 바쁜 일상에서도 AI 트렌드를 놓치지 않도록 돕습니다.
            </p>
          </section>

          <section aria-labelledby="topics">
            <h2 id="topics" className="text-xl font-bold text-gray-900 mb-3">다루는 주제</h2>
            <ul className="space-y-3">
              <li>🤖 <strong>AI 뉴스</strong> — OpenAI, Anthropic, Google 등 주요 AI 기업의 최신 발표와 동향</li>
              <li>🛠️ <strong>AI Tools &amp; Review</strong> — 직접 써본 AI 생산성 도구 솔직 리뷰</li>
              <li>📚 <strong>AI Tutorial &amp; How-to</strong> — 누구나 따라할 수 있는 AI 도구 활용 가이드</li>
              <li>💭 <strong>Dev Life &amp; Opinion</strong> — AI 시대를 살아가는 개발자의 생각과 인사이트</li>
              <li>🔍 <strong>SEO</strong> — AI 검색 시대의 검색 최적화 전략과 노하우</li>
            </ul>
          </section>

          <section aria-labelledby="author">
            <h2 id="author" className="text-xl font-bold text-gray-900 mb-3">운영자</h2>
            <p>
              <strong>A꿀벌I</strong> — AI와 함께 일하는 것을 즐기는 개발자이자 AI 뉴스 큐레이터.
              매일 AI 뉴스를 읽으며 독자들에게 유용한 내용만 골라 정리합니다.
              꿀벌처럼 부지런히 AI 생태계 곳곳에서 정보를 모아 전달합니다.
            </p>
          </section>

          <section aria-labelledby="faq" className="bg-amber-50 rounded-xl p-6">
            <h2 id="faq" className="text-base font-bold text-gray-900 mb-4">자주 묻는 질문</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-gray-800">얼마나 자주 글을 올리나요?</p>
                <p className="text-gray-600 mt-1">주요 AI 뉴스가 있을 때마다 최대한 빠르게 업데이트합니다. 보통 주 3~5회 발행합니다.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">비개발자도 이해할 수 있나요?</p>
                <p className="text-gray-600 mt-1">네, 기술 배경 없이도 이해할 수 있도록 쉽게 설명하는 것을 원칙으로 합니다.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
