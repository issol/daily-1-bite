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
      '매일 한입을 운영하는 A꿀벌I를 소개합니다. 현직 개발자가 AI 도구를 실무에서 직접 써보고 솔직하게 정리하는 AI 뉴스 블로그입니다.',
    alternates: {
      canonical: `${BASE_URL}/${locale}/about`,
    },
    openGraph: {
      title: 'A꿀벌I 소개 | 매일 한입',
      description: '현직 개발자가 AI 도구를 실무에서 직접 써보고 솔직하게 정리하는 AI 뉴스 블로그입니다.',
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
        description="현직 개발자로서 AI 도구를 실무에서 매일 사용하며, 개발자 관점에서 AI 뉴스와 도구를 솔직하게 정리합니다."
      />

      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4" role="img" aria-label="꿀벌 이모지">🐝</div>
          <h1 className="text-3xl font-bold text-gray-900">매일 한입</h1>
          <p className="text-gray-500 mt-2">현직 개발자의 AI 뉴스 & 도구 리뷰</p>
        </div>

        <div className="space-y-6 text-gray-700 leading-relaxed">

          {/* 운영자 소개 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-5">
            <h2 className="text-xl font-bold text-gray-900">운영자 소개 — A꿀벌I</h2>

            <p>
              IT 업계에서 6년째 일하고 있는 현직 개발자입니다. 백엔드 위주로 일하다가
              2024년 말부터 AI 도구를 실무에 본격적으로 도입하기 시작했습니다.
            </p>

            <p>
              처음엔 ChatGPT 하나로 시작했는데, 지금은 Claude Code로 코딩하고,
              NotebookLM으로 긴 문서를 분석하고, Cursor로 레거시 코드를 리팩토링합니다.
              단순히 써보는 게 아니라 실제 업무 흐름에 녹여서 씁니다.
            </p>

            <p>
              그러다 보니 "이 도구 진짜 어때요?"라는 질문을 주변에서 자주 받게 됐어요.
              마케팅 자료나 벤치마크 수치가 아니라, 실제로 써본 개발자 입장에서
              솔직하게 얘기해주는 사람이 필요하다는 걸 느꼈습니다. 그래서 이 블로그를 시작했습니다.
            </p>

            <div className="bg-amber-50 rounded-xl p-5 text-sm">
              <p className="font-semibold text-gray-800 mb-2">📋 경력 요약</p>
              <ul className="space-y-1 text-gray-600">
                <li>• IT 업계 현직 개발자 (경력 6년)</li>
                <li>• AI 도구 실무 적용 경력 1년 6개월+</li>
                <li>• 매일 Claude, ChatGPT, Cursor, NotebookLM 사용</li>
                <li>• 2026년 3월 블로그 개설, 현재까지 80편+ 발행</li>
              </ul>
            </div>
          </div>

          {/* 내 AI 스택 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">내가 매일 쓰는 AI 스택</h2>
            <p className="text-sm text-gray-500">실무에서 실제로 사용하는 도구들입니다. 이 도구들을 써본 경험이 블로그 콘텐츠의 기반이 됩니다.</p>

            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  tool: 'Claude Code',
                  use: '코딩 어시스턴트',
                  detail: '코드 리뷰, 리팩토링, 에러 디버깅. 터미널에서 바로 실행해서 맥락을 유지하며 작업합니다.',
                  emoji: '🤖',
                },
                {
                  tool: 'Cursor',
                  use: 'IDE + AI',
                  detail: '레거시 코드 분석, 대규모 리팩토링. 파일 전체를 컨텍스트로 넣을 수 있어서 유용합니다.',
                  emoji: '✏️',
                },
                {
                  tool: 'ChatGPT (GPT-4o)',
                  use: '아이디어 정리',
                  detail: '브레인스토밍, 기획 초안, 빠른 질문 처리. 대화 흐름이 자연스러워서 아이디어 발산에 씁니다.',
                  emoji: '💬',
                },
                {
                  tool: 'NotebookLM',
                  use: '긴 문서 분석',
                  detail: '200페이지짜리 백서, 영문 논문 처리. 원본에서만 답하는 구조라 환각이 적습니다.',
                  emoji: '📚',
                },
                {
                  tool: 'Perplexity',
                  use: '리서치',
                  detail: '최신 AI 뉴스 검색, 출처 확인. 블로그 글 작성 전 팩트 체크에 사용합니다.',
                  emoji: '🔍',
                },
              ].map(({ tool, use, detail, emoji }) => (
                <div key={tool} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl shrink-0">{emoji}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{tool}</span>
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{use}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 블로그 소개 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-5">
            <h2 className="text-xl font-bold text-gray-900">블로그 소개</h2>

            <p>
              매일 쏟아지는 AI 뉴스를 전부 읽는 건 불가능합니다. 저도 처음엔 RSS 피드를
              50개 넘게 구독했다가 포기했어요. 중요한 뉴스를 놓칠까봐 불안하고,
              그렇다고 다 읽으면 하루 2시간씩 뉴스만 보게 됩니다.
            </p>

            <p>
              그래서 매일 한입은 <strong>개발자에게 실제로 중요한 것만 골라서 정리</strong>합니다.
              발표 날짜, 버전 번호, 공식 출처를 명시하고, 직접 써보지 않은 도구는
              "공식 발표 기반 분석"임을 명확히 밝힙니다.
            </p>

            <ul className="space-y-3">
              <li>🤖 <strong>AI 뉴스</strong> — OpenAI, Anthropic, Google 등 주요 AI 기업 발표와 시장 동향</li>
              <li>🛠️ <strong>AI Tools & Review</strong> — 직접 써본 AI 생산성 도구 솔직 리뷰</li>
              <li>📚 <strong>AI Tutorial & How-to</strong> — 실무에 바로 적용하는 AI 활용 가이드</li>
              <li>💭 <strong>Dev Life & Opinion</strong> — AI 시대 개발자의 생각과 인사이트</li>
            </ul>
          </div>

          {/* 블로그 운영 원칙 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">블로그 운영 원칙</h2>

            <div className="space-y-4 text-sm">
              {[
                {
                  title: '공식 출처 확인 후 작성',
                  desc: '공식 블로그, 릴리스 노트, 공식 문서를 직접 확인하고 발표 날짜와 버전 번호를 명시합니다. 추측성 내용은 작성하지 않습니다.',
                },
                {
                  title: '직접 테스트한 것과 아닌 것 구분',
                  desc: '직접 사용해본 도구는 체험 기반으로 작성하고, 그렇지 않은 경우 "공식 발표 기반"임을 명시합니다.',
                },
                {
                  title: '장단점을 균형 있게',
                  desc: '좋은 점만 쓰는 홍보성 글은 쓰지 않습니다. 불편한 점, 한계, 아쉬운 점을 솔직하게 포함합니다.',
                },
                {
                  title: '개발자 관점 우선',
                  desc: '일반 소비자가 아닌 개발자가 실무에서 쓸 때 어떤지에 초점을 맞춥니다.',
                },
              ].map(({ title, desc }) => (
                <div key={title} className="flex gap-3">
                  <span className="text-amber-500 mt-0.5 shrink-0">✓</span>
                  <div>
                    <p className="font-semibold text-gray-800">{title}</p>
                    <p className="text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-amber-50 rounded-2xl p-8 space-y-5">
            <h2 className="text-xl font-bold text-gray-900">자주 묻는 질문</h2>

            <div className="space-y-5 text-sm">
              {[
                {
                  q: '얼마나 자주 글을 올리나요?',
                  a: '주 3~5회 발행합니다. 중요한 AI 발표나 업데이트가 있으면 당일 또는 다음날 정리합니다. 속도보다 정확성을 우선합니다.',
                },
                {
                  q: '비개발자도 이해할 수 있나요?',
                  a: '네. 기술 배경 없이도 이해할 수 있도록 쉽게 설명하는 것을 원칙으로 합니다. 다만 일부 튜토리얼은 기본적인 개발 지식이 필요할 수 있습니다.',
                },
                {
                  q: '특정 AI 회사로부터 후원을 받나요?',
                  a: '현재 어떤 AI 기업으로부터도 후원이나 협찬을 받지 않습니다. 모든 리뷰는 독립적입니다.',
                },
                {
                  q: '글의 내용이 틀렸거나 업데이트가 필요하면 어떻게 하나요?',
                  a: '이메일로 알려주시면 확인 후 수정합니다. 수정 시 날짜와 변경 내용을 글 하단에 명시합니다.',
                },
              ].map(({ q, a }) => (
                <div key={q}>
                  <p className="font-semibold text-gray-800">{q}</p>
                  <p className="text-gray-600 mt-1">{a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-500 text-sm">
              제보, 협업, 오탈자 신고는{' '}
              <a href="mailto:isolatorv@gmail.com" className="text-amber-600 font-medium hover:underline">
                isolatorv@gmail.com
              </a>
              으로 보내주세요.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
