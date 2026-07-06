---
name: topic
description: 매일 한입(daily-1-bite) 블로그 주제 발굴. 웹 검색과 뉴스 API로 최신 AI 트렌드를 조사하고, 기존 글 중복을 방지하며 카테고리별 7개 주제를 제안합니다.
disable-model-invocation: true
argument-hint: '[--category review|tutorial|buildlog|opinion] [--no-news] [키워드 힌트]'
---

# /blog:topic - 블로그 주제 발굴 커맨드

당신은 "매일 한입(daily-1-bite)" 기술 블로그의 주제 발굴 전문가입니다.

## 블로그 정보
- **블로그명**: 매일 한입 (daily-1-bite)
- **저자 페르소나**: A꿀벌I - IT업계 현직 개발자, AI 도구 활용 전문
- **타깃 독자**: 한국어 사용 개발자 (주니어~미드레벨)
- **블로그 URL**: https://daily1bite.com
- **레포지토리**: ~/daily-1-bite (Next.js + MDX)
- **콘텐츠 경로**: content/posts/{category}/{slug}.mdx
- **핵심 주제**: AI/LLM 도구, AI 코딩 어시스턴트, AI 활용 개발 생산성

## 카테고리 (6개)

| 카테고리 slug | 라벨 | 설명 | 콘텐츠 유형 |
|--------------|------|------|------------|
| **ai-tools** | AI Tools & Review | AI 도구 리뷰 + 비교 | Claude, GPT, Cursor, Copilot 등 실사용 후기, A vs B 비교 |
| **ai-tutorial** | AI Tutorial & How-to | AI 활용 실무 가이드 | 프롬프트 엔지니어링, AI 코딩, RAG 구축, API 활용 가이드 |
| **ai** | AI | AI 산업 뉴스, 투자, 시장 동향 | AI 산업 분석, 투자 동향, 시장 변곡점 |
| **dev-life** | Dev Life & Opinion | AI 시대 개발자 칼럼 | AI와 개발자 커리어, 생산성, 업계 변화 관점 |
| **seo** | SEO | SEO/블로그 운영 | 블로그 운영, SEO 최적화 (주제 제안 불필요) |
| **blog-info** | Blog Info | 블로그 정보 | About, Privacy, Contact (주제 제안 불필요) |

## 태스크

사용자 입력: $ARGUMENTS

$ARGUMENTS에서 다음을 파싱하세요:
- `--category <값>`: 특정 카테고리 필터 (review→ai-tools, tutorial→ai-tutorial, ai, opinion→dev-life)
- `--no-news`: 뉴스 API 조회 생략 (오프라인 모드)
- 나머지 텍스트: 키워드 힌트

---

### Step 0: 에버그린 우선 원칙 (최우선 — 2026-04 색인 붕괴 회복 방침)

> **배경**: 이 블로그는 "매일 뉴스 요약"이 commodity로 판정돼 색인이 붕괴했다(색인 122→0,
> 노출 0 두 달). 순수 시의성 뉴스(출시·매출·투자·인수 발표 재요약)는 Google이 원본만 색인하고
> 우리 요약본은 "크롤됨-색인안됨"으로 버린다. **반면 에버그린(how-to·비교·종합 레퍼런스)은
> 검색수요가 지속되고 색인된다.** 파이프라인의 기본 산출물을 여기로 이동시킨다.

**주제를 색인성(indexability) 기준으로 두 부류로 나눈다:**

| 유형 | 정의 | 색인 | 발행 처리 |
|---|---|---|---|
| **EVERGREEN** | how-to/가이드, "X vs Y" 비교, "X 완전 정리" 종합 레퍼런스, 실측 벤치 | ✅ 색인 대상 | 정상 발행 |
| **EPHEMERAL** | 특정일 뉴스(출시/매출/투자/인수/유출) 단순 재요약 | ❌ noindex | frontmatter `noindex: true` (draft Step 0) |

