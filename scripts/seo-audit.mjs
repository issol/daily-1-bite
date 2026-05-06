#!/usr/bin/env node
// SEO 콘텐츠 감사 스크립트
// 사용: node scripts/seo-audit.mjs [--gsc=path/to/gsc-export.csv] [--locale=ko]
//
// 무엇을 하는가:
//   - content/posts/<locale>/ 의 모든 mdx/md 검사
//   - 각 글에 대해 워드카운트, 내부링크 수신/발신, 백데이트 여부, 카테고리 유효성 체크
//   - "Crawled - currently not indexed" 위험도 점수 산출
//   - 선택: GSC export CSV 와 매칭해서 실제 거부된 글 패턴 출력
//
// 출력:
//   - .seo-audit/report.md        — 사람이 읽는 리포트
//   - .seo-audit/audit.json       — 전체 데이터
//   - .seo-audit/at-risk.txt      — 위험도 높은 슬러그 리스트

import fs from 'node:fs';
import path from 'node:path';
import {execSync} from 'node:child_process';

const ROOT = process.cwd();
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const LOCALE = args.locale || 'ko';
const GSC_CSV = args.gsc || null;
const POSTS_DIR = path.join(ROOT, 'content/posts', LOCALE);
const OUT_DIR = path.join(ROOT, '.seo-audit');
const VALID_CATEGORIES = new Set(['ai', 'dev-life', 'ai-tools', 'ai-tutorial', 'seo', 'blog-info']);

if (!fs.existsSync(POSTS_DIR)) {
  console.error(`Posts dir not found: ${POSTS_DIR}`);
  process.exit(1);
}
fs.mkdirSync(OUT_DIR, {recursive: true});

// ---------- helpers ----------
function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(mdx?|md)$/.test(e.name)) out.push(p);
  }
  return out;
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return {data: {}, content: raw};
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    let val = kv[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      val = val.replace(/^["']|["']$/g, '');
    }
    data[kv[1]] = val;
  }
  return {data, content: m[2]};
}

