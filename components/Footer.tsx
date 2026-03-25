import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 mt-16 py-10 text-sm text-gray-500">
      <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🐝</span>
          <span className="font-medium text-gray-700">매일 한입</span>
          <span>— 매일 쏟아지는 AI 뉴스를 보기 쉽게 요약해드립니다</span>
        </div>
        <div className="flex gap-6">
          <Link href="/about" className="hover:text-amber-500 transition-colors">
            소개
          </Link>
          <Link href="/contact" className="hover:text-amber-500 transition-colors">
            문의
          </Link>
          <Link href="/stats" className="hover:text-amber-500 transition-colors">
            통계
          </Link>
          <Link href="/privacy-policy" className="hover:text-amber-500 transition-colors">
            개인정보처리방침
          </Link>
        </div>
      </div>
      <div className="text-center mt-6 text-xs text-gray-400">
        © {new Date().getFullYear()} 매일 한입. All rights reserved.
      </div>
    </footer>
  );
}
