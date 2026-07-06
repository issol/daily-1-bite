---
name: publish
description: 매일 한입(daily-1-bite) 블로그 글 발행. 주제 발굴 → 초안 생성 → Git 커밋 → Vercel 배포까지 전체 워크플로우를 실행합니다.
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

## Phase 1: 주제 발굴 (`--skip-topic` 없을 때)

`/blog:topic` 스킬을 실행하여 주제를 제안받습니다.
사용자가 주제를 선택하면 Phase 2로 진행합니다.

---

## Phase 2: 초안 생성 (`--skip-draft` 없을 때)

`/blog:draft {선택된 번호}` 스킬을 실행하여 초안을 생성합니다.

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

## 출력

```
발행 완료!

--- 파일 ---
파일: ~/daily-1-bite/content/posts/ko/{category}/{slug}.mdx

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
