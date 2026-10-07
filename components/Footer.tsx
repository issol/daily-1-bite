import Link from 'next/link';
import {S} from '@/lib/strings';

export default function Footer() {
  const biz = S.footer.business;
  return (
    <footer className="border-t border-gray-100 mt-16 py-10 text-sm text-gray-500">
      <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🐝</span>
          <span className="font-medium text-gray-700">{S.footer.siteName}</span>
          <span>— {S.footer.tagline}</span>
        </div>
        <div className="flex gap-6">
          <Link href="/about" className="hover:text-amber-500 transition-colors">
            {S.nav.about}
          </Link>
          <Link href="/contact" className="hover:text-amber-500 transition-colors">
            {S.nav.contact}
          </Link>
          <Link href="/stats" className="hover:text-amber-500 transition-colors">
            {S.nav.stats}
          </Link>
          <Link href="/privacy-policy" className="hover:text-amber-500 transition-colors">
            {S.nav.privacy}
          </Link>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 mt-6 text-center text-xs text-gray-400 space-y-1">
        <p>
          상호: {biz.name} | 대표자: {biz.owner} | 사업자등록번호: {biz.registrationNumber}
        </p>
        <p>주소: {biz.address}</p>
        <p>
          대표전화: {biz.phone} | 문의:{' '}
          <a href={`mailto:${biz.email}`} className="hover:text-amber-500 transition-colors">
            {biz.email}
          </a>
        </p>
        <p className="pt-2">{S.footer.copyright(new Date().getFullYear())}</p>
      </div>
    </footer>
  );
}
