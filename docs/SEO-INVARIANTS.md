# SEO 불변식 (SEO invariants)

이 문서는 daily1bite.com의 색인 관련 **계약**이다. 여기 적힌 것을 바꾸는 변경은
버그 수정이 아니라 정책 변경이며, 아래 "변경 동결" 절의 조건을 만족해야 한다.

## 왜 이 문서가 있는가

2026-04-14 GSC 색인이 122 → 0으로 붕괴했다. 방아쇠는 i18n(언어 라우팅) 개편이었다.
그 후 4/14 ~ 7/16 사이에 canonical·robots·noindex·hreflang·sitemap 정책이 **여섯 차례 이상**
바뀌었다. 각 변경은 개별적으로는 타당했지만, 합쳐서 두 가지 문제를 만들었다:

1. **서로 모순되는 신호가 동시에 존재했다.** 예: HTML `<link>`는 KO 단독 hreflang을 선언하는데,
   next-intl이 자동으로 붙이는 `Link:` 응답 헤더는 같은 페이지에서 EN(리디렉트됨)과
   x-default(prefix 없는 레거시 URL)를 선언하고 있었다. 3개월간 아무도 헤더를 보지 않았다.
2. **재평가가 계속 리셋됐다.** Google이 사이트 신뢰도를 재평가하는 데는 수 주가 걸린다.
   그 사이에 신호를 또 바꾸면 관찰 자체가 불가능해진다. 어떤 수정이 효과가 있었는지
   지금까지 아무도 모른다.

## 불변식

각 항목은 실측으로 검증 가능하다. 검증 명령은 아래 "검증" 절에 있다.

### I1. 색인 대상은 `/ko` 하나다
- 색인 가능한 URL은 `https://daily1bite.com/ko/...` 뿐이다.
- EN 섹션(`/en`, `/en/blog`, `/en/about`, ...)은 `noindex, follow`.
  EN 블로그 글은 KO 버전이 있으면 308로 KO에 되돌린다.
- **EN을 robots.txt로 차단하지 않는다.** 크롤을 막으면 Googlebot이 noindex/redirect 신호를
  볼 수 없어 "robots 차단" 노이즈만 늘어난다. 크롤 허용 + noindex가 정답이다.

### I2. hreflang 클러스터는 KO 단독이다
- `hreflang="en"`을 **어디에도** 내보내지 않는다: HTML `<link>`, sitemap `xhtml:link`, `Link:` 헤더 전부.
- 이유: hreflang은 색인 가능하고 상호 참조되는 URL만 가리켜야 한다. 리디렉트되거나
  noindex인 URL을 대체 언어 버전으로 선언하면 Google이 **클러스터 전체를 무효 처리**한다.
- `x-default`는 항상 대응하는 `/ko` URL이다. prefix 없는 URL을 가리키면 안 된다(4월 사고의 형태).

### I3. next-intl의 자동 SEO 기능은 꺼져 있다
`i18n/routing.ts`:
- `alternateLinks: false` — `Link:` hreflang 응답 헤더 비활성화. hreflang은 각 page의
  `metadata.alternates`와 `app/sitemap.ts`만 담당한다(단일 출처).
- `localeDetection: false` — Accept-Language/쿠키 기반 자동 로케일 전환 금지.
  켜면 `/`가 영어권 클라이언트에게 noindex인 `/en`으로 간다. Google도 언어 자동 리디렉션을
  권장하지 않는다.

### I4. 리디렉션은 전부 영구(301/308)다
- `/` → `/ko` : **301**. (next-intl에 맡기면 307이 나가고, 임시 리디렉션은 링크 신호를
  목적지로 넘기지 않는다. 외부 링크가 가장 많이 꽂히는 URL이라 손실이 크다.)
- prefix 없는 레거시 경로(`/blog`, `/category`, `/about`, ...) → `/ko/...` : **301** (`middleware.ts`)
- `/en/blog/<slug>` → `/ko/blog/<slug>` : **308** (`permanentRedirect`)

### I5. sitemap과 색인 상태는 항상 일치한다
- sitemap에는 `/ko` URL만, `noindex: true`가 아닌 글만 들어간다.
- noindex 글을 sitemap에 남기거나, 색인 대상 글을 sitemap에서 빼면 안 된다.

