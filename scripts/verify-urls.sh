#!/usr/bin/env bash
#
# 2단계 배포 전 검증 — scripts/expected-urls.tsv 에 대한 assert.
#
# 사용법:
#   scripts/verify-urls.sh https://<preview>.vercel.app
#
# 이 스크립트가 전부 통과해야 2단계를 배포한다. 2단계는 롤백이 싸지 않다
# (Google이 301을 크롤한 뒤 되돌리면 신호가 두 번 뒤집힌다). 배포 후 관찰이
# 아니라 배포 전 증명이 유일한 안전장치다. spec 2-4 참조.
#
# 종료 코드: 0 통과 / 1 위반 있음 / 2 검증 불가

set -uo pipefail

BASE="${1:-}"
if [[ -z "$BASE" ]]; then
  echo "usage: $0 <base-url>" >&2
  exit 2
fi
BASE="${BASE%/}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPECTED="$REPO_ROOT/scripts/expected-urls.tsv"

[[ -f "$EXPECTED" ]] || { echo "FATAL: $EXPECTED 없음. gen-expected-urls.sh 먼저 실행." >&2; exit 2; }
curl -sS -o /dev/null --max-time 20 "$BASE/" 2>/dev/null \
  || { echo "FATAL: $BASE 에 도달할 수 없다." >&2; exit 2; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# 한 URL의 (status, location)을 한 줄로. 리디렉션은 따라가지 않는다 — 홉 수를
# 직접 세야 하기 때문이다.
probe() {
  local url="$1"
  curl -sS -o /dev/null -D - --max-time 25 "$url" 2>/dev/null \
    | tr -d '\r' \
    | awk 'tolower($0) ~ /^http\//    {st=$2}
           tolower($0) ~ /^location:/ {sub(/^[^:]*:[ ]*/,""); if (loc=="") loc=$0}
           END {print st "\t" (loc=="" ? "-" : loc)}'
}
export -f probe
export BASE

# ---------------------------------------------------------------------------
# 1) 기대 매핑 대조
# ---------------------------------------------------------------------------
echo "== 기대 매핑 대조 =="
awk -F'\t' '!/^#/ && NF==3' "$EXPECTED" > "$WORK/rules.tsv"
TOTAL="$(wc -l < "$WORK/rules.tsv" | tr -d ' ')"
echo "규칙 $TOTAL 건 확인 중..."

# 396건 × 왕복이라 직렬로 하면 오래 걸린다. 순서는 정렬로 복원한다.
awk -F'\t' '{print $1}' "$WORK/rules.tsv" \
  | xargs -P 12 -I{} bash -c 'printf "%s\t%s\n" "{}" "$(probe "$BASE{}")"' \
  > "$WORK/actual.tsv"

sort -o "$WORK/rules.tsv"  "$WORK/rules.tsv"
sort -o "$WORK/actual.tsv" "$WORK/actual.tsv"

join -t $'\t' -j 1 "$WORK/rules.tsv" "$WORK/actual.tsv" \
  | awk -F'\t' '{
      path=$1; want_st=$2; want_loc=$3; got_st=$4; got_loc=$5
      # location 비교는 절대 URL로 와도 경로만 본다.
      sub(/^https?:\/\/[^\/]+/, "", got_loc)
      if (got_loc == "") got_loc = "-"
      if (want_st != got_st || (want_st == 301 && want_loc != got_loc))
        printf "  %s\n    기대: %s %s\n    실제: %s %s\n", path, want_st, want_loc, got_st, got_loc
    }' > "$WORK/mismatch.txt"

MISMATCH="$(grep -c '^  /' "$WORK/mismatch.txt" 2>/dev/null || echo 0)"
JOINED="$(wc -l < "$WORK/actual.tsv" | tr -d ' ')"

if [[ "$JOINED" != "$TOTAL" ]]; then
  echo "  ⚠ 응답 수집 $JOINED / 규칙 $TOTAL — 누락이 있다"
fi
if [[ "$MISMATCH" -gt 0 ]]; then
  echo "  ❌ 불일치 $MISMATCH 건:"
  head -60 "$WORK/mismatch.txt"
else
  echo "  ✅ $TOTAL 건 전부 일치"
fi

# ---------------------------------------------------------------------------
# 2) 리디렉션 홉 1회 — 301 목적지가 즉시 200이어야 한다. 체인·루프 금지.
# ---------------------------------------------------------------------------
echo
echo "== 리디렉션 홉 1회 =="
awk -F'\t' '$2==301 {print $3}' "$WORK/rules.tsv" | sort -u > "$WORK/targets.txt"
TARGETS="$(wc -l < "$WORK/targets.txt" | tr -d ' ')"

xargs -P 12 -I{} bash -c 'printf "%s\t%s\n" "{}" "$(probe "$BASE{}")"' \
  < "$WORK/targets.txt" > "$WORK/target-status.tsv"

