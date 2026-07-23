# daily1bite.com

Next.js 15 (App Router) + next-intl 블로그. AWS Amplify SSR/ISR 배포. 콘텐츠는 `content/posts/{ko,en}/**.mdx`.

## 먼저 읽을 것

**`docs/SEO-INVARIANTS.md`** — 색인 관련 불변식과 변경 동결 규칙.

2026-04-14 GSC 색인이 122 → 0으로 붕괴했고 아직 회복 중이다. 방아쇠는 i18n 언어 라우팅
개편이었다. 그 뒤 3개월간 canonical·robots·noindex·hreflang·sitemap 정책이 여섯 차례 이상
바뀌면서 서로 모순되는 신호가 쌓였고, Google의 재평가 주기가 계속 리셋됐다.

따라서 이 저장소에서 아래를 건드리는 변경은 **일반 코드 수정이 아니다**:

- `middleware.ts`, `i18n/routing.ts` (리디렉션·로케일 라우팅)
- `app/sitemap.ts`, `app/robots.ts`
- 각 페이지 `generateMetadata`의 `alternates` / `robots`
- 콘텐츠 frontmatter의 `date` / `noindex`

`docs/SEO-INVARIANTS.md`의 불변식을 먼저 확인하고, 위반이 아닌 변경이라면
동결 기간(~2026-09-03)이 끝났는지 확인한다. 특히:

- **frontmatter `date`를 소급 수정하지 않는다.** 갱신은 `updated`를 쓴다. (I6 — 날짜 일괄 수정이
  56편을 하루에 몰아넣어 대량발행 신호를 만든 전례가 있다.)
- **`hreflang="en"`을 다시 내보내지 않는다.** (I2)
- **실행하지 않은 것을 실행했다고 쓰지 않는다.** (I7 — 지금 받고 있는 것이 신뢰 강등이다.)

## 검증

```bash
npm run build      # 색인 관련 변경 후에는 docs/SEO-INVARIANTS.md의 "검증" 절을 그대로 실행한다
```