### I6. 발행일은 사후에 조작하지 않는다
- frontmatter `date`는 최초 발행일이며 **절대 소급 수정하지 않는다**.
- 내용을 갱신하면 `date`가 아니라 `updated`를 쓴다(`ArticleJsonLd.dateModified` + OG + sitemap `lastmod`에 배선됨).
- 배경: 2026-05-06에 백데이트 114건을 "git first-seen 날짜"로 교정했더니, 56편이 전부
  2026-03-29 하루로 몰렸다. freshness gaming을 없애려던 조치가 "런칭 하루 전 56편 동시 발행"
  이라는 더 나쁜 신호(scaled content abuse의 전형)를 만들었다. 날짜 일괄 수정은 항상 이렇게 끝난다.
- 같은 이유로 **재작성분을 한꺼번에 배포하지 않는다.** 주 2~3편.

### I7. 색인 대상 글은 가치 레이어를 2개 이상 갖는다
`/blog:draft` Step 0 게이트와 동일 기준. 충족 못 하면 `noindex: true`로 발행한다.
🧪 실행(실제 실행한 명령과 출력) / ⚖️ 비교 / 🧭 판단(언제 쓰지 말아야 하나) / 🔪 비판.
**실행하지 않은 것을 실행했다고 쓰지 않는다.** 지금 받고 있는 것이 신뢰 강등이다.

### I8. 제3자 스크립트를 전 페이지에 상주시키지 않는다
2026-07-16에 반려된 AdSense 로더를 제거했다(`761b3c7`). 승인 전 광고 스크립트가
전 페이지에 있으면 MFA(Made for Advertising) 신호 + 렌더 오버헤드만 남는다.

## 변경 동결

**2026-07-23부터 최소 6주간(~2026-09-03) 위 불변식을 바꾸지 않는다.**

- 이 기간에 하는 것: 콘텐츠 재작성(`.seo-audit/cluster-2026-03-29-rewrite.md`), GSC 관찰.
- 이 기간에 하지 않는 것: canonical/robots/noindex/hreflang/sitemap/리디렉션 정책 변경.
- 예외: 불변식을 **위반하는 상태**를 발견했을 때의 수정은 정책 변경이 아니므로 즉시 한다.
- 불변식 자체를 바꿔야 한다면, 바꾸기 전에 (a) 어떤 관찰이 그 변경을 정당화하는지,
  (b) 무엇을 보고 성패를 판단할지를 먼저 적는다.

관찰 지표(GSC): "크롤링됨 – 현재 색인되지 않음" 건수, 색인된 페이지 수, 노출수.
기준선(2026-07-23): 색인 0~1, 노출 0, 크롤링됨-미색인 185.

## 검증

프로덕션 빌드 후 로컬 서버로 전부 확인할 수 있다.

```bash
npm run build && npx next start -p 3111
```

```bash
# I4: 루트는 301로 /ko. Accept-Language를 줘도 목적지가 바뀌면 안 된다(I3).
curl -sI localhost:3111/ | grep -iE 'HTTP|location'
curl -sI -H 'Accept-Language: en-US,en;q=0.9' localhost:3111/ | grep -iE 'HTTP|location'

# I3: Link 헤더가 어떤 경로에도 없어야 한다.
curl -sI localhost:3111/ko | grep -i '^link' && echo "위반: Link 헤더가 살아있음"

# I2/I5: sitemap에 hreflang="en"이 0건, /en URL이 0건.
curl -s localhost:3111/sitemap.xml | grep -c 'hreflang="en"'
curl -s localhost:3111/sitemap.xml | grep -c '<loc>https://daily1bite.com/en'

# I2: 빌드된 HTML 전체에 EN/레거시 hreflang이 없어야 한다.
grep -rho 'hrefLang="[^"]*" href="[^"]*"' .next/server/app | sort -u
```

기대값(2026-07-23 기준): `/` → 301 `/ko` (두 경우 모두), Link 헤더 없음,
sitemap hreflang="en" 0건 / `/en` URL 0건 / 총 106 URL.

## 관련 이력

| 커밋 | 내용 |
|---|---|
| `5f96c76` | i18n 다국어 도입 — **색인 붕괴의 방아쇠** |
| `834af07` | canonical에 locale prefix 추가 (1차 수습) |
| `6cbec76` | 백데이트 114건 교정 — **I6의 반면교사** |
| `761b3c7` | AdSense 제거 · EN 섹션 noindex · html lang · 저자 issol 통일 |
| `9175d51` | `Link:` hreflang 헤더 제거 · localeDetection 해제 · 루트 301 · hreflang="en" 전면 제거 |
| `8355463` | 2026-03-29 클러스터 56편 → 색인 18편 |
