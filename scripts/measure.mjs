#!/usr/bin/env node
// 실측 하니스 — 블로그 파이프라인이 실제 LLM API를 호출해 진짜 수치·출력을
// 자동 삽입하기 위한 도구. "자동화가 만들 수 없던 유일한 것(1인칭 Experience)"을
// 파이프라인에 주입하는 경로(2026-04 색인 붕괴 회복 방침, 경로 2).
//
// 사용:
//   node scripts/measure.mjs --prompt "같은 질문" --models claude-opus-4-8,claude-sonnet-5
//   node scripts/measure.mjs --prompt "..." --models claude-opus-4-8 --max-tokens 400
//   node scripts/measure.mjs --mock --models claude-opus-4-8,claude-sonnet-5   # 네트워크/키 없이 포맷 검증
//   node scripts/measure.mjs ... --out /tmp/block.md   # 마크다운 블록을 파일로도 저장
//
// 요구: 실호출 시 환경변수 ANTHROPIC_API_KEY. 없으면 해당 모델은 건너뛰고 명시한다.
// 출력: 임베드 가능한 마크다운 블록(출처/일시 + 비교표 + 실제 출력 발췌) + JSON 사이드카.
//
// 정직성 규칙: 측정 못 한 값은 표에 넣지 않는다("측정 안 됨"으로 표기). 날조 금지.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// 모델별 단가 (USD / 1M 토큰) — claude-api 스킬 기준(2026-06). 표기 없는 모델은 null.
const PRICING = {
  'claude-fable-5': {in: 10, out: 50},
  'claude-opus-4-8': {in: 5, out: 25},
  'claude-opus-4-7': {in: 5, out: 25},
  'claude-opus-4-6': {in: 5, out: 25},
  'claude-sonnet-5': {in: 3, out: 15}, // 인트로 $2/$10 (~2026-08-31)까지; 보수적으로 표준가 사용
  'claude-sonnet-4-6': {in: 3, out: 15},
  'claude-haiku-4-5': {in: 1, out: 5},
};

function providerOf(model) {
  if (model.startsWith('claude-')) return 'anthropic';
  // 확장 지점: openai(gpt-*)·google(gemini-*)는 키/엔드포인트/가격이 확정되면 추가.
  return 'unknown';
}

function parseArgs(argv) {
  const a = {models: [], maxTokens: 400, mock: false, out: null, prompt: ''};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--prompt') a.prompt = argv[++i] || '';
    else if (k === '--models') a.models = (argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (k === '--max-tokens') a.maxTokens = parseInt(argv[++i] || '400', 10);
    else if (k === '--mock') a.mock = true;
    else if (k === '--out') a.out = argv[++i] || null;
  }
  return a;
}

function costUSD(model, inTok, outTok) {
  const p = PRICING[model];
  if (!p) return null;
  return (inTok / 1e6) * p.in + (outTok / 1e6) * p.out;
}

// Opus 4.8/4.7·Sonnet 5·Fable 5 규칙: temperature/top_p/top_k·budget_tokens 금지(400).
// thinking은 생략(모델별 기본 동작 차이는 있으나 어떤 모델에서도 400 안 남).
async function callAnthropic({model, prompt, maxTokens, mock}) {
  const started = Date.now();
  if (mock) {
    // 포맷·가격 로직 검증용 결정적 목업(네트워크/키 불필요).
    const inTok = 40 + prompt.length, outTok = 120;
    return {
      ok: true, model, latencyMs: 1234,
      inputTokens: inTok, outputTokens: outTok,
      cost: costUSD(model, inTok, outTok),
      text: `[MOCK] ${model} 응답 샘플입니다. (실호출 아님)`,
      stopReason: 'end_turn',
    };
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return {ok: false, model, error: 'ANTHROPIC_API_KEY 미설정 — 건너뜀'};

  let res;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {'x-api-key': key, 'anthropic-version': ANTHROPIC_VERSION, 'content-type': 'application/json'},
      body: JSON.stringify({model, max_tokens: maxTokens, messages: [{role: 'user', content: prompt}]}),
    });
  } catch (e) {
    return {ok: false, model, error: `네트워크 오류: ${e.message}`};
  }
  const latencyMs = Date.now() - started;
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json())?.error?.message || ''; } catch {}
    return {ok: false, model, error: `HTTP ${res.status} ${detail}`.trim(), latencyMs};
  }
  const data = await res.json();
  if (data.stop_reason === 'refusal') {
    return {ok: false, model, error: '모델이 요청을 거부(refusal)', latencyMs};
  }
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  const inputTokens = data.usage?.input_tokens ?? 0;
  const outputTokens = data.usage?.output_tokens ?? 0;
  return {
    ok: true, model, latencyMs, inputTokens, outputTokens,
    cost: costUSD(model, inputTokens, outputTokens),
    text, stopReason: data.stop_reason,
  };
}

