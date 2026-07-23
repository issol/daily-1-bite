---
name: publish
description: 매일 한입(daily-1-bite) 블로그 글 발행. 공식 출처(웹/뉴스)와 last30days 커뮤니티 반응을 함께 수집해 주제 발굴 → 초안 생성 → 색인 게이트 → Git 커밋 → Amplify 배포까지 전체 워크플로우를 실행합니다.
disable-model-invocation: true
argument-hint: '[--skip-topic] [--skip-draft] [slug --category <cat>]'
---

# /blog:publish - 블로그 글 발행 커맨드

당신은 "매일 한입(daily-1-bite)" 기술 블로그의 발행 전문 에이전트입니다.
주제 발굴부터 Git 커밋, Vercel 배포 확인까지 전체 발행 워크플로우를 실행합니다.

## 블로그 정보
- **블로그명**: 매일 한입 (daily-1-bite)
- **레포지토리**: ~/daily-1-bite (Next.js + MDX)
- **콘텐츠 경로 (한국어)**: content/posts/ko/{category}/{slug}.mdx
- **콘텐츠 경로 (영어)**: content/posts/en/{category}/{slug}.mdx
- **블로그 URL**: https://daily1bite.com

## 사용 방법

```
/blog:publish                          # 전체 워크플로우 (주제 → 초안 → 발행)
/blog:publish --skip-topic             # 주제 발굴 생략 (기존 주제 사용)
/blog:publish --skip-draft             # 초안 생성 생략 (기존 파일 발행)
/blog:publish --skip-topic --skip-draft  # Git 커밋 + 배포만 실행
/blog:publish my-post-slug --category ai-tools  # 특정 파일 지정 발행
```

## 사용자 입력

$ARGUMENTS 파싱:
- `--skip-topic`: Phase 1 생략
- `--skip-draft`: Phase 2 생략
- `--skip-topic --skip-draft`: Phase 3부터 시작
- `slug --category <cat>`: 특정 slug 파일을 지정하여 발행

---

## 정보 수집 소스 (전체 워크플로우 공통)

이 파이프라인은 **성격이 다른 두 종류의 소스**를 쓴다. 둘 다 필요하다.

| 소스 | 가져오는 것 | 담당 단계 |
|---|---|---|
| WebSearch / WebFetch / NewsAPI | 공식 발표, 릴리스 노트, 보도자료 기반 기사 = **발표자가 하고 싶은 말** | topic 2-A~2-C, draft 2.7 |
| **`last30days` 스킬** | Reddit·HN·X·YouTube의 실제 반응, 원문 인용·참여수·링크 = **쓴 사람들이 한 말** | topic 2-D, draft 2.75 |

> **왜 두 번째가 필수인가**: 2026-04 이 블로그는 색인이 122→0으로 붕괴했다. 원인은
> "원본 발표의 재요약"이라는 판정이었다. 공식 소스만 쓰는 한 우리 글은 구조적으로 원본의
> 열화 복사본이다. `last30days`가 가져오는 커뮤니티 반응은 보도자료에 없고, 요약으로는
> 만들어낼 수 없으며, 링크로 검증 가능하다. 이것이 draft의 💬 가치 레이어 재료다.

**전제 조건**: `last30days` 플러그인이 설치돼 있어야 한다(`/plugin install last30days@last30days-skill`).
없거나 실패하면 각 단계가 알아서 건너뛴다 — **파이프라인은 멈추지 않는다.** 다만 그 글은
💬 레이어 없이 나가므로 다른 레이어로 Step 0 게이트를 통과해야 한다.

> **절대 금지**: `last30days`가 실패했을 때 커뮤니티 반응을 상상해서 채우는 것.
> 없는 인용과 없는 링크를 만드는 순간, 애초에 이 블로그를 강등시킨 신뢰 문제를 재현하는 것이다.

---

## Phase 1: 주제 발굴 (`--skip-topic` 없을 때)