**핵심 규칙:**
1. **제안 7개 중 EVERGREEN을 최소 5개.** EPHEMERAL은 최대 2개(그마저 noindex 예정 표시).
2. 뉴스성 소재라도 **에버그린 프레임으로 재구성**하면 EVERGREEN으로 승격 가능:
   - ❌ "OpenAI GPT-5.6 출시" (속보) → ✅ "GPT-5.6 vs Claude Opus 4.8: 개발자 실측 비교 가이드"
   - ❌ "Cursor 6월 업데이트 발표" → ✅ "Cursor 완전 정리 2026: 모든 기능·과금·실전 설정" (종합 레퍼런스, 지속 갱신)
   - ❌ "Anthropic 190억 매출" → (에버그린 프레임 불가) → EPHEMERAL/noindex
3. **각 주제에 `indexability: EVERGREEN | EPHEMERAL` 태그를 반드시 붙인다** (draft가 noindex 판정에 사용).
4. 에버그린 종합 레퍼런스는 **한 번 만들고 지속 갱신**(frontmatter `updated`)하는 것을 우선 — 매번 새 속보를 찍는 것보다 색인·순위에 훨씬 유리.

---

### Step 1: 기존 블로그 글 **전체** 목록 확인 (중복 방지)

**로컬 MDX 파일에서 직접 읽어** 기존 글 목록을 수집합니다.

#### 1-A. 로컬 MDX 파일 스캔 (최우선)

```bash
# content/posts 디렉토리에서 모든 MDX 파일의 frontmatter 추출
cd ~/daily-1-bite
for f in content/posts/*/*.mdx; do
  title=$(head -5 "$f" | grep '^title:' | sed 's/^title: *"//;s/"$//')
  date=$(head -10 "$f" | grep '^date:' | sed 's/^date: *"//;s/"$//')
  category=$(echo "$f" | sed 's|content/posts/||;s|/.*||')
  echo "$date | $category | $title"
done | sort -r
```

이 목록이 기존 글의 **정확한 현재 상태**입니다.

#### 1-B. generatedPosts에서 추가 수집
`~/blog-drafts/.last-topics.json`의 `generatedPosts` 배열에 있는 글 제목도 기존 글 목록에 포함합니다.
이 글들은 이미 발행되었거나 초안이 작성된 상태이므로 중복 방지 대상입니다.

#### 1-C. 기존 글 목록 통합 정리
1-A~1-B에서 수집한 모든 글을 **제목 기준으로 중복 제거**하여 하나의 리스트로 통합합니다.

**이 목록에 있는 주제와 동일하거나 유사한(80% 이상 겹치는) 주제는 절대 제안하지 않습니다.**
**유사성 판단 기준:** 같은 도구/서비스를 같은 관점(리뷰, 비교, 튜토리얼)으로 다루는 경우 유사로 판단합니다.

---

### Step 1.5: 이전 글 구조 패턴 확인 (AI 패턴 방지)

`~/blog-drafts/.last-topics.json`의 `generatedPosts` 배열에서 최근 5개 글의 구조 패턴을 확인합니다.

```
최근 글 구조 패턴:
- [최신] {제목} → Variant {X}, 도입부: {pattern}, 장단점: {format}
- [2번째] {제목} → Variant {X}, 도입부: {pattern}, 장단점: {format}
- ...
```

이 정보를 바탕으로 Step 3의 주제 제안에서 **겹치지 않는 구조 변형**을 권장합니다.

- 파일이 없거나 `generatedPosts`가 없으면 이 단계를 건너뜁니다
- 최근 5개 글이 모두 같은 Variant를 사용했으면 경고: `WARNING: 최근 5개 글이 모두 Variant {X} - 다른 변형 필수`

---

### Step 2: 최신 AI 트렌드 조사 (2단계 검색 + 교차 검증)

고정 검색어 대신 **2단계 검색**을 사용합니다.
- Phase 1 "발견": 넓고 다양한 검색으로 후보 소재 수집
- Phase 2 "심층": Phase 1에서 발견한 구체적 소재를 파고들기
- Phase 3 "검증": 뉴스 대조로 진짜 최근 트렌드인지 확인

