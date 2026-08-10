# Amplify → Vercel 이전 + i18n 제거 설계

- 작성일: 2026-08-03
- 상태: 승인됨
- 관련 문서: `docs/SEO-INVARIANTS.md`

## 배경

daily1bite.com은 현재 AWS Amplify(SSR/WEB_COMPUTE)에 배포되어 있고 월 $20~50이
청구된다. Vercel로 옮기면 Hobby 플랜에서 $0가 된다. 이전의 동기는 비용이다.

동시에 i18n(next-intl) 스택을 제거한다. 실측 근거:

| 항목 | 값 |
|---|---|
| KO 글 | 140편 (noindex 43편 → 색인 대상 ~97편) |
| EN 글 | 83편 |
| **KO에 없는 EN 고유 글** | **0편** |
| next-intl 접점 파일 | 14개 |
| `lib/*.ts`의 locale 참조 | 0건 |

EN에는 고유 콘텐츠가 하나도 없고, EN 전체가 이미 `noindex`다(I1). 즉 Google 입장에서
EN 섹션은 이미 존재하지 않는다. i18n 제거의 **색인 이득은 0에 가깝다.** 실질적 변화는
`/ko/*` → `/*` URL 이전 하나뿐이며, 이는 4월 이전 URL 구조로의 복귀다.

## 리스크 공시

이 설계는 `docs/SEO-INVARIANTS.md`의 변경 동결(2026-07-23 ~ 2026-09-03)을 **의도적으로
조기 종료한다.** 동결 11일차 시점의 결정이며, 다음을 감수한다:

1. 7/23 이후 축적된 관찰이 폐기된다.
2. 4개월 만에 세 번째 URL 구조 변경이 된다
   (`/blog/x` → `/ko/blog/x` → `/blog/x`).
3. **2단계는 롤백이 싸지 않다.** Google이 301을 크롤한 뒤 되돌리면 신호가 두 번
   뒤집혀 되돌리는 쪽이 더 나쁘다.

이 리스크는 사용자에게 고지되었고 승인되었다. 대응은 롤백 계획이 아니라
**배포 전 전량 검증**이다(2-4절).

## 원칙

**단계를 섞지 않는다.** 호스팅 이전과 코드 변경을 한 배포에 넣으면, GSC 지표가
나빠졌을 때 원인을 구분할 수 없다. 나누는 이유는 신중함이 아니라 관측 가능성이다.

| 단계 | 내용 | 시점 | 롤백 |
|---|---|---|---|
| 1 | Amplify → Vercel, 응답 바이트 동등 | 지금 | DNS 되돌리기, 5분 |
| 2 | i18n 제거 + `/ko` → 루트 | 1단계 +3~7일 | 없음(전진만) |

## 1단계: Amplify → Vercel

### 1-1. 검증 스크립트 (이전보다 먼저)

`scripts/verify-invariants.sh <base-url>` — `docs/SEO-INVARIANTS.md`의 "검증" 절을
실행 가능한 형태로 옮긴다. 대상 URL을 인자로 받아 로컬 / Amplify 프로덕션 /
Vercel preview / Vercel 프로덕션 어디서든 같은 것을 돌린다.

점검 항목:

- `/` → 301 `/ko` (`Accept-Language: en-US` 포함 2회 — I3/I4)
- 레거시 6경로(`/blog`, `/category`, `/about`, `/contact`, `/stats`,
  `/privacy-policy`) → 301 `/ko/...`
- `/en/blog/<slug>` → 308 `/ko/blog/<slug>`
- `Link:` 헤더 부재 (I3)
- sitemap: `hreflang="en"` 0건, `/en` URL 0건, 총 URL 수
- 보안 헤더 5종 + 캐시 헤더 4종
- `/.well-known/apple-app-site-association` → `Content-Type: application/json`
- `/ko/blog/` → 308 `/ko/blog`
- 대표 글 3편 200 + canonical이 `https://daily1bite.com/ko/...`

**Amplify 프로덕션 출력이 기준값이고, Vercel 출력과의 diff가 0이어야 넘어간다.**
이것이 이 설계에서 "동등성"의 정의다. 기준값은 `scripts/baseline-amplify.txt`로
커밋한다(2026-08-03 채취, sitemap 108 URL).

스크립트는 결정론적이어야 한다 — 같은 호스트에 두 번 돌려 diff가 0임을 확인했다.
그렇지 않으면 호스트 간 diff에 의미가 없다.

#### 허용된 diff

동등성의 예외는 미리 적어둔다. 나중에 diff를 보고 즉흥적으로 판단하면 검증이
무의미해진다.

