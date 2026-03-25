'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { PostMeta } from '@/lib/posts';

interface SearchBarProps {
  posts: PostMeta[];
}

export default function SearchBar({ posts }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return posts
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [query, posts]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="search"
          placeholder="글 검색..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="w-full px-4 py-2.5 pl-10 text-sm rounded-full border border-gray-200 bg-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
          aria-label="글 검색"
        />
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-gray-400 text-center">
              검색 결과가 없습니다
            </div>
          ) : (
            <ul>
              {results.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block px-4 py-3 hover:bg-amber-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <span className="text-sm font-medium text-gray-800 line-clamp-1">
                      {post.title}
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                      {post.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
