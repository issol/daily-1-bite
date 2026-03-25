import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: '매일 한입 블로그의 개인정보처리방침입니다.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-8 text-gray-700 leading-relaxed text-sm">
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">1. 개인정보의 처리 목적</h2>
          <p>
            매일 한입(이하 &quot;블로그&quot;)은 별도의 회원가입 없이 운영되며,
            방문자의 개인정보를 직접 수집하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">2. 광고 서비스</h2>
          <p>
            본 블로그는 Google AdSense를 통해 광고를 게재할 수 있습니다.
            Google은 쿠키를 사용하여 방문자의 관심사에 맞는 광고를 표시할 수 있습니다.
            Google의 광고 쿠키 사용에 대한 자세한 내용은{' '}
            <a
              href="https://policies.google.com/technologies/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 underline"
            >
              Google 광고 정책
            </a>
            을 참조하세요.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">3. 쿠키(Cookie)</h2>
          <p>
            본 블로그는 Google Analytics 및 Google AdSense 운영을 위해 쿠키를 사용할 수 있습니다.
            브라우저 설정을 통해 쿠키 사용을 거부할 수 있으나, 이 경우 일부 서비스 이용이 제한될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">4. 외부 링크</h2>
          <p>
            본 블로그는 외부 사이트로의 링크를 포함할 수 있습니다.
            외부 사이트의 개인정보 처리 방침에 대해서는 해당 사이트를 확인하시기 바랍니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">5. 문의</h2>
          <p>
            개인정보처리방침에 관한 문의는 블로그 소개 페이지를 통해 연락하실 수 있습니다.
          </p>
        </section>

        <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
          본 방침은 2026년 3월 25일부터 시행됩니다.
        </p>
      </div>
    </div>
  );
}