async function measureOne(model, opts) {
  const provider = providerOf(model);
  if (provider === 'anthropic') return callAnthropic({model, ...opts});
  return {ok: false, model, error: `제공자 미지원(${provider}) — anthropic 모델만 실측 가능`};
}

function fmtMs(ms) { return ms == null ? '—' : `${(ms / 1000).toFixed(1)}s`; }
function fmtCost(c) { return c == null ? '—' : `$${c.toFixed(4)}`; }
function truncate(s, n) { return s.length <= n ? s : s.slice(0, n) + '…'; }

function renderMarkdown({prompt, dateISO, results, maxTokens}) {
  const okr = results.filter((r) => r.ok);
  const lines = [];
  lines.push('### 🧪 직접 실측 결과');
  lines.push('');
  lines.push(`> 측정: ${dateISO} · 동일 프롬프트로 실제 API 호출 · max_tokens=${maxTokens}`);
  lines.push(`> 프롬프트: \`${truncate(prompt.replace(/\n/g, ' '), 120)}\``);
  lines.push('');
  if (okr.length === 0) {
    lines.push('_실측 실패(아래 사유). 이 섹션은 발행 전 채워야 한다._');
    lines.push('');
  } else {
    lines.push('| 모델 | 지연시간 | 입력 토큰 | 출력 토큰 | 비용 |');
    lines.push('|---|---|---|---|---|');
    for (const r of okr) {
      lines.push(`| \`${r.model}\` | ${fmtMs(r.latencyMs)} | ${r.inputTokens} | ${r.outputTokens} | ${fmtCost(r.cost)} |`);
    }
    lines.push('');
    for (const r of okr) {
      lines.push(`**\`${r.model}\` 실제 출력(발췌):**`);
      lines.push('');
      lines.push('> ' + truncate(r.text.replace(/\n/g, '\n> '), 600));
      lines.push('');
    }
  }
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    lines.push('_측정 안 됨:_ ' + failed.map((r) => `\`${r.model}\`(${r.error})`).join(', '));
    lines.push('');
  }
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.models.length) {
    console.error('사용법: node scripts/measure.mjs --prompt "..." --models a,b [--max-tokens N] [--mock] [--out file.md]');
    process.exit(2);
  }
  if (!args.prompt && !args.mock) {
    console.error('오류: --prompt 필요(또는 --mock).');
    process.exit(2);
  }
  const dateISO = new Date().toISOString().slice(0, 10);
  const results = [];
  for (const m of args.models) {
    results.push(await measureOne(m, {prompt: args.prompt, maxTokens: args.maxTokens, mock: args.mock}));
  }
  const md = renderMarkdown({prompt: args.prompt || '(mock)', dateISO, results, maxTokens: args.maxTokens});
  process.stdout.write(md + '\n');
  if (args.out) {
    const fs = await import('fs');
    fs.writeFileSync(args.out, md + '\n');
    fs.writeFileSync(args.out.replace(/\.md$/, '') + '.json', JSON.stringify({dateISO, prompt: args.prompt, results}, null, 2));
    console.error(`\n저장: ${args.out} (+ .json)`);
  }
  // 실측이 하나도 성공 못 했으면 비정상 종료(파이프라인이 감지하도록).
  process.exit(results.some((r) => r.ok) ? 0 : 1);
}

main();