`/blog:topic` 스킬을 실행하여 주제를 제안받습니다.

`/blog:topic`은 내부적으로 웹검색·NewsAPI에 더해 **`last30days`로 커뮤니티 신호를 수집**하고
(Step 2-D), 각 주제에 `communitySignal`(LOUD/QUIET/none)을 붙여 돌려줍니다.
**LOUD 주제를 우선 선택하십시오** — 반응이 있는 소재라야 우리 글이 원본 발표와 다른 물건이 됩니다.

사용자가 주제를 선택하면 Phase 2로 진행합니다.

---

## Phase 2: 초안 생성 (`--skip-draft` 없을 때)

`/blog:draft {선택된 번호}` 스킬을 실행하여 초안을 생성합니다.

draft는 Step 2.7(공식 출처)에 이어 **Step 2.75에서 `last30days` 커뮤니티 반응을 수집**하고,
원문 인용 + 핸들 + URL + 참여수를 갖춘 인용만 💬 레이어로 인정합니다.
topic 단계에서 이미 `communityEvidence`를 모았으면 재수집하지 않습니다.

한국어 파일만 생성됩니다:
- 한국어: `content/posts/ko/{category}/{slug}.mdx`

파일이 존재하는지 확인 후 Phase 2.5로 진행합니다.

---

## Phase 2.5: 색인 정책 게이트 (indexability gate) — 필수

> **배경**: 2026-04 이 블로그는 "매일 뉴스 요약"이 commodity 콘텐츠로 판정되어
> 색인이 붕괴함(122→0). 시효성 속보가 사이트 평균 품질을 낮춰 나머지 글 색인까지
> 막았다. **이 게이트는 저가치 글이 색인 풀에 들어가는 것을 원천 차단한다.**

발행 전, 글을 **A(에버그린·색인 대상)** / **B(속보·noindex)** 로 분류한다.

**B(noindex)로 분류 → frontmatter에 `noindex: true` 추가하고 그대로 발행:**
- 시효성 속보(매출·투자·IPO·인수·유출·출시 발표 재정리)이면서
- 아래 "가치 레이어"가 **2개 미만**인 글:
  - 🧪 직접 테스트/실행 결과(스샷·수치·소요시간·비용)
  - ⚖️ 경쟁 도구/이전 버전과의 실측 비교표
  - 🧭 개발자 실무 관점의 독자 분석("그래서 뭘 바꿔야 하나")
  - 🔪 한계·비판·주의사항(공식 발표에 없는 판단)
  - 🛠 실전 적용 코드/설정/워크플로우

**A(색인)로 분류 → `noindex` 없이 발행:**
- how-to/가이드/비교/리뷰 등 에버그린 검색수요가 있고
- 가치 레이어 **2개 이상** 포함.

> 판정이 애매하면 B로 보내라(색인 풀 오염 방지가 우선). noindex 글도 접근은 되지만
> 사이트맵·색인에서 빠진다(`lib/posts.ts` noindex 지원).

---

## Phase 3: Git 커밋

### 3-A. 발행 대상 파일 확인

```bash
cd ~/daily-1-bite
ls content/posts/ko/{category}/{slug}.mdx
```

파일이 존재하지 않으면 `/blog:draft`를 다시 실행합니다.

### 3-B. Git 상태 확인

```bash
cd ~/daily-1-bite
git status
git diff --stat
```

### 3-C. 파일 스테이징

```bash
cd ~/daily-1-bite
git add content/posts/ko/{category}/{slug}.mdx
```

### 3-D. 커밋

커밋 메시지 형식:
```
feat: 새 글 - {ko_title} / {en_title}
```

예시:
```bash
cd ~/daily-1-bite
git commit -m "feat: 새 글 - Claude Code 실전 후기: 3주 사용해보니 / Claude Code Review: 3 Weeks of Real-World Use"
```

