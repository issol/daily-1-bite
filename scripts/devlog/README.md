# 개발일지 파이프라인 (`scripts/devlog/`)

2026-10-19 부터 이 블로그의 주 콘텐츠는 **앱 개발일지**다. 매일 저녁 한 편, 한 앱, 한 주제. 재료는 각 앱 레포에 남은
실제 기록(커밋·`.claude/intent/`·`docs/adr/`·제품 문서)뿐이다. 왜 이렇게 하는지는 `docs/SEO-INVARIANTS.md` 의
"판정 결과" 절 — 색인 붕괴의 원인은 URL 구조가 아니라 "발표 요약 + 겪지 않은 경험담"이었고, 남은 레버는 콘텐츠다.

## 흐름

```
dispatch(issol-threads, 매일 22:00)  →  ~/issol-threads/scripts/blog-devlog.sh
  → 자동화 전용 클론(~/.cache/issol/daily-1-bite-devlog)을 origin/main 으로 맞춘 뒤
  → scripts/devlog/run.sh
      1. candidates.mjs  : 앱별 최근 10일 커밋·바뀐 intent/ADR·마지막 개발일지 → .devlog/candidates.json
      2. claude -p PROMPT.md : 앱·주제 선택 → repo.mjs 로 diff·intent·ADR 을 실제로 읽음 → MDX 작성
      3. verify-post.mjs : 날짜=오늘, 형식, 근거 커밋 실재, 비밀값·절대경로 없음, MDX 컴파일
      4. git commit + push origin main  → Vercel 자동 배포
```

- `apps.mjs` — 앱 목록은 `~/issol-threads/config/apps.json`(Threads 자동화와 같은 단일 출처). 레포 경로가 이 머신 전용이라 여기엔 두지 않는다.
- `repo.mjs` — 에이전트가 레포를 보는 유일한 창구. 읽기 전용 git 만, 절대 경로는 `<repo>` 로 가림, `.env`·키 파일은 열지 않음, 출력 상한.
- 글의 frontmatter `app`·`sources`(커밋 해시·문서 경로)가 "무엇을 이미 썼나"의 장부다. 다음 날 후보에서 `covered` 로 표시된다.

## 손으로 돌리기

```bash
scripts/devlog/run.sh --no-commit    # 파일만 만들어 읽어 본다
scripts/devlog/run.sh --no-push      # 커밋까지
scripts/devlog/run.sh                # 푸시까지(main 에서만)
node scripts/devlog/verify-post.mjs content/posts/ko/devlog/<파일>.mdx
```

Claude Code 안에서는 `/blog:devlog [--no-push]`.

## 지켜야 할 것

- **하루 한 편, 그날 날짜로.** 미리 써서 몰아 커밋하지 않는다 — 56편이 하루에 몰렸던 것이 색인 붕괴의 지문이었다(I6). `verify-post` 가 `date == 오늘`을 강제한다.
- **색인 게이트(I7)**: 🧪 실제 변경 증거 + 🧭 판단이 둘 다 있을 때만 `noindex: false`. 둘 중 하나가 비면 `noindex: true` 로 나간다 — 글은 나가되 색인 대상에서 뺀다.
- **실행하지 않은 것을 실행했다고 쓰지 않는다.** 에이전트가 하는 "실행"은 git 조회뿐이다. 테스트·심사·출시 결과는 커밋·plan.md 에 적힌 것을 출처와 함께 옮긴다.
- 실패하면 글은 `.devlog/failed/` 로 가고 macOS 알림이 온다(`~/issol-threads/scripts/alert.sh`). 로그는 `.devlog/run.log`.
- 글이 안 나온 날은 그냥 빈 날이다. 다음 날 두 편으로 메우지 않는다.