| 항목 | 기준값(Amplify) | Vercel에서 허용 | 근거 |
|---|---|---|---|
| 308 응답의 `location` 헤더 | **2개 중복**(값 동일) | 1개 | ① |
| `/feed.xml`·`/atom.xml`의 `stale-while-revalidate` | 있음 | **없음** | ② |

**① 중복 `location`** — 실측(2026-08-03): 같은 URL에 대해 로컬 `next start`는
`location`을 1개, Amplify 프로덕션은 2개 내보낸다. 즉 앱이 아니라 **Amplify CDN
계층이 중복시키고 있다.** RFC상 `Location`은 단일 값이므로 Vercel에서 1개가 되는
것이 정상이다. → Vercel에서 1개 확인, 예측대로.

**② feed/atom의 `stale-while-revalidate` 소멸** — 사전에 예측하지 못한 차이이므로
규명 후 사후 등재한다.

- `/sitemap.xml`·`/robots.txt`는 Vercel에서도 `stale-while-revalidate`를 **유지**한다.
  `/feed.xml`·`/atom.xml`만 잃는다.
- 차이는 정적(`○`) 대 동적 route handler(`ƒ`)다. feed 쪽 응답에만 `vary: rsc, ...`가
  붙는다. `max-age=3600`은 `next.config.ts`의 값 그대로이므로 `headers()` 설정 자체는
  적용되고 있다.
- `age: 118` 이 붙어 나오므로 **CDN 캐싱은 정상 동작 중**이다. Vercel이 함수 응답의
  `stale-while-revalidate`를 자기 엣지 재검증에 소비하고 클라이언트 헤더에서 제외하는
  동작으로 보인다.
- **판정: 허용.** 색인 신호가 아니다(RSS 캐시 지시자는 크롤·랭킹에 쓰이지 않는다).
  영향은 브라우저/피드 리더가 백그라운드 재검증을 하지 않는 것뿐이고, CDN 계층의
  stale 서빙은 유지된다.

그 외의 모든 diff는 **회귀로 간주하고 컷오버를 중단한다.**

#### 검증 스크립트가 호스트에 결합돼 있었다 (2026-08-03 수정)

Vercel 대조를 처음 돌렸을 때 diff 5건 중 3건이 실제 차이가 아니라 **스크립트 결함**
이었다. sitemap 검사와 대표 글 canonical 검사가 `<loc>${BASE}/...` 처럼 요청 호스트를
패턴에 박아 넣고 있었다. Amplify에서는 요청 호스트와 사이트 정규 도메인이 같아
드러나지 않았지만, Vercel preview에서는 달라진다:

- sitemap `/ko`·`/en` 카운트가 전부 0으로 나왔다. `/en` 0건은 **위반 없음처럼 보인다** —
  위양성이다.
- 대표 글 canonical 검사는 매칭이 0건이 되어 **아무 글도 검사하지 않고 조용히 통과**했다.
  이 이전에서 가장 중요한 항목이 실행되지 않았다.

`exit 0` 만 봤다면 통과로 오인했을 것이다. 기준값 diff가 아니었으면 잡히지 않았다.
수정: 호스트 패턴을 `[^<]*` 로 열고, sitemap `<loc>`에서 경로만 뽑아 `$BASE` 로 요청한다.
요청 호스트와 사이트 도메인을 **같은 토큰 `<SITE>`** 로 접어 비교 가능하게 만들었다.
대표 글이 0건이면 조용히 넘어가지 않고 위반으로 출력한다.

교훈: 검증 스크립트는 **통과 케이스와 실패 케이스를 모두** 실측해야 한다. 이 결함은
"기준 호스트가 아닌 곳에서 처음 돌릴 때"만 드러난다.

### 1-2. Vercel 프로젝트 설정

- Framework preset 자동 감지(Next.js), 빌드·출력 설정 전부 기본값.
  `amplify.yml`의 `baseDirectory: .next` 같은 설정은 불필요하다.
- **Node 22 고정.** ⚠️ **Vercel은 `.nvmrc`를 읽지 않는다**(그건 Amplify/Netlify 방식).
  프로젝트 기본값이 24.x로 잡혔었다. `package.json`의 `engines.node: "22.x"` 로 고정한다 —
  대시보드 토글보다 낫다(버전 관리되고 프로젝트를 다시 만들어도 살아남는다).
  Amplify가 22였으므로 런타임 메이저가 다르면 "호스트만 바꾼다"는 전제가 깨진다.
- Function region **`icn1`(서울)**. 현재 CloudFront가 `ICN53` POP에서 나가고 있어
  지연 회귀를 막는다.