### 3-E. Push

```bash
cd ~/daily-1-bite
git push origin main
```

---

## Phase 4: AWS Amplify 배포 확인

이 블로그는 **AWS Amplify**로 호스팅됩니다(`amplify.yml`, Next.js SSR/ISR).
`git push origin main` 시 Amplify가 자동 빌드·배포를 시작합니다.

```bash
# Amplify는 main 푸시 → 자동 배포. 상태는 Amplify 콘솔에서 확인.
echo "Amplify 콘솔: https://console.aws.amazon.com/amplify/ (main 브랜치 빌드 확인)"
```

배포 완료 예상 시간: 3-6분(빌드 포함). 배포 후 URL 200 확인:
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://daily1bite.com/ko/blog/{category}/{slug}
```

---

## Phase 5: 주제 큐 갱신 (`last30days` 사용한 경우만)

`last30days`는 발굴한 주제를 자체 큐에 누적한다. 발행한 주제를 covered로 표시해야
다음 `/blog:topic` 실행에서 같은 주제가 다시 후보로 올라오지 않는다.

Skill 도구로 `last30days` 호출, args: `mark "{큐에 있던 주제명}" as covered`

- **큐에 있던 정확한 주제명**을 써야 한다(우리가 지은 한국어 제목이 아니라).
  이름이 틀리면 스킬이 exit 2로 거절하고 큐 목록을 알려준다 — 그때 맞는 이름으로 다시 부른다.
- topic 단계에서 `last30days`를 안 썼거나 큐에 없던 주제면 이 Phase를 건너뛴다.
- 실패해도 발행은 이미 끝났다. 재시도 1회 후 넘어간다.

---

## 출력

```
발행 완료!

--- 파일 ---
파일: ~/daily-1-bite/content/posts/ko/{category}/{slug}.mdx

--- 리서치 소스 ---
공식 출처: {N}개 (WebSearch/WebFetch)
커뮤니티(last30days): {LOUD 인용 N개 / QUIET / 미실행-사유}
가치 레이어: {본문에 실제 반영된 레이어 나열, 예: 💬 ⚖️ 🧭}
색인 판정: {A=색인 대상 | B=noindex}

--- Git ---
커밋: feat: 새 글 - {ko_title}
브랜치: main
Push: 완료

--- 배포 URL ---
URL: https://daily1bite.com/ko/blog/{category}/{slug}

배포 상태: Vercel/Amplify 자동 배포 진행 중 (1-3분 소요)
Vercel 대시보드: https://vercel.com/dashboard

--- 발행 후 SEO 액션 (필수) ---
0. ⚠️ 이 글이 Phase 2.5에서 **B(noindex)** 로 분류됐다면 색인 요청 생략(1번 건너뜀).
   noindex 글에 색인 요청하면 GSC에 "noindex 제외" 노이즈만 쌓인다.

1. (A=색인 대상 글만) 배포 완료 확인 후 GSC URL Inspection으로 색인 요청:
   https://search.google.com/search-console/inspect?resource_id=sc-domain%3Adaily1bite.com&id=https%3A%2F%2Fdaily1bite.com%2Fko%2Fblog%2F{category}%2F{slug}
   → "URL이 Google에 등록되지 않음" 확인 후 "색인 요청" 버튼 클릭
   (신규 도메인은 자연 색인까지 1-4주 걸리므로 수동 요청 권장)

2. 외부 백링크 시드 (5주차 신규 도메인의 가장 큰 레버):
   - Reddit: r/LocalLLaMA, r/ChatGPTPro, r/MachineLearning
   - 한국 커뮤니티: 긱뉴스(news.hada.io), 디스콰이엇, 페이스북 개발자 그룹
   - HN/X 가능 시 1-2개

3. 1-2주 후 GSC 재확인:
   node ~/daily-1-bite/scripts/seo-audit.mjs --gsc=새CSV
```
