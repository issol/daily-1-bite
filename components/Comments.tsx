'use client';

import Giscus from '@giscus/react';

export default function Comments() {
  return (
    <section className="mt-12 pt-8 border-t border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-6">💬 댓글</h2>
      <Giscus
        repo="issol/daily-1-bite"
        repoId="R_kgDORwDWPQ"
        category="General"
        categoryId="DIC_kwDORwDWPc4C5Opg"
        mapping="pathname"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme="light"
        lang="ko"
        loading="lazy"
      />
    </section>
  );
}
