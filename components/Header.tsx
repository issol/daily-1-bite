'use client';

import Link from 'next/link';
import {useState} from 'react';
import {CATEGORIES} from '@/lib/categories';
import {S} from '@/lib/strings';

const CATEGORY_KEYS = Object.keys(CATEGORIES);

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🐝</span>
          <span className="font-bold text-xl text-gray-900">{S.home.siteName}</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          {CATEGORY_KEYS.slice(0, 4).map((key) => (
            <Link
              key={key}
              href={`/category/${key}`}
              className="hover:text-amber-500 transition-colors"
            >
              {CATEGORIES[key]}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="메뉴 열기"
        >
          <div className="w-5 h-0.5 bg-gray-700 mb-1" />
          <div className="w-5 h-0.5 bg-gray-700 mb-1" />
          <div className="w-5 h-0.5 bg-gray-700" />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4">
          <nav className="flex flex-col gap-4 text-sm font-medium text-gray-600">
            {CATEGORY_KEYS.map((key) => (
              <Link
                key={key}
                href={`/category/${key}`}
                className="hover:text-amber-500"
                onClick={() => setMenuOpen(false)}
              >
                {CATEGORIES[key]}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
