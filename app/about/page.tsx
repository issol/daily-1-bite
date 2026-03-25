import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '소개',
  description: '매일 한입 블로그를 소개합니다.',
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">🐝</div>
        <h1 className="text-3xl font-bold text-gray-900">매일 한입</h1>
        <p className="text-gray-500 mt-2">AI 뉴스 요약 블로그</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">블로그 소개</h2>
          <p>
            매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드리는 블로그입니다.
            복잡한 기술 이야기를 한입 크기로 정리해, 바쁜 일상에서도 AI 트렌드를 놓치지 않도록 돕습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">다루는 주제</h2>
          <ul className="space-y-2">
            <li>🤖 <strong>AI 뉴스</strong> — 최신 AI 업계 동향과 주요 발표</li>
            <li>🛠️ <strong>AI Tools & Review</strong> — 실제로 써본 AI 도구 리뷰</li>
            <li>📚 <strong>AI Tutorial</strong> — AI 도구 활용법 가이드</li>
            <li>💭 <strong>Dev Life & Opinion</strong> — AI 시대 개발자 이야기</li>
            <li>🔍 <strong>SEO</strong> — 검색 최적화 팁과 노하우</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">운영자</h2>
          <p>
            <strong>A꿀벌I</strong> — AI와 함께 일하는 것을 좋아하는 사람.
            매일 AI 뉴스를 읽으며 유용한 내용을 골라 정리합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