CHAINED="$(awk -F'\t' '$2 != 200 {print "  " $1 " → " $2 " " $3}' "$WORK/target-status.tsv" | tee "$WORK/chained.txt" | wc -l | tr -d ' ')"
if [[ "$CHAINED" -gt 0 ]]; then
  echo "  ❌ 목적지가 200이 아닌 항목 $CHAINED 건 (체인 또는 루프):"
  head -30 "$WORK/chained.txt"
else
  echo "  ✅ 리디렉션 목적지 $TARGETS 건 전부 즉시 200"
fi

# ---------------------------------------------------------------------------
# 3) 404 0건 — 이전에 존재하던 어떤 URL도 사라지면 안 된다.
# ---------------------------------------------------------------------------
echo
echo "== 404 0건 =="
NOTFOUND="$(awk -F'\t' '$2==404 {print "  " $1}' "$WORK/actual.tsv" | tee "$WORK/404.txt" | wc -l | tr -d ' ')"
if [[ "$NOTFOUND" -gt 0 ]]; then
  echo "  ❌ 404 $NOTFOUND 건:"
  head -30 "$WORK/404.txt"
else
  echo "  ✅ 404 없음"
fi

# ---------------------------------------------------------------------------
# 4) sitemap — /ko·/en·hreflang 전부 0이어야 한다 (개정된 I1/I2).
# ---------------------------------------------------------------------------
echo
echo "== sitemap =="
SITEMAP="$(curl -sS --max-time 30 "$BASE/sitemap.xml" 2>/dev/null)"
SM_TOTAL="$(grep -c '<loc>' <<<"$SITEMAP")"
# 슬래시로 끝나지 않는 <loc>...(/ko)</loc> 형태도 잡아야 한다. '/ko/' 로만 세면
# 홈(<loc>https://.../ko</loc>) 하나를 놓친다 — 2026-08-03에 107 vs 108로 드러났다.
SM_KO="$(grep -cE "<loc>[^<]*/ko(/[^<]*)?</loc>" <<<"$SITEMAP")"
SM_EN="$(grep -cE "<loc>[^<]*/en(/[^<]*)?</loc>" <<<"$SITEMAP")"
SM_HREF="$(grep -c 'hreflang=' <<<"$SITEMAP")"
BASELINE_TOTAL=108   # 2026-08-03 Amplify 기준값

printf '  총 <loc>:      %s (기준값 %s)\n' "$SM_TOTAL" "$BASELINE_TOTAL"
printf '  /ko URL:       %s (기대 0)\n' "$SM_KO"
printf '  /en URL:       %s (기대 0)\n' "$SM_EN"
printf '  hreflang:      %s (기대 0 — 단일 언어)\n' "$SM_HREF"

SM_FAIL=0
[[ "$SM_KO"   -eq 0 ]] || SM_FAIL=1
[[ "$SM_EN"   -eq 0 ]] || SM_FAIL=1
[[ "$SM_HREF" -eq 0 ]] || SM_FAIL=1
if [[ "$SM_TOTAL" -ne "$BASELINE_TOTAL" ]]; then
  echo "  ⚠ URL 수가 기준값과 다르다. 글이 추가/삭제됐다면 정상이나, 확인이 필요하다."
fi
[[ "$SM_FAIL" -eq 0 ]] && echo "  ✅ sitemap 정상" || echo "  ❌ sitemap 위반"

# ---------------------------------------------------------------------------
# 5) 헤더 유지 — 이전과 무관하게 계속 나와야 한다.
# ---------------------------------------------------------------------------
echo
echo "== 헤더 =="
HDRS="$(curl -sS -o /dev/null -D - --max-time 20 "$BASE/" 2>/dev/null | tr -d '\r' | tr 'A-Z' 'a-z')"
HDR_FAIL=0
for h in x-frame-options x-content-type-options referrer-policy x-xss-protection permissions-policy; do
  if grep -q "^${h}:" <<<"$HDRS"; then echo "  ✅ $h"; else echo "  ❌ $h 없음"; HDR_FAIL=1; fi
done
if grep -q '^link:' <<<"$HDRS"; then echo "  ❌ Link 헤더가 살아있음"; HDR_FAIL=1; else echo "  ✅ Link 헤더 없음"; fi

# ---------------------------------------------------------------------------
echo
if [[ "$MISMATCH" -eq 0 && "$CHAINED" -eq 0 && "$NOTFOUND" -eq 0 && "$SM_FAIL" -eq 0 && "$HDR_FAIL" -eq 0 && "$JOINED" == "$TOTAL" ]]; then
  echo "✅ 전부 통과 — 2단계 배포 가능"
  exit 0
fi
echo "❌ 위반 있음 — 배포 중단"
exit 1
