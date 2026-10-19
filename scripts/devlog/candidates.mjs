#!/usr/bin/env node
// 오늘 개발일지의 후보 재료를 한 JSON 으로 낸다 — 앱마다 최근 커밋(파일 목록 포함)·바뀐 intent/ADR·
// 마지막 개발일지와 그 글이 이미 쓴 커밋. 글쓰기 에이전트는 이걸 읽고 앱 하나·주제 하나를 고른 뒤
// repo.mjs 로 실제 diff 와 문서를 파고든다. 여기 없는 숫자·사실은 글에 쓰지 않는다.
//
//   node scripts/devlog/candidates.mjs [--days 10] > .devlog/candidates.json
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { loadApps } from './apps.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const DEVLOG_DIR = path.join(ROOT, 'content/posts/ko/devlog');
const days = Number(process.argv[process.argv.indexOf('--days') + 1] || 10) || 10;

const kstToday = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const today = kstToday();

function git(repo, args) {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

// 이미 쓴 개발일지 — frontmatter 의 app·sources 로 "다룬 커밋" 을 안다.
const devlogs = fs.existsSync(DEVLOG_DIR)
  ? fs
      .readdirSync(DEVLOG_DIR)
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => {
        const { data } = matter(fs.readFileSync(path.join(DEVLOG_DIR, f), 'utf8'));
        return {
          slug: `devlog/${f.replace(/\.mdx$/, '')}`,
          date: String(data.date ?? ''),
          app: data.app ?? null,
          title: data.title ?? '',
          sources: Array.isArray(data.sources) ? data.sources.map(String) : [],
          noindex: data.noindex === true,
        };
      })
      .sort((a, b) => (a.date > b.date ? -1 : 1))
  : [];
const coveredSources = new Set(devlogs.flatMap((d) => d.sources));

function commitsOf(app) {
  // 레코드 구분자 \x1e, 필드 구분자 \x1f. --numstat 로 파일 목록을 같이 받는다.
  const raw = git(app.repo, [
    'log',
    `--since=${days} days ago`,
    '--date=short',
    '--numstat',
    `--format=%x1e%H%x1f%h%x1f%ad%x1f%s%x1f%P%x1f%b`,
    app.branch,
  ]);
  return raw
    .split('\x1e')
    .filter((r) => r.trim())
    .map((rec) => {
      const [head, ...statLines] = rec.split('\n');
      const [full, hash, date, subject, parents, body] = head.split('\x1f');
      const files = [];
      let ins = 0;
      let del = 0;
      for (const l of statLines) {
        const m = l.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
        if (!m) continue;
        if (m[1] !== '-') ins += Number(m[1]);
        if (m[2] !== '-') del += Number(m[2]);
        files.push(m[3]);
      }
      const prefix = (f) => f.split('/').slice(0, 2).join('/');
      const areas = [...new Set(files.map(prefix))].slice(0, 8);
      return {
        hash,
        date,
        subject,
        merge: (parents ?? '').trim().split(' ').length > 1,
        body: (body ?? '').trim().slice(0, 400),
        files: files.length,
        areas,
        topFiles: files.filter((f) => !/lock|\.png$|\.jpg$|\.pbxproj$/.test(f)).slice(0, 12),
        insertions: ins,
        deletions: del,
        covered: coveredSources.has(hash) || coveredSources.has(full),
      };
    });
}

function changedDocs(app, dirRel, kind) {
  const dir = path.join(app.repo, dirRel);
  if (!fs.existsSync(dir)) return [];
  const raw = git(app.repo, ['log', `--since=${days} days ago`, '--date=short', '--name-only', '--format=%x1e%ad', app.branch, '--', dirRel]);
  const byKey = new Map();
  for (const rec of raw.split('\x1e').filter(Boolean)) {
    const [date, ...files] = rec.trim().split('\n');
    for (const f of files.filter(Boolean)) {
      const rel = f.slice(dirRel.length + 1);
      const key = kind === 'intent' ? rel.split('/')[0] : rel;
      const cur = byKey.get(key) ?? { [kind === 'intent' ? 'slug' : 'file']: key, files: new Set(), lastDate: '0000' };
      cur.files.add(rel);
      if (date > cur.lastDate) cur.lastDate = date;
      byKey.set(key, cur);
    }
  }
  return [...byKey.values()].map((v) => ({ ...v, files: [...v.files] })).sort((a, b) => (a.lastDate > b.lastDate ? -1 : 1));
}

const apps = loadApps().map((app) => {
  const commits = commitsOf(app);
  const mine = devlogs.filter((d) => d.app === app.key);
  const last = mine[0] ?? null;
  const daysSince = last ? Math.round((Date.parse(today) - Date.parse(last.date)) / 864e5) : null;
  const headLine = git(app.repo, ['log', '-1', '--date=short', '--format=%h %ad %s', app.branch]).trim();
  return {
    key: app.key,
    name: app.name,
    ko: app.ko,
    status: app.status,
    released: app.released,
    platforms: app.platforms,
    oneLiner: app.oneLiner,
    productDoc: app.productDoc,
    hasIntentDir: fs.existsSync(path.join(app.repo, '.claude/intent')),
    hasAdrDir: fs.existsSync(path.join(app.repo, 'docs/adr')),
    head: headLine,
    commitCount: commits.length,
    uncoveredCount: commits.filter((c) => !c.covered && !c.merge).length,
    commits,
    intentsChanged: changedDocs(app, '.claude/intent', 'intent'),
    adrChanged: changedDocs(app, 'docs/adr', 'adr'),
    lastDevlog: last,
    daysSinceDevlog: daysSince,
    devlogCount: mine.length,
  };
});

// 권장 순서: 안 다룬 커밋이 있는 앱 중 개발일지를 가장 오래 안 쓴 앱부터. 한 번도 안 쓴 앱이 먼저.
const suggestedOrder = [...apps]
  .filter((a) => a.uncoveredCount > 0)
  .sort((a, b) => {
    const da = a.daysSinceDevlog ?? 9999;
    const db = b.daysSinceDevlog ?? 9999;
    if (da !== db) return db - da;
    return b.uncoveredCount - a.uncoveredCount;
  })
  .map((a) => a.key);

process.stdout.write(
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      today,
      windowDays: days,
      suggestedOrder,
      apps,
      recentDevlogs: devlogs.slice(0, 14),
      coveredSources: [...coveredSources],
    },
    null,
    2,
  ) + '\n',
);