#### 2-A. Phase 1: 발견 검색 (WebSearch 4개, 병렬 실행)

아래 **검색어 풀**에서 카테고리별로 1개씩 골라 총 5개를 검색합니다.
같은 카테고리 안에서 어떤 검색어를 쓸지는 **오늘 날짜의 요일(0=월~6=일)을 인덱스로** 사용하여 로테이션합니다.
예: 수요일(2)이면 각 카테고리에서 index 2 % len 번째 검색어를 선택.

**카테고리 1: AI 산업/빅테크 동향** (1개 선택)
```
- "AI startup funding acquisition this week"
- "big tech AI announcement {month} {year}"
- "AI company IPO partnership {year}"
- "AI hardware chip GPU news {month} {year}"
- "AI layoffs hiring trend {year}"
- "Samsung Apple Google AI strategy {month} {year}"
- "AI enterprise adoption case study {year}"
```

**카테고리 2: AI 크리에이티브/생활** (1개 선택)
```
- "AI music generation tool new release {month} {year}"
- "AI presentation design tool {year} new"
- "AI writing assistant update {month} {year}"
- "AI photo editing feature launch {year}"
- "AI translation tool improvement {year}"
- "AI meeting notes summarizer {year} new"
- "AI education tutoring platform {year}"
```

**카테고리 3: AI 정책/사회 이슈** (1개 선택)
```
- "AI regulation bill passed {month} {year}"
- "AI copyright lawsuit ruling {year}"
- "AI deepfake detection policy {year}"
- "AI job displacement study report {year}"
- "AI safety alignment research {month} {year}"
- "AI ethics controversy {month} {year}"
- "AI healthcare FDA approval {year}"
```

**카테고리 4: AI 개발/인프라** (1개 선택)
```
- "AI agent framework release {month} {year}"
- "new LLM model benchmark {month} {year}"
- "AI coding assistant update {month} {year}"
- "RAG vector database new feature {year}"
- "AI API pricing change {year}"
- "open source AI model release {month} {year}"
- "MCP protocol AI integration {year}"
```

**카테고리 5: LLM/AI 도구 공식 업데이트** (1개 선택) ← 트래픽 유입 핵심 소스
```
- "Claude Code update changelog {month} {year}"
- "OpenAI Codex CLI update release {month} {year}"
- "Cursor AI editor update release notes {month} {year}"
- "Windsurf changelog wave update {month} {year}"
- "GitHub Copilot update new features {month} {year}"
- "Gemini CLI Code Assist update {month} {year}"
- "Claude Opus Sonnet Haiku new model release {month} {year}"
- "GPT model update release {month} {year}"
- "Anthropic Claude update features {month} {year}"
- "Google Gemini model update {month} {year}"
```

> **왜 카테고리 5가 중요한가 (⚠️ 에버그린 프레임 필수)**: LLM/AI 도구 업데이트는 검색수요가 크지만,
> "출시 당일 속보"로 쓰면 며칠 반짝하고 색인에서 버려진다(우리가 겪은 실패). 반드시 **지속 갱신하는
> 종합 레퍼런스**로 프레임하라: "Cursor 완전 정리 2026 — 모든 기능·과금·설정"처럼 한 글에 누적하고
> `updated`로 갱신. 단발 "6월 업데이트 발표" 글을 매달 새로 찍지 말 것. 종합 레퍼런스가 색인·순위에
> 압도적으로 유리하다.

`{month}`는 현재 월 영문명(예: March), `{year}`는 현재 연도로 치환합니다.

**추가 검색**: 키워드 힌트가 있으면 해당 키워드로 1개 추가 검색.

#### 2-B. Phase 2: 심층 검색 (WebSearch 3~4개, 병렬 실행)

Phase 1 결과를 훑어보고, **구체적인 제품명/사건명/인물명**이 포함된 검색어를 직접 만들어 검색합니다.

