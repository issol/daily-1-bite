#!/usr/bin/env node
// 개발일지 한 편을 발행 전에 검사한다. 실패하면 1 로 끝나고 이유를 전부 찍는다.
//   node scripts/devlog/verify-post.mjs content/posts/ko/devlog/2026-10-19-dayseed-xxx.mdx [--today 2026-10-19]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { compile, nodeTypes } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { loadApps } from './apps.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const file = process.argv[2];
const todayArg = process.argv.indexOf('--today');
const today = todayArg > 0 ? process.argv[todayArg + 1] : new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
if (!file) {
  console.error('파일 경로가 필요하다');
  process.exit(2);
}

const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

const abs = path.resolve(file);
const rel = path.relative(ROOT, abs);
const apps = loadApps();
const keys = apps.map((a) => a.key);

if (!rel.startsWith('content/posts/ko/devlog/')) err(`경로가 content/posts/ko/devlog/ 아래가 아니다: ${rel}`);
const base = path.basename(abs);
const fm = base.match(new RegExp(`^(\\d{4}-\\d{2}-\\d{2})-(${keys.join('|')})-[a-z0-9]+(?:-[a-z0-9]+)*\\.mdx$`));
if (!fm) err(`파일 이름 형식: <YYYY-MM-DD>-<앱key>-<영문-슬러그>.mdx 이어야 한다 (받은 것: ${base})`);

let data = {};
let content = '';
try {
  ({ data, content } = matter(fs.readFileSync(abs, 'utf8')));
} catch (e) {
  err(`frontmatter 파싱 실패: ${e.message}`);
}

// --- frontmatter
const date = String(data.date ?? '');
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) err(`date 는 "YYYY-MM-DD" 문자열이어야 한다: ${JSON.stringify(data.date)}`);
if (date !== today) err(`date(${date}) 가 오늘(${today}) 이 아니다 — 소급·선행 발행 금지 (I6)`);
if (fm && fm[1] !== date) err(`파일 이름의 날짜(${fm[1]}) 와 date(${date}) 가 다르다`);
if (data.category !== 'devlog') err(`category 는 'devlog' 여야 한다: ${data.category}`);
if (!keys.includes(data.app)) err(`app 은 ${keys.join('|')} 중 하나여야 한다: ${data.app}`);
if (fm && fm[2] !== data.app) err(`파일 이름의 앱(${fm[2]}) 과 app(${data.app}) 이 다르다`);
const app = apps.find((a) => a.key === data.app);
const title = String(data.title ?? '');
if (title.length < 12 || title.length > 80) err(`title 길이 12~80자: ${title.length}자`);
if (/\[\d{4}(-\d{2})?\]/.test(title)) err('제목에 [2026] 같은 연도 꼬리표를 붙이지 않는다');
const desc = String(data.description ?? '');
if (desc.length < 60 || desc.length > 200) err(`description 길이 60~200자: ${desc.length}자`);
if (!Array.isArray(data.tags) || data.tags.length < 3 || data.tags.length > 8) err('tags 는 3~8개 배열');
else if (app && !data.tags.includes(app.name)) err(`tags 에 앱 이름 "${app.name}" 이 있어야 한다`);
if (typeof data.noindex !== 'boolean') err('noindex 는 true/false 를 명시한다 (I7 게이트 판정 결과)');
if (data.updated !== undefined) err('새 글에 updated 를 넣지 않는다');
if (data.thumbnail !== undefined) warn('thumbnail 은 실제 화면 캡처 URL 일 때만 넣는다');

// --- sources: 커밋 해시 또는 레포 상대 경로. 전부 실재해야 한다.
const sources = Array.isArray(data.sources) ? data.sources.map(String) : [];
if (sources.length < 1) err('sources 에 근거 커밋 해시를 1개 이상 적는다');
let hashCount = 0;
if (app) {
  for (const s of sources) {
    if (/^[0-9a-f]{7,40}$/i.test(s)) {
      hashCount++;
      try {
        execFileSync('git', ['-C', app.repo, 'cat-file', '-e', `${s}^{commit}`], { stdio: 'ignore' });
      } catch {
        err(`sources 의 커밋이 ${app.name} 레포에 없다: ${s}`);
      }
    } else if (!fs.existsSync(path.join(app.repo, s))) err(`sources 의 파일이 레포에 없다: ${s}`);
  }
}
if (sources.length && hashCount === 0) err('sources 에 커밋 해시가 최소 1개 있어야 한다');

// --- 본문
const body = content.trim();
const noCode = body.replace(/```[\s\S]*?```/g, '');
if (noCode.length < 1200) err(`본문(코드 제외) 1,200자 이상: ${noCode.length}자`);
if (body.length > 14000) err(`본문 14,000자 이하: ${body.length}자`);
const h2 = (body.match(/^## /gm) || []).length;
if (h2 < 2) err(`## 소제목 2개 이상: ${h2}개`);
if (/^# /m.test(body)) err('본문에 # (h1) 을 쓰지 않는다 — 제목은 frontmatter');
const codeBlocks = (body.match(/```/g) || []).length / 2;
if (codeBlocks > 6) warn(`코드 블록이 ${codeBlocks}개 — 글이 diff 덤프가 되지 않게`);

const forbidden = [
  [/\/Users\/[A-Za-z]/, '절대 경로(/Users/…)'],
  [/\/home\/[A-Za-z]/, '절대 경로(/home/…)'],
  [/sk-[A-Za-z0-9]{12,}/, 'API 키처럼 보이는 문자열'],
  [/AKIA[0-9A-Z]{16}/, 'AWS 키'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY/, '개인키'],
  [/eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{10,}/, 'JWT'],
  [/service_role/, 'Supabase service_role 언급'],
  [/\.supabase\.co/, 'Supabase 프로젝트 URL'],
  [/\b01[016789]-?\d{3,4}-?\d{4}\b/, '전화번호'],
];
for (const [re, label] of forbidden) if (re.test(body)) err(`본문에 ${label} 이 있다: ${body.match(re)[0].slice(0, 30)}…`);

const claims = [
  [/다운로드\s*(수|횟수)|설치\s*수|사용자\s*수|이용자\s*수|\bDAU\b|\bMAU\b|매출|수익이/, '다운로드·사용자·매출 숫자는 재료에 없다 — 근거가 커밋·문서에 있을 때만'],
  [/혁명적|최고의|반드시|압도적/, '과장 표현'],
];
for (const [re, label] of claims) if (re.test(body)) warn(`${label}: "${body.match(re)[0]}"`);

// --- MDX 컴파일 (사이트와 같은 플러그인)
try {
  await compile(content, { remarkPlugins: [remarkGfm], rehypePlugins: [[rehypeRaw, { passThrough: nodeTypes }]], format: 'mdx' });
} catch (e) {
  err(`MDX 컴파일 실패: ${e.message}`);
}

for (const w of warns) console.log(`경고: ${w}`);
if (errors.length) {
  for (const e of errors) console.log(`오류: ${e}`);
  console.log(`\n${errors.length}개 오류 — 고친 뒤 다시 돌린다.`);
  process.exit(1);
}
console.log(`통과: ${rel} (${app?.name}, ${date}, noindex=${data.noindex}, 본문 ${noCode.length}자, 근거 ${sources.length}개)`);