function countWords(text) {
  // 마크다운 잡음 제거
  const clean = text
    .replace(/```[\s\S]*?```/g, ' ') // 코드블록
    .replace(/`[^`]*`/g, ' ') // 인라인 코드
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ') // 이미지
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1') // 링크 → 텍스트만
    .replace(/[#>*_~|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // 한글 + 영문 워드 카운트 — 한글은 글자 단위, 영문은 토큰
  const koChars = (clean.match(/[ㄱ-힝]/g) || []).length;
  const enWords = clean
    .replace(/[ㄱ-힝]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  // 한글 1자 ≈ 영문 0.7어휘 보정
  return Math.round(koChars * 0.7 + enWords);
}

function getGitFirstSeen(filePath) {
  try {
    const out = execSync(`git log --reverse --format=%aI -- "${filePath}"`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.split('\n')[0]?.slice(0, 10) || null;
  } catch {
    return null;
  }
}

function extractInternalLinks(content) {
  // /blog/<slug> 또는 /ko/blog/<slug> 패턴
  const matches = content.matchAll(/\(([^)]*\/blog\/[^)#?\s]+)/g);
  const slugs = new Set();
  for (const m of matches) {
    const url = m[1];
    const slug = url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/(ko|en)\/blog\//, '').replace(/^\/blog\//, '').replace(/\/$/, '');
    if (slug) slugs.add(slug);
  }
  return [...slugs];
}

// ---------- collect ----------
const files = walk(POSTS_DIR);
const posts = files.map((file) => {
  const raw = fs.readFileSync(file, 'utf8');
  const {data, content} = parseFrontmatter(raw);
  const relativePath = path.relative(POSTS_DIR, file);
  const slug = relativePath.replace(/\.(mdx|md)$/, '').replace(/\\/g, '/');
  return {
    file,
    slug,
    title: data.title || '',
    description: data.description || '',
    category: data.category || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    thumbnail: data.thumbnail || null,
    date: data.date || '',
    words: countWords(content),
    contentChars: content.length,
    outgoingLinks: extractInternalLinks(content),
    gitFirstSeen: getGitFirstSeen(file),
  };
});

// 인커밍 링크 그래프
const incoming = new Map();
for (const p of posts) incoming.set(p.slug, new Set());
for (const p of posts) {
  for (const target of p.outgoingLinks) {
    if (incoming.has(target)) incoming.get(target).add(p.slug);
  }
}
for (const p of posts) p.incomingLinks = [...(incoming.get(p.slug) || [])];

// ---------- risk scoring ----------
function score(p) {
  const issues = [];
  let s = 0;
  if (p.words < 500) {
    s += 5;
    issues.push(`매우 얇음 (${p.words}어)`);
  } else if (p.words < 800) {
    s += 3;
    issues.push(`얇음 (${p.words}어)`);
  } else if (p.words < 1200) {
    s += 1;
    issues.push(`보통 (${p.words}어)`);
  }

  if (!p.description || p.description.length < 80) {
    s += 2;
    issues.push(`description 부족 (${p.description?.length || 0}자)`);
  }
  if (!p.thumbnail) {
    s += 1;
    issues.push('썸네일 없음');
  }
  if (!VALID_CATEGORIES.has(p.category)) {
    s += 5;
    issues.push(`카테고리 무효: "${p.category}"`);
  }
  if (p.incomingLinks.length === 0) {
    s += 3;
    issues.push('내부 인바운드 링크 0');
  }
  if (p.outgoingLinks.length === 0) {
    s += 2;
    issues.push('내부 아웃바운드 링크 0');
  }
  if (p.tags.length < 3) {
    s += 1;
    issues.push(`태그 ${p.tags.length}개`);
  }
  if (p.date && p.gitFirstSeen) {
    const fmDate = new Date(p.date);
    const gitDate = new Date(p.gitFirstSeen);
    const diffDays = Math.round((gitDate - fmDate) / 86400000);
    if (diffDays > 30) {
      s += 2;
      issues.push(`백데이트 의심 (frontmatter ${p.date} vs git ${p.gitFirstSeen}, ${diffDays}일 차)`);
    }
  }
  if (p.title.length > 70) {
    s += 1;
    issues.push(`타이틀 ${p.title.length}자 — 잘릴 가능성`);
  }
  return {score: s, issues};
}

for (const p of posts) {
  const r = score(p);
  p.riskScore = r.score;
  p.issues = r.issues;
}

posts.sort((a, b) => b.riskScore - a.riskScore);

// ---------- GSC CSV match ----------
let gscMatched = null;
if (GSC_CSV && fs.existsSync(GSC_CSV)) {
  const csv = fs.readFileSync(GSC_CSV, 'utf8');
  const rows = csv.split('\n').slice(1).map((l) => l.trim()).filter(Boolean);
  const urls = rows.map((r) => r.split(',')[0].replace(/^"|"$/g, ''));
  const matched = [];
  const unmatched = [];
  for (const url of urls) {
    const slug = url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/(ko|en)\/blog\//, '').replace(/^\/blog\//, '').replace(/\/$/, '');
    const post = posts.find((p) => p.slug === slug);
    if (post) {
      matched.push({url, ...post});
      post.gscFlagged = true;
    } else {
      unmatched.push(url);
    }
  }
  gscMatched = {total: urls.length, matched: matched.length, unmatched};
}

// ---------- aggregate stats ----------
const totals = {
  posts: posts.length,
  totalWords: posts.reduce((a, p) => a + p.words, 0),
  avgWords: Math.round(posts.reduce((a, p) => a + p.words, 0) / posts.length),
  thinPosts: posts.filter((p) => p.words < 800).length,
  veryThin: posts.filter((p) => p.words < 500).length,
  orphanIncoming: posts.filter((p) => p.incomingLinks.length === 0).length,
  noOutgoing: posts.filter((p) => p.outgoingLinks.length === 0).length,
  invalidCategory: posts.filter((p) => !VALID_CATEGORIES.has(p.category)).length,
  byCategory: posts.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {}),
};

// ---------- write ----------
fs.writeFileSync(path.join(OUT_DIR, 'audit.json'), JSON.stringify({totals, gscMatched, posts}, null, 2));

const top = posts.slice(0, 30);
const lines = [
  `# SEO 콘텐츠 감사 (${LOCALE})`,
  '',
  `생성: ${new Date().toISOString()}`,
  '',
  '## 전체 통계',
  '',
  `- 총 포스트: **${totals.posts}**`,
  `- 평균 단어수: **${totals.avgWords}**`,
  `- 얇은 글 (<800단어): **${totals.thinPosts}**  (전체 ${Math.round((totals.thinPosts / totals.posts) * 100)}%)`,
  `- 매우 얇음 (<500단어): **${totals.veryThin}**`,
  `- 인바운드 링크 0개: **${totals.orphanIncoming}**`,
  `- 아웃바운드 링크 0개: **${totals.noOutgoing}**`,
  `- 카테고리 무효: **${totals.invalidCategory}**`,
  '',
  '## 카테고리별 분포',
  '',
  ...Object.entries(totals.byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `- \`${k}\`: ${v}`),
];

