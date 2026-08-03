#!/usr/bin/env bash
#
# 2단계(/ko → 루트) 기대 매핑 생성 — 구현보다 먼저 실행한다.
#
# 사용법:
#   scripts/gen-expected-urls.sh https://daily1bite.com > scripts/expected-urls.tsv
#
# 현행(=/ko 구조) 프로덕션의 sitemap과 리포의 콘텐츠에서 "이전 대상 URL 전체"를
# 뽑아, 이전 후 각 URL이 무엇을 돌려줘야 하는지 선언한다. 이 파일이 2단계의
# 계약이며, verify-urls.sh는 이 표에 대한 assert일 뿐이다.
#
# 구현 전에 만들어 커밋하는 것이 핵심이다. 구현 후에 만들면 "구현이 한 대로"를
# 기대값이라고 적게 되고, 검증이 자기 자신을 증명하는 동어반복이 된다.
#
# 출력 형식 (TSV, 3열):
#   <경로>	<기대 status>	<기대 location | ->

set -euo pipefail

BASE="${1:-}"
if [[ -z "$BASE" ]]; then
  echo "usage: $0 <base-url>" >&2
  exit 2
fi
BASE="${BASE%/}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! curl -sS -o /dev/null --max-time 20 "$BASE/ko" 2>/dev/null; then
  echo "FATAL: $BASE 에 도달할 수 없다." >&2
  exit 2
fi

RAW="$(mktemp)"
trap 'rm -f "$RAW"' EXIT

# 같은 경로가 여러 규칙에서 나올 수 있다(예: /blog 는 sitemap에서도, 정적 목록에서도).
# 동일한 선언이면 중복 제거하면 되지만, 같은 경로에 서로 다른 기대값이 붙으면
# 그건 설계 모순이다. 조용히 하나를 고르면 검증이 거짓말을 하게 되므로 터뜨린다.
emit() { printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$RAW"; }

flush() {
  local dupes
  dupes="$(sort -u "$RAW" | cut -f1 | sort | uniq -d)"
  if [[ -n "$dupes" ]]; then
    {
      echo "FATAL: 같은 경로에 서로 다른 기대값이 선언됐다:"
      while IFS= read -r p; do
        [[ -z "$p" ]] && continue
        echo "  $p"
        awk -F'\t' -v p="$p" '$1==p {print "    → status=" $2 " location=" $3}' "$RAW" | sort -u
      done <<<"$dupes"
    } >&2
    exit 1
  fi
  sort -u "$RAW"
}

echo "# 2단계 기대 매핑 — /ko 제거 후"
echo "# 생성: gen-expected-urls.sh $BASE"
echo "# 열: 경로 / 기대 status / 기대 location"
echo "#"
echo "# 규칙:"
echo "#   - 기존 /ko/X 는 301 로 /X 를 가리킨다"
echo "#   - 기존 /en/X 는 301 로 /X 를 가리킨다"
echo "#   - prefix 없는 /X 는 이제 정답 URL이므로 200 이다"
echo "#   - 리디렉션 홉은 1회다. location 목적지가 다시 리디렉션되면 위반이다"

SITEMAP="$(curl -sS --max-time 30 "$BASE/sitemap.xml")"

# sitemap의 /ko URL 전체 → 경로만 남긴다. '/ko' 자체는 빈 문자열이 되므로 '/'로.
while IFS= read -r loc; do
  ko_path="${loc#"$BASE"}"          # /ko/blog/x  또는  /ko
  new_path="${ko_path#/ko}"          # /blog/x     또는  (빈 문자열)
  new_path="${new_path:-/}"          # 빈 문자열 → /

  emit "$ko_path"  301 "$new_path"   # 구 URL은 영구 리디렉션
  emit "$new_path" 200 "-"           # 신 URL은 본문
done < <(grep -o "<loc>${BASE}/ko[^<]*</loc>" <<<"$SITEMAP" \
         | sed 's|<loc>||; s|</loc>||' | sort -u)

# sitemap에 없는 경로들 — noindex 글, EN, 그리고 색인 대상이 아닌 정적 페이지.
# 색인 대상이 아니어도 "이전에 존재하던 URL이 404가 되지 않을 것"은 지켜야 한다.

# noindex KO 글 (sitemap에서 제외되지만 URL은 살아 있다)
if [[ -d "$REPO_ROOT/content/posts/ko" ]]; then
  while IFS= read -r path; do
    rel="${path#"$REPO_ROOT/content/posts/ko/"}"
    slug="/blog/${rel%.mdx}"
    grep -q "<loc>${BASE}/ko${slug}</loc>" <<<"$SITEMAP" && continue  # 이미 위에서 처리
    emit "/ko${slug}" 301 "$slug"
    emit "$slug"      200 "-"
  done < <(find "$REPO_ROOT/content/posts/ko" -name '*.mdx' | sort)
fi

# EN 글 — 전부 KO 대응본이 있다(고유 글 0편). 루트로 직행한다.
if [[ -d "$REPO_ROOT/content/posts/en" ]]; then
  while IFS= read -r path; do
    rel="${path#"$REPO_ROOT/content/posts/en/"}"
    emit "/en/blog/${rel%.mdx}" 301 "/blog/${rel%.mdx}"
  done < <(find "$REPO_ROOT/content/posts/en" -name '*.mdx' | sort)
fi

# 정적/섹션 경로. /stats 는 sitemap에 없지만 실재하는 페이지다.
#
# /category 는 일부러 뺐다. middleware.ts의 oldRoutes에는 들어 있지만
# app/[locale]/category/ 에는 [category]/page.tsx 만 있고 인덱스 페이지가 없어서
# 현재 프로덕션에서 /category → 301 → /ko/category → 404 다. 이전과 무관한
# 기존 결함이며(2026-08-03 확인), 여기서 200을 기대하면 검증이 거짓말을 한다.
for p in "" /blog /about /contact /stats /privacy-policy; do
  emit "/ko${p}" 301 "${p:-/}"
  emit "/en${p}" 301 "${p:-/}"
  emit "${p:-/}" 200 "-"
done

# 카테고리 — sitemap에 있는 것 외에 누락이 없도록 lib/categories 기준으로도 채운다.
while IFS= read -r cat; do
  emit "/ko/category/${cat}" 301 "/category/${cat}"
  emit "/category/${cat}"    200 "-"
done < <(grep -o "<loc>${BASE}/ko/category/[^<]*</loc>" <<<"$SITEMAP" \
         | sed "s|<loc>${BASE}/ko/category/||; s|</loc>||" | sort -u)

flush
