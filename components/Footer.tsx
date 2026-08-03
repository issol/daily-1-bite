import Link from 'next/link';
import {S} from '@/lib/strings';

export default function Footer() {
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
      <div className="text-center mt-6 text-xs text-gray-400">
        {S.footer.copyright(new Date().getFullYear())}
      </div>
    </footer>
  );
}
