'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const article = document.querySelector('article');
    if (!article) return;

    const elements = article.querySelectorAll('h2, h3');
    const items: TocItem[] = Array.from(elements).map((el) => {
      // Generate ID if missing
      if (!el.id) {
        el.id = el.textContent
          ?.trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w가-힣-]/g, '')
          .toLowerCase() || '';
      }
      return {
        id: el.id,
        text: el.textContent || '',
        level: el.tagName === 'H2' ? 2 : 3,
      };
    });

    setHeadings(items);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (headings.length < 3) return null;

  return (
    <nav className="mb-8 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
      <p className="text-sm font-bold text-gray-700 mb-2">📑 목차</p>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: h.level === 3 ? 16 : 0 }}>
            <a
              href={`#${h.id}`}
              className={`block text-sm py-0.5 transition-colors ${
                activeId === h.id
                  ? 'text-amber-600 font-medium'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
