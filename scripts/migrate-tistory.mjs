/**
 * migrate-tistory.mjs
 * Tistory RSS → MDX 마이그레이션 스크립트
 *
 * 사용법: node scripts/migrate-tistory.mjs
 *
 * 동작:
 *  1. Tistory RSS 피드를 파싱 (최대 100개)
 *  2. 각 포스트의 HTML 본문을 Markdown으로 변환
 *  3. 카테고리 자동 매핑 후 content/posts/<category>/<slug>.mdx 저장
 */

import { NodeHtmlMarkdown } from 'node-html-markdown';
import slugify from 'slugify';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'posts');

// ─── 설정 ───────────────────────────────────────
const TISTORY_BLOG = 'daily-1-bite';
const RSS_URL = `https://${TISTORY_BLOG}.tistory.com/rss`;
const TISTORY_BASE = `https://${TISTORY_BLOG}.tistory.com`;

// Tistory 카테고리 → 로컬 카테고리 슬러그 매핑
const CATEGORY_MAP = {
  'ai': 'ai',
  'ai 뉴스': 'ai',
  'ai뉴스': 'ai',
  'ai 트렌드': 'ai',
  'ai트렌드': 'ai',
  '인공지능': 'ai',
  'ai 도구': 'ai-tools',
  'ai도구': 'ai-tools',
  'ai tools': 'ai-tools',
  'ai 리뷰': 'ai-tools',
  'ai리뷰': 'ai-tools',
  '도구 리뷰': 'ai-tools',
  '도구리뷰': 'ai-tools',
  'ai 튜토리얼': 'ai-tutorial',
  'ai튜토리얼': 'ai-tutorial',
  'ai tutorial': 'ai-tutorial',
  'how to': 'ai-tutorial',
  '활용법': 'ai-tutorial',
  'seo': 'seo',
  '블로그': 'blog-info',
  '블로그 정보': 'blog-info',
  '블로그정보': 'blog-info',
  'blog info': 'blog-info',
  '개발': 'dev-life',
  '개발자': 'dev-life',
  'dev life': 'dev-life',
  '의견': 'dev-life',
};

const DEFAULT_CATEGORY = 'ai';

// ─── 헬퍼 함수 ──────────────────────────────────

function mapCategory(rawCategory) {
  if (!rawCategory) return DEFAULT_CATEGORY;
  const key = rawCategory.trim().toLowerCase();
  return CATEGORY_MAP[key] ?? DEFAULT_CATEGORY;
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, '-')
    .replace(/&times;/g, 'x')
    .replace(/&rarr;/g, '-')
    .replace(/&hellip;/g, '')
    .replace(/&[a-z]+;/gi, '')
    .replace(/&#\d+;/g, '');
}

function toSlug(title) {
  // HTML 엔티티 디코딩 후 슬러그 생성
  const decoded = decodeHtmlEntities(title);
  return slugify(decoded, {
    lower: true,
    strict: true,
    locale: 'ko',
    trim: true,
  }).replace(/^-+|-+$/g, '').substring(0, 60) || `post-${Date.now()}`;
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function extractDescription(htmlContent, maxLen = 160) {
  const text = htmlContent
    // 1) 먼저 HTML 엔티티를 디코딩 (RSS가 &lt;p&gt; 형태로 이중 인코딩하는 경우)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&middot;/g, '·')
    .replace(/&[a-z]+;/gi, '')
    .replace(/&#\d+;/g, '')
    // 2) 디코딩 후 HTML 태그 제거 (실제 <p>, <img> 등 포함)
    .replace(/<[^>]+>/g, ' ')
    // 3) 한번 더 엔티티 정리 (중첩된 경우)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&[a-z]+;/gi, '')
    // 4) 공백 정리
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLen ? text.substring(0, maxLen).replace(/\s+\S*$/, '') + '...' : text;
}

function extractTags(keywords) {
  if (!keywords) return [];
  return keywords
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .slice(0, 6);
}

async function fetchRSS(url) {
  console.log(`📡 RSS 가져오는 중: ${url}`);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; migration-bot/1.0)' },
  });
  if (!res.ok) throw new Error(`RSS 요청 실패: ${res.status} ${res.statusText}`);
  return res.text();
}

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const get = (tag) => {
      const m = block.match(new RegExp(`<${tag}(?:[^>]*)><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return m ? (m[1] ?? m[2] ?? '').trim() : '';
    };

    const title = get('title');
    const link = get('link') || get('guid');
    const pubDate = get('pubDate');
    const description = get('description');
    const category = get('category');
    const keywords = get('media:keywords') || get('keywords') || '';

    if (title && description) {
      items.push({ title, link, pubDate, description, category, keywords });
    }
  }

  console.log(`📄 파싱된 포스트: ${items.length}개`);
  return items;
}

function sanitizeForMdx(markdown) {
  const parts = [];
  let pos = 0;
  // 코드블록은 보호, 그 외 영역에서만 변환
  const codeBlockRegex = /(```[\s\S]*?```|`[^`]+`)/g;
  let match;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    // 코드블록 이전 텍스트 처리
    const before = markdown.slice(pos, match.index);
    parts.push(
      before
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
    );
    parts.push(match[0]); // 코드블록 그대로 유지
    pos = match.index + match[0].length;
  }
  // 나머지 텍스트
  const rest = markdown.slice(pos);
  parts.push(
    rest
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
  );

  return parts.join('');
}

function htmlToMarkdown(html) {
  // 1) Tistory 불필요 요소 제거
  let cleaned = html
    .replace(/<div[^>]*class="[^"]*revenue[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*id="[^"]*revenue[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*class="[^"]*ad[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<!--.*?-->/gs, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // <br>, <br > → 줄바꿈 (MDX는 <br/>도 위험할 수 있어 아예 줄바꿈으로)
    .replace(/<br\s*\/?>/gi, '\n')
    // Tistory 커스텀 속성 제거 (data-ke-*, style 등)
    .replace(/\s+data-ke-[a-z-]+="[^"]*"/gi, '')
    .replace(/\s+style="[^"]*"/gi, '');

  // 2) HTML → Markdown 변환
  let markdown = NodeHtmlMarkdown.translate(cleaned);

  // 3) 변환 후 남은 HTML 태그를 MDX 안전하게 처리
  markdown = markdown
    // img → 마크다운 이미지 (src와 alt 모두 보존)
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, (_, src, alt) => `\n![${alt}](${src})\n`)
    .replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, (_, alt, src) => `\n![${alt}](${src})\n`)
    .replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, (_, src) => `\n![이미지](${src})\n`)
    .replace(/<img[^>]*>/gi, '')
    // br → 줄바꿈
    .replace(/<br\s*\/?>/gi, '\n\n')
    // p 태그 → 줄바꿈
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    // h1~h6 태그 → 마크다운 헤딩
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => `\n# ${t.replace(/<[^>]+>/g, '')}\n`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `\n## ${t.replace(/<[^>]+>/g, '')}\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => `\n### ${t.replace(/<[^>]+>/g, '')}\n`)
    // strong/em은 마크다운으로 대체
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '_$1_')
    // a 태그 → 마크다운 링크
    .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    // blockquote
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, t) => t.replace(/<[^>]+>/g, '').split('\n').map(l => `> ${l}`).join('\n'))
    // HTML 주석 제거 (MDX에서 <!-- --> 은 오류)
    .replace(/<!--[\s\S]*?-->/g, '')
    // 나머지 모든 HTML 태그 제거
    .replace(/<[^>]+>/g, '');

  // 4) MDX 위험 문자 이스케이프
  markdown = sanitizeForMdx(markdown);

  // 5) 마크다운에 남은 HTML 엔티티 디코딩
  markdown = markdown
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&middot;/g, '·')
    .replace(/&[a-z]+;/gi, '')
    .replace(/&#\d+;/g, '');

  // 6) 엔티티 디코딩 후 생성된 HTML 재제거 (<!--, <script> 등)
  markdown = markdown
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '');

  // 7) 연속 빈 줄 정리
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  return markdown;
}

