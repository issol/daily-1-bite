#!/usr/bin/env node
// 글쓰기 에이전트가 각 앱 레포를 읽기 전용으로 탐색하는 창구. 절대 경로를 숨기고(출력의 레포 루트는 <repo>),
// git 의 읽기 명령만 허용하며, 비밀값이 들어 있을 파일은 열지 않는다.
//
//   node scripts/devlog/repo.mjs <app> log [--since=10d] [-n 50] [--stat] [--grep=단어] [-- 경로]
//   node scripts/devlog/repo.mjs <app> show <hash> [--stat] [-- 경로]      # diff 전체(큰 파일은 잘린다)
//   node scripts/devlog/repo.mjs <app> diff <a> <b> [--stat] [-- 경로]
//   node scripts/devlog/repo.mjs <app> ls [하위경로]
//   node scripts/devlog/repo.mjs <app> cat <경로> [--from N] [--to M]
//   node scripts/devlog/repo.mjs <app> grep <패턴> [경로]
//   node scripts/devlog/repo.mjs <app> intent [슬러그]                     # .claude/intent 목록 / 한 건의 intent·spec·plan
//   node scripts/devlog/repo.mjs <app> adr [번호]                          # docs/adr 목록 / 한 건
//   node scripts/devlog/repo.mjs <app> product                             # docs/current-product.md
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { appByKey } from './apps.mjs';

