#!/usr/bin/env bash
#
# SEO 불변식 검증 — docs/SEO-INVARIANTS.md "검증" 절의 실행 가능한 형태.
#
# 사용법:
#   scripts/verify-invariants.sh <base-url>
#
#   scripts/verify-invariants.sh https://daily1bite.com          # Amplify 프로덕션(기준값)
#   scripts/verify-invariants.sh https://xxx.vercel.app          # Vercel preview
#   scripts/verify-invariants.sh http://localhost:3111           # 로컬 (npx next start -p 3111)
#
# 이 스크립트의 출력은 호스트 중립적이다. 서버 고유 헤더(date, server, x-amz-*,
# x-vercel-*, cf-*, alt-svc 등)는 전부 제외하므로, Amplify와 Vercel의 출력은
# 바이트 단위로 같아야 한다. 다르면 그 diff가 곧 이전 리스크다.
#
#   scripts/verify-invariants.sh https://daily1bite.com  > baseline-amplify.txt
#   scripts/verify-invariants.sh https://xxx.vercel.app  > candidate-vercel.txt
#   diff baseline-amplify.txt candidate-vercel.txt && echo "동등"
#
# 종료 코드는 항상 0이다. 판정은 diff가 한다 — 이 스크립트는 관측만 한다.

set -uo pipefail

BASE="${1:-}"
if [[ -z "$BASE" ]]; then
  echo "usage: $0 <base-url>" >&2
  exit 2
fi
BASE="${BASE%/}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 응답 URL을 기준값에 그대로 박으면 호스트가 달라질 때 전부 diff가 난다.
# 출력에서는 base를 <BASE>로 치환해 호스트 중립적으로 만든다.
neutralize() { sed "s|${BASE}|<BASE>|g"; }

# 상태줄 + Location 만.
#
# HTTP/2는 헤더 이름이 소문자, HTTP/1.1(로컬 next start)은 대문자로 온다.
# awk의 IGNORECASE는 gawk 전용이라 macOS 기본 awk에서 조용히 무시된다 —
# tolower()로 직접 정규화한다.
#
# location이 여러 줄 나오면 그대로 여러 줄 출력한다. 2026-08-03 Amplify 기준
# 308 응답에 location이 중복으로 실려 있는데, 이런 이상은 감추지 말고 diff에
# 드러나게 둔다.
head_of() {
  curl -sS -o /dev/null -D - --max-time 20 "$@" 2>/dev/null \
    | tr -d '\r' \
    | awk 'tolower($0) ~ /^http\//     {print "status: " $2; next}
           tolower($0) ~ /^location:/  {sub(/^[^:]*:[ ]*/,""); print "location: " $0}'
}

header_value() {
  local url="$1" name="$2"
  curl -sS -o /dev/null -D - --max-time 20 "$url" 2>/dev/null \
    | tr -d '\r' \
    | awk -v n="$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]')" \
        'tolower($0) ~ "^" n ":" {sub(/^[^:]*:[ ]*/,""); print}'
}

section() { printf '\n===== %s =====\n' "$1"; }

printf '# verify-invariants against <BASE>\n'

# ---------------------------------------------------------------------------
# I4 — 루트는 301로 /ko. I3 — Accept-Language를 줘도 목적지가 바뀌면 안 된다.
# ---------------------------------------------------------------------------
section "I4/I3  루트 리디렉션"
echo "--- / (기본) ---"
head_of "$BASE/" | neutralize
echo "--- / (Accept-Language: en-US) ---"
head_of -H 'Accept-Language: en-US,en;q=0.9' "$BASE/" | neutralize

# ---------------------------------------------------------------------------
# I4 — prefix 없는 레거시 경로는 301로 /ko/...
# ---------------------------------------------------------------------------
section "I4  레거시 경로 리디렉션"
for p in /blog /category /about /contact /stats /privacy-policy; do
  echo "--- $p ---"
  head_of "$BASE$p" | neutralize
done

# ---------------------------------------------------------------------------
# trailing slash 정규화 — Amplify/Vercel 기본값 차이가 드러나는 지점.
# ---------------------------------------------------------------------------
section "trailing slash"
for p in /ko/blog/ /ko/about/; do
  echo "--- $p ---"
  head_of "$BASE$p" | neutralize
done

# ---------------------------------------------------------------------------
# I3 — Link: hreflang 응답 헤더가 어떤 경로에도 없어야 한다.
# ---------------------------------------------------------------------------
section "I3  Link 헤더 부재"
for p in / /ko /ko/blog /ko/about; do
  v="$(header_value "$BASE$p" link | neutralize)"
  if [[ -z "$v" ]]; then
    echo "$p: (없음)"
  else
    echo "$p: 위반 → $v"
  fi
