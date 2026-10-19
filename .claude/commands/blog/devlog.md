---
name: devlog
description: 오늘 치 앱 개발일지 한 편을 쓴다(각 앱 레포의 커밋·intent·ADR 을 실제로 탐색해서). 자동 파이프라인과 같은 스크립트를 손으로 돌리는 명령.
disable-model-invocation: true
argument-hint: '[--no-push | --no-commit]'
---

`scripts/devlog/run.sh $ARGUMENTS` 를 Bash 로 실행한다(기본은 커밋 + main 푸시). 글쓰기 규칙은 `scripts/devlog/PROMPT.md`, 운영은 `scripts/devlog/README.md`.

끝나면 `.devlog/run.log` 의 마지막 20줄과 만들어진 파일 경로를 보여 주고, `--no-push` 였으면 푸시는 사용자 몫이라고 말한다. 실패했으면 `.devlog/failed/` 의 파일과 로그의 오류 줄을 보여 준다.
