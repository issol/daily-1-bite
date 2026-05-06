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

파일이 존재하는지 확인 후 Phase 3으로 진행합니다.

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

## Phase 4: Vercel 배포 확인

Push 후 Vercel이 자동 배포를 시작합니다. 배포 상태를 확인합니다.

```bash
# Vercel CLI가 설치된 경우
cd ~/daily-1-bite
vercel ls --limit 3 2>/dev/null || echo "Vercel CLI 없음 - 대시보드에서 확인하세요"
```

배포 완료 예상 시간: 1-3분

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
1. 배포 완료 확인 후 GSC URL Inspection으로 색인 요청:
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