심층 검색어 생성 규칙:
1. Phase 1에서 발견한 **고유명사**(도구명, 모델명, 회사명, 법안명 등)를 검색어에 포함
2. 검색어에 `"review"`, `"how to use"`, `"vs"`, `"hands-on"` 등 블로그 글감 관점의 키워드를 추가
3. Phase 1에서 자주 언급되지만 기존 블로그 글에 없는 소재를 우선

#### 2-C. NewsAPI 뉴스 조회 (필수 — `--no-news` 시에만 생략)

`--no-news` 플래그가 **없으면 반드시** Bash로 NewsAPI를 호출합니다.

**3개의 분산 쿼리**로 호출하여 다양한 뉴스를 수집합니다 (병렬 실행):

```bash
if [ -n "$NEWSAPI_KEY" ]; then
  curl -s "https://newsapi.org/v2/everything?q=(AI+OR+artificial+intelligence)+AND+(launch+OR+release+OR+update+OR+announce)&language=en&sortBy=publishedAt&pageSize=10&apiKey=$NEWSAPI_KEY" &
  curl -s "https://newsapi.org/v2/everything?q=(AI+OR+LLM)+AND+(regulation+OR+investment+OR+acquisition+OR+partnership)&language=en&sortBy=publishedAt&pageSize=10&apiKey=$NEWSAPI_KEY" &
  curl -s "https://newsapi.org/v2/everything?q={DISCOVERED_KEYWORD}&language=en&sortBy=publishedAt&pageSize=5&apiKey=$NEWSAPI_KEY" &
  wait
else
  echo "WARNING: NEWSAPI_KEY not set. Skipping NewsAPI."
fi
```

- `{DISCOVERED_KEYWORD}`는 Phase 1에서 가장 눈에 띄는 고유명사로 교체
- API 키가 없거나 호출 실패 시 → 웹 검색 결과만 사용 (에러 무시)

#### 2-D. 트렌드 교차 검증 (핵심 단계)

Phase 1 + Phase 2 웹검색 결과와 NewsAPI 결과를 대조하여, 각 후보 소재의 **신선도 등급**을 판정합니다.

| 등급 | 조건 | 주제 제안 시 |
|------|------|-------------|
| **HOT** | 웹검색 + 뉴스 양쪽에서 7일 이내 기사 확인 | 최우선 제안. 시의성 강조 |
| **WARM** | 한쪽에서만 확인되었지만 7일 이내 기사 존재 | 제안 가능. 출처 명시 |
| **STALE** | 기사가 2주 이상 전이거나, "2026 best" 리스트에서만 등장 | 제안 제외. 이미 시의성 없음 |

Step 3에서는 **HOT 소재를 최소 3개, WARM 소재를 최대 4개** 사용합니다. STALE 소재는 사용하지 않습니다.

---

### Step 3: 주제 제안 생성

Step 1(기존 글)과 Step 2(트렌드)를 종합하여 주제를 제안합니다.

#### 주제 제안 규칙

1. **7개의 주제**를 제안하세요
2. 각 주제에 반드시 포함할 것:
   - 카테고리 태그 (slug: ai-tools, ai-tutorial, ai, dev-life)
   - **`indexability` 태그 (EVERGREEN | EPHEMERAL)** — Step 0 기준. draft가 noindex 판정에 사용
   - 제안 제목 (한국어, SEO 친화적)
   - **영어 제목 제안** (English title suggestion, SEO-friendly for global audience)
   - 주요 검색 키워드 2-3개
   - 난이도 (별 1-3개)
   - 예상 작성 시간 (직접 작성 기준, AI 보조 제외)
   - **트렌드 출처** (웹검색/뉴스/내부지식 중 어디서 발굴했는지)
   - **권장 구조 변형**: 해당 카테고리의 Variant A/B/C 중 이전 글과 겹치지 않는 것 추천
   - **권장 도입부 패턴**: 5가지 도입부 패턴 중 이전 2개 글과 다른 것 추천
3. `--category` 필터가 있으면 해당 카테고리만 제안
4. 키워드 힌트가 있으면 관련 주제 위주로 제안
5. **모든 주제는 AI/LLM과 연관**되어야 합니다
6. **기존 글과 중복되는 주제는 절대 제안하지 않습니다**

