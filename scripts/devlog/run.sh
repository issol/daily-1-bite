#!/bin/bash
# 매일 한 편 개발일지 — 후보 수집 → headless Claude Code 가 레포를 탐색해 글 작성 → 검증 → 커밋 → main 푸시(Vercel 자동 배포).
#   scripts/devlog/run.sh               # 전부 (launchd/dispatch 가 매일 저녁 호출)
#   scripts/devlog/run.sh --no-push     # 커밋까지만
#   scripts/devlog/run.sh --no-commit   # 파일만 남긴다(검토용)
# 종료 코드: 0 성공·이미 있음 / 1 작성·검증 실패(파일은 .devlog/failed/ 로) / 3 전제 미충족(카테고리·설정 없음)
set -uo pipefail
cd "$(dirname "$0")/../.."
export PATH="$HOME/.nvm/versions/node/v22.15.1/bin:$HOME/.local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export TZ=Asia/Seoul

NO_PUSH=0; NO_COMMIT=0
for a in "$@"; do case "$a" in --no-push) NO_PUSH=1;; --no-commit) NO_COMMIT=1; NO_PUSH=1;; esac; done

W=.devlog; mkdir -p "$W/failed"; LOG="$W/run.log"
TODAY=$(date +%F)
POSTS=content/posts/ko/devlog
log(){ echo "[$(date '+%F %T')] $*" | tee -a "$LOG"; }
alert(){ [ -x "$HOME/issol-threads/scripts/alert.sh" ] && bash "$HOME/issol-threads/scripts/alert.sh" "블로그 개발일지" "$1" >/dev/null 2>&1 || true; }
fail(){ log "실패: $1"; alert "$1"; exit 1; }

log "=== 시작 ($TODAY) $*"
grep -q "'devlog'" lib/categories.ts || { log "lib/categories.ts 에 devlog 가 없다 — PR 미머지?"; alert "devlog 카테고리가 main 에 없다"; exit 3; }
[ -f "${DEVLOG_APPS_FILE:-$HOME/issol-threads/config/apps.json}" ] || { log "apps.json 없음"; alert "apps.json 이 없다"; exit 3; }
[ -d node_modules ] || { log "npm ci"; npm ci --no-audit --no-fund >>"$LOG" 2>&1 || fail "npm ci 실패"; }
mkdir -p "$POSTS"

if ls "$POSTS/$TODAY"-*.mdx >/dev/null 2>&1; then log "오늘 글이 이미 있다: $(ls "$POSTS/$TODAY"-*.mdx)"; exit 0; fi

# 글쓰기 전 상태 — 끝나고 이 파일들 밖의 변경이 있으면 실패 처리한다.
BEFORE=$(git status --porcelain --untracked-files=all -- content app lib components scripts .claude | sort)

node scripts/devlog/candidates.mjs --days 10 > "$W/candidates.json" || fail "candidates.mjs 실패"
log "후보: $(node -e 'const c=require("./.devlog/candidates.json");console.log(c.suggestedOrder.join(" > ")||"(없음)")')"

PROMPT="$(cat scripts/devlog/PROMPT.md)

## 오늘
$TODAY (KST). 후보 파일은 \`.devlog/candidates.json\`. 지금 시각 $(date '+%H:%M')."
claude -p "$PROMPT" --permission-mode acceptEdits --max-turns 150 --no-session-persistence \
  --allowedTools "Read" "Glob" "Grep" "Write" "Edit" \
    "Bash(node scripts/devlog/repo.mjs:*)" "Bash(node scripts/devlog/verify-post.mjs:*)" \
  >> "$LOG" 2>&1
log "claude 종료 코드 $?"

FILES=$(ls "$POSTS/$TODAY"-*.mdx 2>/dev/null)
N=$(echo "$FILES" | grep -c . || true)
[ "$N" -eq 1 ] || { for f in $FILES; do mv "$f" "$W/failed/"; done; fail "오늘 글이 ${N}개 (1개여야 한다)"; }
FILE="$FILES"

AFTER=$(git status --porcelain --untracked-files=all -- content app lib components scripts .claude | sort)
EXTRA=$(comm -13 <(echo "$BEFORE") <(echo "$AFTER") | grep -v "$FILE" || true)
[ -z "$EXTRA" ] || { mv "$FILE" "$W/failed/"; git checkout -- $(echo "$EXTRA" | awk '{print $2}') 2>/dev/null; fail "글 밖의 변경이 있다: $EXTRA"; }

node scripts/devlog/verify-post.mjs "$FILE" >>"$LOG" 2>&1 || { mv "$FILE" "$W/failed/"; fail "검증 실패 ($FILE → $W/failed/)"; }
TITLE=$(node -e 'const m=require("gray-matter");const d=m.read(process.argv[1]).data;console.log(`${d.app} — ${d.title}`)' "$FILE")
log "작성: $FILE ($TITLE)"
[ "$NO_COMMIT" -eq 1 ] && { log "--no-commit: 파일만 남긴다"; exit 0; }

git add "$FILE" || fail "git add 실패"
git commit -q -m "devlog: $TITLE" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" || fail "커밋 실패"
log "커밋: $(git log -1 --format=%h)"
[ "$NO_PUSH" -eq 1 ] && { log "--no-push: 푸시 생략"; exit 0; }

BR=$(git branch --show-current)
[ "$BR" = "main" ] || fail "main 이 아닌 브랜치($BR)에서는 푸시하지 않는다"
git pull -q --rebase origin main >>"$LOG" 2>&1 || fail "pull --rebase 실패"
git push -q origin main >>"$LOG" 2>&1 || fail "push 실패"
log "푸시 완료 — Vercel 이 배포한다: https://daily1bite.com/blog/${FILE#content/posts/ko/}"
log "=== 끝"
