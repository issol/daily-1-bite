import type { Metadata } from 'next';
import { PersonJsonLd } from '@/components/JsonLd';
import { AUTHOR } from '@/lib/author';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daily1bite.com';

export const metadata: Metadata = {
  title: '소개',
  description:
    `매일 한입을 쓰는 ${AUTHOR.name}를 소개합니다. 혼자 iOS 앱 다섯 개를 만들고 운영하며, 매일 한 앱의 변경 하나를 개발일지로 남깁니다.`,
  alternates: {
    canonical: `${BASE_URL}/about`,
  },
  openGraph: {
    title: `${AUTHOR.name} 소개 | 매일 한입`,
    description: '혼자 iOS 앱 다섯 개를 만들고 운영하는 개발자의 개발일지 블로그입니다.',
    url: `${BASE_URL}/about`,
  },
};

const APPS = [
  {name: 'Joiny', ko: '조이니', what: '함께 갈 사람을 초대해 같이 여행 일정을 짜고, 지도로 동선을 보고, 비용을 정산하는 여행 플래너.', since: '2026-10 출시 · iOS', href: '/joiny'},
  {name: 'DaySeed', ko: '데이시드', what: '매일의 습관을 한 번의 탭으로 기록하고, 캘린더를 가장 가까운 한 사람과 함께 쓰는 미니멀 기록 앱.', since: '2026-05 출시 · iOS', href: '/dayseed'},
  {name: 'Utakoto', ko: '우타코토', what: 'J-POP 가사로 일본어를 배우는 앱. 노래방 모드로 글자 단위 싱크.', since: '2026-03 출시 · iOS·Android', href: 'https://utakoto.space'},
  {name: 'Airout', ko: '에어아웃', what: '쌓인 스크린샷·비슷한 사진·흔들린 사진을 iPhone 안에서 찾아 하루 10장씩 비우는 앱. 서버도 계정도 없음.', since: '2026-10 출시 · iOS 26+', href: '/airout'},
  {name: 'Oftway', ko: '오프트웨이', what: '따로 기록하지 않아도 다닌 길이 지도에 남고, 자주 다닌 길일수록 짙어지는 발자취 일기. 위치는 폰 밖으로 나가지 않음.', since: '출시 준비 중 · iOS', href: '/oftway'},
];

