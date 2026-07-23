#!/usr/bin/env node
/**
 * last30days 플러그인의 GitHub 소스 복구 패치.
 *
 * 문제(2026-07-23 확인): GitHub가 /search/issues API에 이슈/PR 한정자를 요구하도록
 * 바꿨다. 쿼리에 `is:issue`나 `is:pull-request`가 없으면 HTTP 422로 거절한다.
 *   {"message":"Query must include 'is:issue' or 'is:pull-request'","status":"422"}
 * 플러그인 v3.18.0의 lib/github.py:search_github()는 `{core} created:>{date}`만 보내서
 * 모든 토픽 조회에서 GitHub 소스가 통째로 죽는다(우리 첫 실전 실행에서 0건).
 *
 * 수정: 쿼리에 `(is:issue OR is:pull-request)`를 붙이고 `advanced_search=true`를 같이 보낸다.
 * 둘 다 필요하다 —
 *   - 괄호 없이 OR만 쓰면 결합이 느슨해져 5억 건이 매칭된다
 *   - advanced_search 없이 괄호형만 쓰면 여전히 422다
 *
 * 이 패치는 플러그인 캐시 디렉터리(버전별)에 들어가므로 **플러그인을 업데이트하면 사라진다.**
 * 업데이트 후 GitHub 소스가 다시 0건이면 이 스크립트를 다시 돌리면 된다.
 * (marketplaces/ 사본은 Claude Code가 매 세션 origin/main으로 되돌리는 git clone이라
 *  건드리지 않는다. 업스트림에 고쳐지면 이 스크립트는 no-op이 된다.)
 *
 * 실행: node scripts/patch-last30days-github.mjs
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CACHE_ROOT = join(homedir(), '.claude/plugins/cache/last30days-skill/last30days');

const BUGGY = 'q = f"{core} created:>{from_date}"';
const FIXED = `q = f"{core} created:>{from_date} (is:issue OR is:pull-request)"`;
const PARAMS_ANCHOR = `    params = {\n        "q": q,\n`;
const PARAMS_FIXED = `    params = {\n        "q": q,\n        "advanced_search": "true",\n`;

function findGithubPy(root) {
  const out = [];
  if (!existsSync(root)) return out;
  for (const version of readdirSync(root)) {
    const p = join(root, version, 'skills/last30days/scripts/lib/github.py');
    if (existsSync(p) && statSync(p).isFile()) out.push(p);
  }
  return out;
}

const targets = findGithubPy(CACHE_ROOT);
if (targets.length === 0) {
  console.error(`대상을 못 찾음: ${CACHE_ROOT}/*/skills/last30days/scripts/lib/github.py`);
  console.error('플러그인이 설치돼 있는지 확인하세요: /plugin install last30days@last30days-skill');
  process.exit(1);
}

let patched = 0, already = 0, failed = 0;
for (const file of targets) {
  const src = readFileSync(file, 'utf8');

  if (src.includes('advanced_search')) {
    console.log(`이미 적용됨  ${file}`);
    already++;
    continue;
  }
  if (!src.includes(BUGGY) || !src.includes(PARAMS_ANCHOR)) {
    // 업스트림이 이 부분을 고쳤거나 구조가 바뀐 경우. 덮어쓰지 않는다.
    console.log(`건너뜀(구조 불일치 — 업스트림 수정 가능성)  ${file}`);
    failed++;
    continue;
  }

  const out = src.replace(BUGGY, FIXED).replace(PARAMS_ANCHOR, PARAMS_FIXED);
  writeFileSync(file, out);
  console.log(`패치함      ${file}`);
  patched++;
}

console.log(`\n패치 ${patched} · 기적용 ${already} · 건너뜀 ${failed}`);
console.log('검증: python3.12 <skill>/scripts/last30days.py "<토픽>" 실행 후 GitHub 항목 수 확인');
if (failed > 0 && patched === 0 && already === 0) process.exit(1);