- 환경변수 (Production + Preview 양쪽):

  | 이름 | 값 | 비고 |
  |---|---|---|
  | `NEXT_PUBLIC_BASE_URL` | `https://daily1bite.com` | **Preview에도 동일 값** |
  | `GA_PROPERTY_ID` | (Amplify에서 복사) | |
  | `GA_CLIENT_EMAIL` | (Amplify에서 복사) | |
  | `GA_PRIVATE_KEY` | (Amplify에서 복사) | Sensitive. 아래 주의 |
  | `PRERENDER_RECENT_COUNT` | (Amplify에서 복사) | 미설정 시 기본 80 |

- `NEXT_PUBLIC_BASE_URL`을 Preview에서도 프로덕션 값으로 두는 이유: preview 도메인을
  가리키면 canonical·sitemap이 전부 달라져 diff 검증이 무의미해진다.
- `GA_PRIVATE_KEY` 주의: `lib/analytics.ts:12`가 `.replace(/\\n/g, '\n')`을 수행하므로
  **리터럴 `\n` 문자열이 든 형태 그대로** 넣어야 한다. 실제 개행으로 변환해 넣으면
  깨진다. Amplify 콘솔에 저장된 형태를 그대로 복사한다.

### 1-3. 도메인 / DNS

현재: DNS는 Cloudflare(프록시 OFF, DNS-only), apex/www 모두 CloudFront를 가리킨다.
**`www.daily1bite.com`은 리디렉트 없이 200으로 사이트를 그대로 서빙한다**(중복 호스트).

- Vercel에 apex + www 둘 다 추가하되, **Vercel이 제안하는 www → apex 리디렉트는
  거절한다.** 없던 301을 새로 만드는 것은 신호 변경이다. www 중복 호스트는 실재하는
  부채이나 이번 범위 밖이며, 2단계 완료 후 별건으로 다룬다.
- Cloudflare 프록시는 **계속 OFF(DNS-only)** 유지. 켜면 CF 캐시가 Vercel 캐시 위에
  얹혀 ISR 동작과 응답 헤더가 흐려진다.

컷오버 순서:

1. Cloudflare에서 apex/www TTL을 300s로 내리고 **최소 1시간 대기**
2. Vercel 도메인 소유 검증(TXT) — DNS 스위치 전에 미리 완료
3. 레코드 교체. 값은 Vercel 대시보드가 지시하는 최신 값을 사용한다
   (문서에 IP를 박아두지 않는다 — 바뀐다)
4. 전파 확인 후 프로덕션에서 검증 스크립트 재실행 → 기준값과 diff 0
5. TTL 원복

### 1-3-1. 실행 기록 (2026-08-03 완료)

- Vercel 프로젝트 `issols-projects/daily-1-bite`, 리전 `icn1` 확인
- 도메인 apex + www 연결. **`redirect: null` 을 API로 실측 확인** — www에 없던 301이
  생기지 않았다
- Cloudflare: apex/www 를 CloudFront에서 Vercel로 교체. 프록시 OFF 유지.
  `google-site-verification` TXT와 ACM 검증 CNAME은 보존
- 컷오버 후 검증: `verify-invariants.sh` diff = **허용 diff 7조각만**, 그 외 회귀 0
- GA4(`/ko/stats`) 정상, 대표 페이지 7종 200

#### ⚠️ 함정: 인증서가 자동 발급되지 않았다

DNS 전환 직후 **apex·www 모두 HTTPS가 `SSL_ERROR_SYSCALL` 로 죽었다.** HTTP(80)는
정상 응답(301 → `/ko`)했으므로 DNS와 라우팅은 맞았고, 인증서만 없었다.

- `vercel certs ls` 에 해당 도메인 인증서가 **아예 없었다**
- 도메인 config API는 `misconfigured: false`, `acceptedChallenges: ["http-01"]` 로
  정상이라고 보고했다. 즉 "설정은 맞는데 발급이 시작되지 않은" 상태였다
- 해결: `vercel certs issue daily1bite.com www.daily1bite.com` — 12초 만에 발급

**다음에 도메인을 옮길 때는 DNS 전환 직후 `vercel certs ls` 로 인증서 존재를 먼저
확인한다.** 기다리면 자동으로 되겠거니 하고 방치하면 그동안 사이트가 HTTPS로
열리지 않는다.

#### 검증 실행 중 일시적 요청 실패

인증서 발급 직후 첫 검증에서 `/about` 한 건의 출력이 통째로 빠져 diff가 9조각으로
나왔다. 5회 재시도 결과 5/5 정상(301 → `/ko/about`)이었고, 엣지 워밍 중의 일시적
실패였다. 재실행으로 7조각(허용 diff만)을 확인했다.

