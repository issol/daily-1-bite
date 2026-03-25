'use client';

import { useState } from 'react';
import PostCard from './PostCard';
import PostList from './PostList';
import type { PostMeta } from '@/lib/posts';

interface PostListWithToggleProps {
  posts: PostMeta[];
}

export default function PostListWithToggle({ posts }: PostListWithToggleProps) {
  const [view, setView] = useState<'card' | 'list'>('card');

  return (
    <>
      <div className="flex justify-end mb-4">
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setView('card')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'card'
                ? 'bg-amber-400 text-white'
                : 'bg-white text-gray-500 hover:text-gray-700'
            }`}
            aria-label="카드 보기"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'list'
                ? 'bg-amber-400 text-white'
                : 'bg-white text-gray-500 hover:text-gray-700'
            }`}
            aria-label="리스트 보기"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {view === 'card' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <PostList posts={posts} />
      )}
    </>
  );
}
