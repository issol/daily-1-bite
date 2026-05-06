#!/usr/bin/env node
// 백데이트 frontmatter 자동 수정
// 사이트 launch 이전 날짜로 표기된 글의 date를 git first-seen 날짜로 교정
//
// 사용:
//   node scripts/fix-backdate.mjs --dry-run     (변경 미리보기만)
//   node scripts/fix-backdate.mjs               (실제 수정)
//
// 보호장치:
//   - frontmatter 외 본문은 절대 건드리지 않음
//   - 수정 전 스냅샷은 git이 자동으로 가짐 (commit 안 했을 때만 위험)
//   - SITE_LAUNCH 이후 날짜는 건드리지 않음

import fs from 'node:fs';
import path from 'node:path';
import {execSync} from 'node:child_process';

const ROOT = process.cwd();
const SITE_LAUNCH = '2026-03-31'; // 첫 git 커밋
const DRY_RUN = process.argv.includes('--dry-run');
const POSTS_DIRS = ['content/posts/ko', 'content/posts/en'];

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(mdx?|md)$/.test(e.name)) out.push(p);
  }
  return out;
}

function gitFirstSeen(file) {
  try {
    const out = execSync(`git log --reverse --format=%aI -- "${file}"`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.split('\n')[0]?.slice(0, 10) || null;
  } catch {
    return null;
  }
}

const changes = [];
let scanned = 0;

for (const dir of POSTS_DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    scanned++;
    const raw = fs.readFileSync(file, 'utf8');
    const fmMatch = raw.match(/^(---\n[\s\S]*?\n---)/);
    if (!fmMatch) continue;

    const dateMatch = fmMatch[1].match(/\ndate:\s*["']?(\d{4}-\d{2}-\d{2})["']?/);
    if (!dateMatch) continue;
    const fmDate = dateMatch[1];

    if (fmDate >= SITE_LAUNCH) continue; // 정상 — 건드리지 않음

    const gitDate = gitFirstSeen(file);
    if (!gitDate) {
      console.warn(`SKIP (git history 없음): ${path.relative(ROOT, file)}`);
      continue;
    }

    const newDate = gitDate;
    const newFm = fmMatch[1].replace(
      /(\ndate:\s*["']?)(\d{4}-\d{2}-\d{2})(["']?)/,
      `$1${newDate}$3`
    );
    const newRaw = newFm + raw.slice(fmMatch[1].length);

    changes.push({
      file: path.relative(ROOT, file),
      from: fmDate,
      to: newDate,
      diffDays: Math.round((new Date(newDate) - new Date(fmDate)) / 86400000),
    });

    if (!DRY_RUN) {
      fs.writeFileSync(file, newRaw);
    }
  }
}

console.log(`스캔: ${scanned}개`);
console.log(`백데이트 ${changes.length}개${DRY_RUN ? ' (dry-run)' : ' 수정 완료'}`);
console.log('');
for (const c of changes) {
  console.log(`  ${c.from} → ${c.to}  (+${c.diffDays}일)  ${c.file}`);
}
if (DRY_RUN) {
  console.log('\n실제 수정하려면 --dry-run 빼고 다시 실행');
}