교훈: 스크립트는 요청이 실패해도 그 URL의 출력만 비고 넘어간다. **기준값 diff 방식이
이걸 잡아냈다** — 통과/실패 판정만 봤다면 놓쳤을 것이다.

### 1-4. 롤백

Amplify 앱은 **2주간 그대로 둔다**(삭제·연결 해제 금지). 롤백은 Cloudflare 레코드
되돌리기 = 5분.

롤백 트리거: 검증 diff 발생 / 5xx / GSC 커버리지 급변.

### 1-5. 정리 (2단계 완료 후)

- Amplify 앱 삭제, `amplify.yml` 제거
- `next.config.ts`의 AASA rewrite는 **유지**한다. 확장자 없는 파일의 MIME 문제는
  Vercel에서도 동일하다. 주석의 Amplify 언급만 갱신한다.
- `docs/SEO-INVARIANTS.md` 관련 이력 표에 "호스팅 이전(날짜·커밋)" 추가. 나중에
  지표가 흔들렸을 때 원인 후보로 남기기 위함이다.

### 1-6. 비용

Hobby(무료)로 시작 → Amplify $20~50이 즉시 $0.

AdSense 재도전 시 Pro($20/mo)로 업그레이드한다. Vercel Hobby는 약관상 상업적 사용을
금지하므로, **광고 삽입 커밋과 Pro 업그레이드는 같은 날 수행한다.**

## 2단계: i18n 제거 + `/ko` → 루트

1단계 안정 확인 후 3~7일 경과 시점에 착수한다.

### 2-0. 기대 매핑을 구현보다 먼저 확정한다

현행 프로덕션 sitemap과 레거시 경로를 긁어 `기존 URL → 기대 상태/목적지` 표를
**구현 전에** 생성하고 커밋한다(`scripts/expected-urls.tsv`, 생성기는
`scripts/gen-expected-urls.sh`). 이것이 2단계의 계약이며 검증은 이 표에 대한 assert다.

> ⚠️ **배포 직전에 재생성한다.** 커밋된 `expected-urls.tsv`는 2026-08-03 스냅샷이다
> (sitemap 108 URL → 규칙 393건). 주 2~3편 발행 중이므로 며칠만 지나도 신규 글이
> 매핑에서 빠지고, 빠진 URL은 검증에서 아예 확인되지 않는다. 그러면 "통과"가
> 아무것도 보장하지 않게 된다.
>
> ```bash
> scripts/gen-expected-urls.sh https://daily1bite.com > scripts/expected-urls.tsv
> ```
>
> 재생성 후 규칙 수가 393보다 **늘었는지** 확인한다. 줄었다면 무언가 잘못된 것이다.

| 기존 | 현재 | 이후 |
|---|---|---|
| `/` | 301 → `/ko` | **200** |
| `/blog/<slug>` | 301 → `/ko/blog/<slug>` | **200** |
| `/ko` | 200 | **301 → `/`** |
| `/ko/blog/<slug>` | 200 | **301 → `/blog/<slug>`** |
| `/en` | 200 (noindex) | 301 → `/` |
| `/en/blog/<slug>` | 308 → `/ko/blog/<slug>` | 301 → `/blog/<slug>` |

### 2-1. 라우팅 뒤집기

- `app/[locale]/**` → `app/**`로 이동한다. `app/[locale]/layout.tsx`는 기존 루트
  `app/layout.tsx`에 병합한다: `metadataBase`·폰트·`GoogleAnalytics`·`lang="ko"`는
  루트 것을 유지하고, `NextIntlClientProvider`는 제거, Header/Footer만 승계한다.
- `app/[locale]/not-found.tsx` → `app/not-found.tsx`
- `app/[locale]/i/[token]/opengraph-image.tsx` → `app/i/[token]/opengraph-image.tsx`.
  이 파일과 `app/opengraph-image.tsx`는 `runtime = 'edge'`다. Vercel 네이티브라
  이전 자체는 문제없으나, 이동 후 OG 이미지가 실제로 렌더되는지 확인한다
  (빌드 경고: "Using edge runtime on a page currently disables static generation").
- **`middleware.ts`를 삭제한다.** 리디렉션은 `next.config.ts`의 `redirects()`로
  이관한다. Vercel에서 config 리디렉션은 함수 호출 전 엣지에서 처리되므로 더 빠르고
  비용이 0이며, 미들웨어가 사라지면 전 요청의 미들웨어 실행 비용도 함께 사라진다.
- 리디렉션 규칙: `/ko` → `/`, `/ko/:path*` → `/:path*`, `/en` → `/`,
  `/en/:path*` → `/:path*`
