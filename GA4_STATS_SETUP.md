# 방문 통계 연동 가이드 (GA4 Data API)

블로그 `/stats` 페이지에서 실시간 방문 통계를 표시하려면
Google Cloud 서비스 계정을 만들고 아래 3가지 환경변수를 Amplify에 등록해야 합니다.

---

## 1단계 — Google Cloud 서비스 계정 만들기

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 (또는 새로 생성)
3. 왼쪽 메뉴 → **IAM 및 관리자** → **서비스 계정**
4. **서비스 계정 만들기** 클릭
   - 이름: `daily-1-bite-analytics` (아무 이름 가능)
5. 역할: **역할 없음**으로 두고 완료
6. 생성된 서비스 계정 클릭 → **키** 탭 → **키 추가** → **JSON 다운로드**

---

## 2단계 — GA4 속성에 서비스 계정 권한 부여

1. [Google Analytics](https://analytics.google.com/) → 관리 (⚙️)
2. **속성** → **속성 액세스 관리**
3. 우상단 **+** 버튼 → 사용자 추가
4. 이메일: 다운받은 JSON 파일의 `client_email` 값 입력
5. 역할: **뷰어**로 설정 → 추가

---

## 3단계 — GA4 속성 ID 확인

1. Google Analytics → 관리 → **속성 설정**
2. **속성 ID** 복사 (예: `123456789`)

---

## 4단계 — Amplify 환경변수 등록

AWS Amplify Console → 앱 → **환경 변수** → 다음 3개 추가:

| 변수명 | 값 |
|--------|-----|
| `GA_PROPERTY_ID` | GA4 속성 ID (숫자만, 예: `123456789`) |
| `GA_CLIENT_EMAIL` | JSON 파일의 `client_email` 값 |
| `GA_PRIVATE_KEY` | JSON 파일의 `private_key` 값 (따옴표 포함 전체) |

> ⚠️ `GA_PRIVATE_KEY` 값은 `-----BEGIN PRIVATE KEY-----\n...` 형식의 긴 문자열입니다.
> Amplify에 입력 시 줄바꿈 `\n`을 그대로 입력하면 됩니다.

---

## 5단계 — 재배포

환경변수 저장 후 Amplify에서 **재배포(Redeploy)** 하면
`/stats` 페이지에 실제 방문 통계가 표시됩니다.

---

## 통계 갱신 주기

- 데이터는 **매 1시간마다** 자동 갱신됩니다 (ISR revalidate: 3600)
- GA4 데이터 자체는 최대 24~48시간 지연될 수 있습니다 (GA4 처리 시간)
- 인기 글은 **최근 90일** 기준 페이지뷰 순위입니다