export default function AboutPage() {
  return (
    <>
      <PersonJsonLd
        name={AUTHOR.name}
        url={`${BASE_URL}/about`}
        description={AUTHOR.description}
      />

      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4" role="img" aria-label="꿀벌 이모지">🐝</div>
          <h1 className="text-3xl font-bold text-gray-900">매일 한입</h1>
          <p className="text-gray-500 mt-2">혼자 앱을 만드는 개발자의 개발일지</p>
        </div>

        <div className="space-y-6 text-gray-700 leading-relaxed">

          {/* 운영자 소개 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-5">
            <h2 className="text-xl font-bold text-gray-900">쓰는 사람 — {AUTHOR.name}</h2>

            <p>
              혼자 iOS 앱을 만들고 운영합니다. 기획부터 디자인, 코드, 서버, 스토어 심사, 홍보까지
              전부 한 사람 몫이라서, 매일 어떤 결정을 왜 내렸는지가 기록으로 남지 않으면 금방 잊힙니다.
              그래서 각 앱 저장소에 의도(intent)·설계(spec)·계획(plan) 문서와 커밋을 남기고, 그걸
              재료로 저녁마다 한 편씩 개발일지를 씁니다.
            </p>

            <p>
              코드도 글도 Claude Code와 함께 만듭니다. 다만 개발일지에 적는 사실은 전부 저장소에
              실제로 남은 커밋과 문서에서만 가져옵니다. 겪지 않은 경험, 재지 않은 숫자는 쓰지 않습니다.
            </p>

            <p className="text-sm">
              <a
                href="https://github.com/issol"
                target="_blank"
                rel="me noopener noreferrer"
                className="text-amber-600 font-medium hover:underline"
              >
                GitHub · @issol ↗
              </a>
            </p>
          </div>

          {/* 만드는 앱 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">만들고 있는 앱</h2>
            <p className="text-sm text-gray-500">개발일지는 이 다섯 앱 중 하루에 하나를 다룹니다. 공통 생각은 두 가지입니다 — 내 데이터는 내 폰에(Oftway·Airout), 가까운 사람과 같이 쓰는 앱(Joiny·DaySeed).</p>

            <div className="grid grid-cols-1 gap-3">
              {APPS.map(({name, ko, what, since, href}) => (
                <a
                  key={name}
                  href={href}
                  className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-amber-50 transition-colors"
                  {...(href.startsWith('http') ? {target: '_blank', rel: 'noopener noreferrer'} : {})}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{name}</span>
                      <span className="text-xs text-gray-400">{ko}</span>
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{since}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{what}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* 블로그 소개 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-5">
            <h2 className="text-xl font-bold text-gray-900">블로그 소개</h2>

            <p>
              2026년 3월에 AI 뉴스를 요약하는 블로그로 시작했습니다. 반년 동안 140편 넘게 냈지만
              발표를 다시 요약한 글이 대부분이었고, 그 글들은 저만 쓸 수 있는 글이 아니었습니다.
              2026년 10월부터는 제가 아니면 쓸 수 없는 것만 씁니다 — 제 앱의 개발일지입니다.
            </p>

            <ul className="space-y-3">
              <li>📓 <strong>개발일지</strong> — 매일 한 앱, 한 가지 변경. 무엇이 문제였고, 무엇을 바꿨고, 왜 그 길이었는지</li>
              <li>🛠️ <strong>이전 글</strong> — AI 도구 리뷰·튜토리얼·칼럼은 그대로 남겨 둡니다. 당시의 기록입니다</li>
            </ul>
          </div>

          {/* 운영 원칙 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">운영 원칙</h2>

            <div className="space-y-4 text-sm">
              {[
                {
                  title: '저장소에 남은 것만 쓴다',
                  desc: '커밋, 의도·설계·계획 문서, 설계 결정 기록(ADR), 심사·출시 기록. 글마다 근거 커밋을 frontmatter에 남깁니다.',
                },
                {
                  title: '실행하지 않은 것을 실행했다고 쓰지 않는다',
                  desc: '테스트·심사·출시 결과는 기록에 적힌 것을 출처와 함께 옮깁니다. 다운로드 수·사용자 수처럼 재지 않은 숫자는 쓰지 않습니다.',
                },
                {
                  title: '날짜를 손대지 않는다',
                  desc: '글은 그날 쓰고 그날 날짜로 나갑니다. 미리 써서 몰아 올리지 않고, 나중에 발행일을 고치지 않습니다. 내용을 고치면 수정일을 따로 적습니다.',
                },
                {
                  title: '좋은 날만 쓰지 않는다',
                  desc: '심사에서 떨어진 것, 되돌린 결정, 아직 못 푼 문제도 그대로 적습니다.',
                },
              ].map(({ title, desc }) => (
                <div key={title} className="flex gap-3">
                  <span className="text-amber-500 mt-0.5 shrink-0">✓</span>
                  <div>
                    <p className="font-semibold text-gray-800">{title}</p>
                    <p className="text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-amber-50 rounded-2xl p-8 space-y-5">
            <h2 className="text-xl font-bold text-gray-900">자주 묻는 질문</h2>

            <div className="space-y-5 text-sm">
              {[
                {
                  q: '얼마나 자주 글을 올리나요?',
                  a: '매일 저녁 한 편입니다. 그날 쓸 만한 변경이 없는 앱만 있으면 짧게 쓰거나 그날은 비웁니다. 다음 날 두 편으로 메우지 않습니다.',
                },
                {
                  q: 'AI가 쓰나요?',
                  a: '네, Claude Code와 함께 씁니다. 각 앱 저장소의 커밋과 문서를 읽고 그 안에 있는 사실만으로 씁니다. 저장소에 없는 경험담이나 숫자는 넣지 않도록 검사 스크립트가 날짜·근거 커밋·형식을 매번 확인합니다.',
                },
                {
                  q: '앱에 문제가 있어요.',
                  a: '각 앱의 지원 페이지(위 목록의 링크)나 아래 이메일로 알려 주세요. 개발일지에 다룰 만한 문제면 그 과정도 글로 남깁니다.',
                },
                {
                  q: '글의 내용이 틀렸으면 어떻게 하나요?',
                  a: '이메일로 알려주시면 확인 후 수정합니다. 수정 시 날짜와 변경 내용을 글 하단에 명시합니다.',
                },
              ].map(({ q, a }) => (
                <div key={q}>
                  <p className="font-semibold text-gray-800">{q}</p>
                  <p className="text-gray-600 mt-1">{a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-500 text-sm">
              앱 문의, 협업, 오탈자 신고는{' '}
              <a href="mailto:isolatorv@gmail.com" className="text-amber-600 font-medium hover:underline">
                isolatorv@gmail.com
              </a>
              으로 보내주세요.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