- **`permanent: true`는 308을 낸다.** I4가 명시적으로 301을 택했으므로
  `statusCode: 301`을 쓴다.
- **원자적 교체 필수.** 레거시 301(`/blog` → `/ko/blog`)과 신규 301
  (`/ko/blog` → `/blog`)이 한순간이라도 공존하면 무한 리디렉션 루프다.
  같은 커밋에서 전환한다.

### 2-2. 메타데이터 / 사이트맵 / 피드

- `app/sitemap.ts`: URL에서 `/ko` 제거 + **`alternates.languages` 블록 전면 삭제.**
  단일 언어에서 `x-default` 단독 선언은 의미가 없다.
- 각 페이지 `generateMetadata`: `alternates.canonical`을 루트 URL로, `languages` 삭제
- `app/robots.ts`: EN 관련 규칙·주석 정리. `disallow: ['/api/', '/_next/']`는 유지
- `app/feed.xml/route.ts`, `app/atom.xml/route.ts`, `app/llms.txt/route.ts`,
  `components/JsonLd.tsx`, `lib/author.ts`: URL 생성부에서 `/ko` 제거

### 2-3. 삭제 대상

- `i18n/` 디렉터리 전체 (`routing.ts`, `request.ts`, `navigation.ts`)
- `messages/`
- `components/LanguageSwitcher.tsx` 및 Header/Footer의 언어 전환 UI
- `content/posts/en/**` 83편
- `next-intl` 의존성 (`package.json`, `next.config.ts`의 `createNextIntlPlugin`)
- `middleware.ts`

### 2-4. 배포 전 전량 검증

2단계의 유일한 안전장치다. Vercel preview에서 `scripts/verify-urls.sh`를 돌려
전부 통과해야 배포한다.

- 2-0의 기대 매핑 전 항목 일치 (97편 + 정적·카테고리 페이지)
- **리디렉션 홉 1회** — 모든 301의 목적지가 즉시 200. 체인 0, 루프 0
- **404 0건** — 이전에 존재하던 어떤 URL도 404가 되지 않는다
- sitemap URL 수가 이전과 동일, `hreflang` 0건, `/ko` 0건, `/en` 0건
- 보안·캐시 헤더 9종 유지, `Link:` 헤더 부재
- `npm run build` 성공, 타입·lint 통과

### 2-5. 불변식 문서 개정 (구현과 같은 커밋)

`docs/SEO-INVARIANTS.md`는 자기 개정 절차를 스스로 규정한다 — *"불변식 자체를 바꿔야
한다면, 바꾸기 전에 (a) 어떤 관찰이 그 변경을 정당화하는지, (b) 무엇을 보고 성패를
판단할지를 먼저 적는다."* 그대로 따른다.

개정 내용:

- **I1** 재작성: 색인 대상은 루트 URL(`https://daily1bite.com/...`) 하나다. EN 없음
- **I2** 재작성: 단일 언어이므로 hreflang을 사용하지 않는다. `x-default` 포함 전부 미출력
- **I3** 삭제: next-intl이 없다
- **I4** 갱신: `/ko/*`·`/en/*` → 301 루트. 레거시 무prefix 경로는 이제 정답 URL이다
- **I5~I8** 유지

**(a) 변경을 정당화하는 관찰**: EN 고유 콘텐츠 0편, EN 전체가 이미 noindex이므로
색인 대상에 EN이 애초에 없었다. i18n 스택 제거로 신호를 내보내는 표면이 줄고
(hreflang·`Link:` 헤더·locale 감지·미들웨어), 4월 이전 URL 구조로 복귀한다.

**(b) 성패 판단 기준**: 배포 4주 후 GSC에서
"크롤링됨 – 현재 색인되지 않음"이 기준선 185 대비 감소하고, 색인 페이지 수가
0~1에서 증가할 것. 악화 시(색인 0 유지 + 리디렉션 오류 신규 발생)에도
**되돌리지 않고 원인을 규명한다.** 롤백이 더 나쁘다(리스크 공시 3번 참조).

**동결 기간 재설정**: 2단계 배포일 +6주.

### 2-6. 배포 후

- GSC에 sitemap 재제출
- 주소 변경 도구는 **사용하지 않는다**(같은 도메인)
- 4주 관찰. 이 기간에 색인 정책 추가 변경 금지

## 범위 밖

- `www` 중복 호스트 통합 (2단계 완료 후 별건)
- 콘텐츠 재작성 (`.seo-audit/cluster-2026-03-29-rewrite.md`, 별도 트랙)
- AdSense 재신청
