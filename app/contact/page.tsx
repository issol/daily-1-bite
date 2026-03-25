import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '문의하기 | 매일 한입',
  description: '매일 한입 블로그에 문의사항, 제보, 협업 제안을 보내주세요.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://daily-1-bite.com'}/contact`,
  },
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">문의하기</h1>
      <p className="text-gray-500 mb-10 text-sm">
        뉴스 제보, 협업 제안, 오탈자 신고 등 무엇이든 편하게 보내주세요.
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6">

        {/* 이메일 직접 연락 */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 text-lg">
            ✉️
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">이메일</p>
            <a
              href="mailto:isolatorv@gmail.com"
              className="text-amber-600 hover:text-amber-700 transition-colors text-sm"
            >
              isolatorv@gmail.com
            </a>
            <p className="text-gray-400 text-xs mt-1">
              영업일 기준 1~2일 내 답변 드립니다.
            </p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* 어떤 문의를 받나 */}
        <div>
          <p className="font-semibold text-gray-800 mb-3 text-sm">이런 내용을 보내주세요</p>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              { icon: '📰', text: 'AI 뉴스·업데이트 제보' },
              { icon: '🔧', text: '오탈자·내용 오류 신고' },
              { icon: '🤝', text: '협업 · 광고 · 스폰서십 문의' },
              { icon: '💡', text: '다루어 주셨으면 하는 주제 제안' },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <span>{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <hr className="border-gray-100" />

        {/* 빠른 응답 시간 안내 */}
        <p className="text-xs text-gray-400 leading-relaxed">
          스팸·광고성 메일은 별도 응답 없이 처리될 수 있습니다.
          개인정보는{' '}
          <a href="/privacy-policy" className="underline hover:text-amber-500 transition-colors">
            개인정보처리방침
          </a>
          에 따라 보호됩니다.
        </p>
      </div>
    </div>
  );
}