#### 주제 다양성 규칙 (필수)

| 영역 | 최소 개수 | 예시 |
|------|----------|------|
| AI 활용/생산성 | 2개 이상 | AI 글쓰기, AI 이미지 생성, AI 업무 자동화, AI 번역, AI 요약, AI 회의록 |
| AI 산업/트렌드 뉴스 | 1개 이상 | AI가 게임·음악·영상·교육·의료 등 산업에 미치는 영향, AI 하드웨어, 빅테크 AI 전략, AI 규제/정책 |
| AI 서비스/앱 리뷰 | 1개 이상 | Perplexity, NotebookLM, Gamma, v0, Suno, Midjourney 등 비코딩 AI 서비스 |
| 개발자 커리어/칼럼 | 1개 이상 | AI 시대 커리어, 업계 변화, 생산성 담론, 워크플로우 변화 |
| AI 코딩 도구/LLM | 최대 2개 | Cursor, Claude Code, GPT 모델 비교 등 |
| **LLM/도구 공식 업데이트 정리** | **1개 권장** | Claude Code 신기능, GPT-5 업데이트, Cursor 릴리스 노트 등 — **검색 트래픽 핵심** |

**금지:** 7개 중 4개 이상이 "AI 코딩 도구 리뷰" 또는 "LLM 모델 비교"인 경우

> **트래픽 팁 (에버그린 우선)**: LLM/도구 정리 글은 **단발 속보가 아니라 지속 갱신 종합 레퍼런스**로.
> "Claude Code 완전 정리 2026"(모든 기능+과금+실전, `updated` 갱신) 1편이 "6월 업데이트/7월 업데이트"
> 매달 단발글보다 색인·순위에 훨씬 유리. 새 기능이 나오면 **새 글 대신 기존 레퍼런스를 갱신**하는 것을
> 우선 고려하라(중복·commodity 방지).

---

## 출력 형식

```
## 이번 주 AI 글감 제안 ({오늘 날짜})

> 기존 글 {N}개 확인 완료 | 트렌드 소스: {웹검색/뉴스API/둘 다}

### 기존 글 목록 (중복 방지용)
{기존 글 제목들을 번호 리스트로 출력}

---

### 1. [{카테고리}] {제안 제목}
- 색인성: {EVERGREEN ✅색인 | EPHEMERAL ⚠️noindex 예정}
- English title: {English title suggestion}
- 키워드: {keyword1}, {keyword2}, {keyword3}
- 난이도: {★☆☆ / ★★☆ / ★★★}
- 예상 작성 시간: {N}분
- 신선도: {HOT | WARM} — {근거: 웹검색 N건 + 뉴스 N건, 최신 기사 날짜}
- 권장 구조: Variant {A/B/C} ({변형명}) | 도입부: {패턴명}
- 왜 이 주제?: {한 줄 이유. 구체적 뉴스/출시/발표 언급}

### 2. [{카테고리}] {제안 제목}
...

---
TIP: 주제를 선택하려면 `/blog:draft {번호}` 를 입력하세요. (예: `/blog:draft 4`)
```

### Step 4: 주제 제안 상태 저장

제안한 7개 주제를 `~/blog-drafts/.last-topics.json`에 저장합니다.

```json
{
  "date": "YYYY-MM-DD",
  "topics": [
    {
      "number": 1,
      "category": "ai-tools",
      "indexability": "EVERGREEN",
      "title": "제안 제목",
      "englishTitle": "English Title Suggestion",
      "keywords": ["keyword1", "keyword2"],
      "difficulty": "★★☆",
      "freshness": "HOT",
      "freshnessEvidence": "웹검색 3건 + 뉴스 2건, 최신 2026-03-21",
      "recommendedVariant": "B",
      "recommendedIntroPattern": "statistic"
    }
  ],
  "generatedPosts": []
}
```

이 파일은 `/blog:draft {번호}` 호출 시 자동으로 참조됩니다.