if (gscMatched) {
  lines.push('', '## GSC 매칭', '');
  lines.push(`- GSC export URL: **${gscMatched.total}**`);
  lines.push(`- 로컬 매칭됨: **${gscMatched.matched}**`);
  lines.push(`- 매칭 안 됨 (이미 삭제·이름변경): **${gscMatched.unmatched.length}**`);
  if (gscMatched.unmatched.length > 0) {
    lines.push('', '### 매칭 실패 URL (잠재 404 후보)', '');
    for (const u of gscMatched.unmatched.slice(0, 50)) lines.push(`- ${u}`);
  }
}

lines.push('', '## 위험도 상위 30개', '');
lines.push('| 순위 | 점수 | 카테고리 | 단어 | 인바운드 | 슬러그 | 이슈 |');
lines.push('|---|---|---|---|---|---|---|');
top.forEach((p, i) => {
  lines.push(
    `| ${i + 1} | ${p.riskScore} | ${p.category} | ${p.words} | ${p.incomingLinks.length} | \`${p.slug}\` | ${p.issues.join('; ')} |`
  );
});

lines.push('', '## 다음 스텝 가이드', '');
lines.push('1. **점수 8+ 글**은 색인 거부 후보. 800단어 미만이면 우선 보강.');
lines.push('2. **인바운드 0**인 글은 관련글 모듈/홈페이지/카테고리에서 도달 안 됨 → 같은 카테고리 글에 링크 추가.');
lines.push('3. **카테고리 무효** 글은 즉시 카테고리 수정 또는 카테고리 추가 (`/category/<x>` 404 발생).');
lines.push('4. GSC 색인 거부 리스트와 비교해 실제 원인 패턴 확인 후, 보강 우선순위 확정.');

fs.writeFileSync(path.join(OUT_DIR, 'report.md'), lines.join('\n'));
fs.writeFileSync(
  path.join(OUT_DIR, 'at-risk.txt'),
  posts.filter((p) => p.riskScore >= 8).map((p) => p.slug).join('\n')
);

console.log(`OK: ${OUT_DIR}/report.md`);
console.log(`    ${OUT_DIR}/audit.json`);
console.log(`    ${OUT_DIR}/at-risk.txt`);
console.log('');
console.log(`총 ${totals.posts}개 중 위험도 8+: ${posts.filter((p) => p.riskScore >= 8).length}개`);
console.log(`평균 ${totals.avgWords}어, 얇은 글 ${totals.thinPosts}개, 인바운드 0: ${totals.orphanIncoming}개`);