const MAX_LINES = 600;
const MAX_BYTES = 60_000;
const SECRET_FILE = /(^|\/)(\.env[^/]*|.*\.(pem|p8|p12|keystore|jks|mobileprovision)|.*(secret|credential|private[-_]?key)[^/]*|GoogleService-Info\.plist|google-services\.json|service-account[^/]*\.json)$/i;
const SECRET_LINE = /(api[_-]?key|secret|token|password|private[_-]?key|service_role|client_secret|access[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9_\-./+]{12,}/i;
const SKIP_DIR = /(^|\/)(node_modules|\.git|\.expo|ios\/Pods|android\/build|build|dist|\.next|Generated)(\/|$)/;

const [, , appKey, cmd, ...rest] = process.argv;
if (!appKey || !cmd) {
  console.error('사용법은 파일 머리의 주석을 본다.');
  process.exit(2);
}
const app = appByKey(appKey);
const ROOT = fs.realpathSync(app.repo);

function out(text) {
  let s = String(text).split(ROOT).join('<repo>').split(process.env.HOME ?? '~~').join('~');
  s = s
    .split('\n')
    .map((l) => (SECRET_LINE.test(l) ? l.replace(/([:=]\s*['"]?)[A-Za-z0-9_\-./+]{12,}/, '$1[가려짐]') : l))
    .join('\n');
  const lines = s.split('\n');
  if (lines.length > MAX_LINES || Buffer.byteLength(s) > MAX_BYTES) {
    let acc = '';
    let n = 0;
    for (const l of lines) {
      if (n >= MAX_LINES || Buffer.byteLength(acc) + l.length > MAX_BYTES) break;
      acc += l + '\n';
      n++;
    }
    s = acc + `\n… (잘림: 전체 ${lines.length}줄. 경로를 지정해 좁혀서 다시 본다)`;
  }
  process.stdout.write(s.endsWith('\n') ? s : s + '\n');
}

function git(args) {
  try {
    return execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    const msg = (e.stderr || e.message || '').toString();
    throw new Error(`git ${args[0]} 실패: ${msg.split(ROOT).join('<repo>').trim()}`);
  }
}

function inside(rel) {
  const abs = path.resolve(ROOT, rel || '.');
  const real = fs.existsSync(abs) ? fs.realpathSync(abs) : abs;
  if (real !== ROOT && !real.startsWith(ROOT + path.sep)) throw new Error('레포 밖 경로는 열지 않는다');
  return abs;
}

function assertHash(h) {
  if (!/^[0-9a-f]{6,40}$/i.test(h)) throw new Error(`커밋 해시가 아니다: ${h}`);
  git(['cat-file', '-e', `${h}^{commit}`]);
  return h;
}

// --flag / --flag=value / -n 50 와 "-- 경로" 를 나눈다. 허용 목록 밖의 플래그는 거부한다.
function parse(args, allowed) {
  const opts = {};
  const paths = [];
  const pos = [];
  let i = 0;
  while (i < args.length) {
    const a = args[i];
    if (a === '--') {
      paths.push(...args.slice(i + 1));
      break;
    }
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split(/=(.*)/s);
      if (!allowed.includes(k)) throw new Error(`허용하지 않는 옵션: --${k}`);
      if (v !== undefined) opts[k] = v;
      else if (args[i + 1] !== undefined && !args[i + 1].startsWith('-')) opts[k] = args[++i];
      else opts[k] = true;
    } else if (a === '-n') {
      if (!allowed.includes('n')) throw new Error('허용하지 않는 옵션: -n');
      opts.n = args[++i];
    } else if (a.startsWith('-') && a.length > 1) {
      throw new Error(`허용하지 않는 옵션: ${a}`);
    } else pos.push(a);
    i++;
  }
  for (const p of paths) inside(p);
  return { opts, paths, pos };
}

const FORMAT = '--format=%h %ad %an%n    %s%n%b';

try {
  switch (cmd) {
    case 'log': {
      const { opts, paths } = parse(rest, ['since', 'until', 'n', 'stat', 'grep', 'author', 'merges', 'no-merges']);
      const args = ['log', '--date=short', FORMAT, `-n${Math.min(Number(opts.n) || 40, 200)}`];
      if (opts.since) args.push(`--since=${opts.since}`);
      if (opts.until) args.push(`--until=${opts.until}`);
      if (opts.grep) args.push(`--grep=${opts.grep}`, '-i');
      if (opts.author) args.push(`--author=${opts.author}`);
      if (opts.stat) args.push('--stat=120');
      if (opts.merges) args.push('--merges');
      if (opts['no-merges']) args.push('--no-merges');
      if (paths.length) args.push('--', ...paths);
      out(git(args));
      break;
    }
    case 'show': {
      const { opts, paths, pos } = parse(rest, ['stat']);
      const h = assertHash(pos[0] ?? '');
      const args = ['show', '--date=short', FORMAT, h];
      if (opts.stat) args.push('--stat=120');
      else args.push('--patch', '--no-color', '-U3');
      if (paths.length) args.push('--', ...paths);
      let text = git(args);
      // 잠금 파일·바이너리·생성물 diff 는 글 재료가 아니다 — 통째로 뺀다.
      text = text.replace(/^diff --git a\/(.*?(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Podfile\.lock|\.png|\.jpg|\.svg|\.pbxproj|\.snap))[\s\S]*?(?=^diff --git |\Z)/gm, (m, f) => `diff --git a/${f} (생략)\n`);
      out(text);
      break;
    }
    case 'diff': {
      const { opts, paths, pos } = parse(rest, ['stat']);
      const a = assertHash(pos[0] ?? '');
      const b = assertHash(pos[1] ?? '');
      const args = ['diff', '--no-color', opts.stat ? '--stat=120' : '-U3', a, b];
      if (paths.length) args.push('--', ...paths);
      out(git(args));
      break;
    }
    case 'ls': {
      const { pos } = parse(rest, []);
      const base = inside(pos[0] ?? '.');
      const rel = path.relative(ROOT, base) || '.';
      const lines = [];
      const walk = (dir, depth) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((x, y) => x.name.localeCompare(y.name))) {
          const r = path.relative(ROOT, path.join(dir, e.name));
          if (SKIP_DIR.test(r + (e.isDirectory() ? '/' : ''))) continue;
          lines.push(e.isDirectory() ? `${r}/` : r);
          if (e.isDirectory() && depth < 2) walk(path.join(dir, e.name), depth + 1);
        }
      };
      walk(base, 0);
      out(`${rel}\n` + lines.join('\n'));
      break;
    }
    case 'cat': {
      const { opts, pos } = parse(rest, ['from', 'to']);
      const file = inside(pos[0] ?? '');
      const rel = path.relative(ROOT, file);
      if (SECRET_FILE.test(rel)) throw new Error('비밀값이 들어 있을 파일은 열지 않는다');
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) throw new Error(`파일이 없다: ${rel}`);
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      const from = Math.max(1, Number(opts.from) || 1);
      const to = Math.min(lines.length, Number(opts.to) || from + MAX_LINES - 1);
      out(`${rel} (${lines.length}줄, ${from}-${to})\n` + lines.slice(from - 1, to).map((l, i) => `${String(from + i).padStart(4)}  ${l}`).join('\n'));
      break;
    }
    case 'grep': {
      const { pos } = parse(rest, []);
      if (!pos[0]) throw new Error('패턴이 필요하다');
      const args = ['grep', '-n', '-I', '--max-depth=-1', '-e', pos[0], '--'];
      args.push(pos[1] ? path.relative(ROOT, inside(pos[1])) || '.' : '.');
      let text = '';
      try {
        text = git(args);
      } catch {
        text = '(없음)';
      }
      out(text.split('\n').filter((l) => !SKIP_DIR.test(l.split(':')[0] ?? '')).join('\n'));
      break;
    }
    case 'intent': {
      const { pos } = parse(rest, []);
      const dir = path.join(ROOT, '.claude/intent');
      if (!fs.existsSync(dir)) throw new Error('.claude/intent 가 없는 레포다');
      if (!pos[0]) {
        const rows = fs
          .readdirSync(dir, { withFileTypes: true })
          .filter((e) => e.isDirectory())
          .map((e) => {
            const files = fs.readdirSync(path.join(dir, e.name)).filter((f) => f.endsWith('.md'));
            const last = Math.max(...files.map((f) => fs.statSync(path.join(dir, e.name, f)).mtimeMs), 0);
            return { slug: e.name, files, last };
          })
          .sort((a, b) => b.last - a.last);
        out(rows.map((r) => `${new Date(r.last).toISOString().slice(0, 10)}  ${r.slug}  (${r.files.join(', ')})`).join('\n'));
      } else {
        const d = inside(path.join('.claude/intent', pos[0]));
        if (!fs.existsSync(d)) throw new Error(`없는 intent: ${pos[0]}`);
        const parts = [];
        for (const f of ['intent.md', 'spec.md', 'plan.md']) {
          const p = path.join(d, f);
          if (fs.existsSync(p)) parts.push(`===== .claude/intent/${pos[0]}/${f} =====\n` + fs.readFileSync(p, 'utf8'));
        }
        out(parts.join('\n\n'));
      }
      break;
    }
    case 'adr': {
      const { pos } = parse(rest, []);
      const dir = path.join(ROOT, 'docs/adr');
      if (!fs.existsSync(dir)) throw new Error('docs/adr 가 없는 레포다');
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
      if (!pos[0]) out(files.join('\n'));
      else {
        const f = files.find((x) => x.startsWith(String(pos[0]).padStart(4, '0')) || x === pos[0]);
        if (!f) throw new Error(`없는 ADR: ${pos[0]}`);
        out(`===== docs/adr/${f} =====\n` + fs.readFileSync(path.join(dir, f), 'utf8'));
      }
      break;
    }
    case 'product': {
      const p = inside(app.productDoc);
      if (!fs.existsSync(p)) throw new Error(`제품 문서가 없다: ${app.productDoc}`);
      out(`===== ${app.productDoc} =====\n` + fs.readFileSync(p, 'utf8'));
      break;
    }
    default:
      throw new Error(`모르는 명령: ${cmd}`);
  }
} catch (e) {
  console.error(String(e.message || e).split(ROOT).join('<repo>'));
  process.exit(1);
}