done

# ---------------------------------------------------------------------------
# I2/I5 — sitemap은 KO 단독, noindex 글 제외.
# ---------------------------------------------------------------------------
section "I2/I5  sitemap"
SITEMAP="$(curl -sS --max-time 30 "$BASE/sitemap.xml" 2>/dev/null)"
echo "총 <loc> 수:            $(grep -c '<loc>' <<<"$SITEMAP")"
echo "hreflang=\"en\" 수:      $(grep -c 'hreflang="en"' <<<"$SITEMAP")"
echo "/en URL 수:             $(grep -c "<loc>${BASE}/en" <<<"$SITEMAP")"
echo "/ko URL 수:             $(grep -c "<loc>${BASE}/ko" <<<"$SITEMAP")"
echo "hreflang 종류:"
grep -o 'hreflang="[^"]*"' <<<"$SITEMAP" | sort -u | sed 's/^/  /'

# ---------------------------------------------------------------------------
# robots.txt — 내용 전체를 기준값에 포함한다(호스트가 바뀌어도 같아야 한다).
# ---------------------------------------------------------------------------
section "robots.txt"
curl -sS --max-time 20 "$BASE/robots.txt" 2>/dev/null | neutralize

# ---------------------------------------------------------------------------
# next.config.ts headers() — 보안 5종 + 캐시 4종.
# ---------------------------------------------------------------------------
section "보안 헤더"
for h in x-frame-options x-content-type-options referrer-policy x-xss-protection permissions-policy; do
  printf '%-28s %s\n' "$h:" "$(header_value "$BASE/ko" "$h")"
done

section "캐시 헤더"
printf '%-28s %s\n' "/feed.xml:"    "$(header_value "$BASE/feed.xml" cache-control)"
printf '%-28s %s\n' "/atom.xml:"    "$(header_value "$BASE/atom.xml" cache-control)"
printf '%-28s %s\n' "/sitemap.xml:" "$(header_value "$BASE/sitemap.xml" cache-control)"
printf '%-28s %s\n' "/robots.txt:"  "$(header_value "$BASE/robots.txt" cache-control)"

# ---------------------------------------------------------------------------
# AASA — 확장자 없는 파일이라 MIME이 틀어지기 쉽다. route handler로 강제 중.
# Amplify 때문에 넣은 우회지만 Vercel에서도 동일하게 필요하다.
# ---------------------------------------------------------------------------
section "apple-app-site-association"
printf '%-28s %s\n' "status:"       "$(head_of "$BASE/.well-known/apple-app-site-association" | head -1 | cut -d' ' -f2)"
printf '%-28s %s\n' "content-type:" "$(header_value "$BASE/.well-known/apple-app-site-association" content-type)"

# ---------------------------------------------------------------------------
# I1 — EN 블로그는 308로 KO에 되돌린다. 리포의 EN 글에서 앞 3편을 뽑아 확인.
#
# 블로그는 [...slug] 캐치올이라 URL에 카테고리가 들어간다(/blog/<category>/<slug>).
# basename만 쓰면 404가 난다.
# ---------------------------------------------------------------------------
section "I1  EN → KO 리디렉션"
if [[ -d "$REPO_ROOT/content/posts/en" ]]; then
  while IFS= read -r path; do
    rel="${path#"$REPO_ROOT/content/posts/en/"}"
    echo "--- /en/blog/${rel%.mdx} ---"
    head_of "$BASE/en/blog/${rel%.mdx}" | neutralize
  done < <(find "$REPO_ROOT/content/posts/en" -name '*.mdx' | sort | head -3)
else
  echo "(content/posts/en 없음 — 건너뜀)"
fi

# ---------------------------------------------------------------------------
# 대표 글 200 + canonical. sitemap에서 뽑으므로 어느 호스트에서든 같은 3편이다.
# ---------------------------------------------------------------------------
section "대표 글 canonical"
while IFS= read -r url; do
  path="${url#"$BASE"}"
  echo "--- $path ---"
  head_of "$url" | neutralize
  curl -sS --max-time 20 "$url" 2>/dev/null \
    | grep -o '<link rel="canonical"[^>]*>' \
    | head -1 | neutralize | sed 's/^/canonical: /'
done < <(grep -o "<loc>${BASE}/ko/blog/[^<]*</loc>" <<<"$SITEMAP" \
         | sed 's|<loc>||; s|</loc>||' | sort | head -3)

printf '\n# end\n'