function buildFrontmatter({ title, date, description, category, tags }) {
  const safeTitle = title.replace(/"/g, '\\"');
  const safeDesc = description.replace(/"/g, '\\"').substring(0, 200);
  const tagsStr = tags.length
    ? `[${tags.map(t => `"${t.replace(/"/g, '\\"')}"`).join(', ')}]`
    : '[]';

  return `---
title: "${safeTitle}"
date: "${date}"
description: "${safeDesc}"
category: "${category}"
tags: ${tagsStr}
---

`;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function main() {
  console.log('\n🚀 Tistory → MDX 마이그레이션 시작\n');

  let xml;
  try {
    xml = await fetchRSS(RSS_URL);
  } catch (err) {
    console.error('❌ RSS 가져오기 실패:', err.message);
    console.error('  → Tistory 관리자 > 블로그 설정 > RSS/Atom 발행이 활성화되어 있는지 확인하세요.');
    process.exit(1);
  }

  const items = parseRSS(xml);
  if (items.length === 0) {
    console.error('❌ 포스트를 파싱하지 못했습니다. RSS 구조를 확인해주세요.');
    process.exit(1);
  }

  const slugCount = {};
  let success = 0;
  let skipped = 0;

  for (const item of items) {
    const category = mapCategory(item.category);
    const date = formatDate(item.pubDate);
    const description = extractDescription(item.description);
    const tags = extractTags(item.keywords);

    // 슬러그 중복 방지
    let slug = toSlug(item.title);
    if (!slug) slug = `post-${Date.now()}`;
    if (slugCount[slug]) {
      slugCount[slug]++;
      slug = `${slug}-${slugCount[slug]}`;
    } else {
      slugCount[slug] = 1;
    }

    const dir = path.join(CONTENT_DIR, category);
    const filePath = path.join(dir, `${slug}.mdx`);

    // 이미 있으면 건너뜀
    if (fs.existsSync(filePath)) {
      console.log(`⏭  건너뜀 (이미 존재): ${category}/${slug}.mdx`);
      skipped++;
      continue;
    }

    const markdown = htmlToMarkdown(item.description);
    const frontmatter = buildFrontmatter({ title: item.title, date, description, category, tags });
    const content = frontmatter + markdown;

    ensureDir(dir);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ 저장: content/posts/${category}/${slug}.mdx  [${date}]`);
    success++;
  }

  console.log(`\n📊 완료: 성공 ${success}개 / 건너뜀 ${skipped}개 / 전체 ${items.length}개`);
  console.log(`📁 저장 위치: ${CONTENT_DIR}`);
  console.log('\n다음 단계: npm run build 또는 npm run dev 로 확인하세요.\n');
}

main().catch(err => {
  console.error('❌ 예기치 않은 오류:', err);
  process.exit(1);
});
