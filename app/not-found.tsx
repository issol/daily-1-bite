import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다',
  description: '요청하신 페이지가 존재하지 않거나 이동되었습니다.',
};

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-32 text-center">
      <div className="text-6xl mb-6">🐝</div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-lg text-gray-500 mb-8">
        앗, 이 페이지는 존재하지 않거나 이동되었어요.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-amber-400 text-white font-medium hover:bg-amber-500 transition-colors"
        >
          홈으로 돌아가기
        </Link>
        <Link
          href="/blog"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-gray-200 text-gray-700 font-medium hover:border-amber-400 hover:text-amber-600 transition-colors"
        >
          전체 글 보기
        </Link>
      </div>
    </div>
  );
}
