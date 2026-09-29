/**
 * Joiny(여행 플래너 앱) 초대 링크 https://daily1bite.com/t/<토큰> 의 웹 표면.
 * 앱 레포: orca/projects/travel — .claude/intent/invite/spec.md, ADR-0009
 *
 * 미리보기는 Joiny Supabase의 공개 함수 invite_preview(토큰으로만 열리고 공개 필드만 돌려준다)를 부른다.
 * 아래 주소와 publishable 키는 앱에도 들어가는 공개 값이다(권한은 DB 함수·RLS가 막는다).
 */
// 로컬 확인용으로만 환경 변수로 바꿀 수 있다(JOINY_SUPABASE_URL, JOINY_PUBLISHABLE_KEY).
export const JOINY_SUPABASE_URL = process.env.JOINY_SUPABASE_URL ?? 'https://dtqsmgqrzekqtndskhfd.supabase.co';
export const JOINY_PUBLISHABLE_KEY = process.env.JOINY_PUBLISHABLE_KEY ?? 'sb_publishable_G5E164i9gz90IBP4tz2bGg_aOopGle-';

// 스토어에 나오기 전에는 null이다. 나오면 채운다.
export const JOINY_APP_STORE_URL: string | null = null;
export const JOINY_ANDROID_PACKAGE = 'app.joiny.mobile';
export const JOINY_PLAY_PUBLISHED = false;

// 1단계 테스트(동행 테스트) 동안의 설치 주소. 스토어 주소가 있으면 그쪽이 먼저다.
// TestFlight 외부 테스트 공개 링크. 베타 앱 심사를 통과해 링크가 생기면 채운다.
export const JOINY_TESTFLIGHT_URL: string | null = null;
// Play 내부 테스트 참여 링크. 테스터 목록(이메일)에 있는 사람만 참여할 수 있다.
export const JOINY_PLAY_TEST_URL: string | null = 'https://play.google.com/apps/internaltest/4700560337491597907';

export interface JoinyInvitePreview {
  title: string;
  start_date: string;
  end_date: string;
  cities: { name_ko: string | null; name_en: string }[];
  inviter: string | null;
  members: string[];
  member_count: number;
  item_count: number;
  stash_count: number;
  full: boolean;
}

const TOKEN = /^[A-Za-z0-9_-]{16,128}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isInviteToken = (token: string) => TOKEN.test(token);
export const cleanFrom = (from: string | undefined | null) => (from && UUID.test(from) ? from : null);

/** 미리보기. 없거나 무효면 null, 불러오지 못하면 'error'. */
export async function fetchInvitePreview(token: string, from: string | null): Promise<JoinyInvitePreview | null | 'error'> {
  if (!isInviteToken(token)) return null;
  try {
    const res = await fetch(`${JOINY_SUPABASE_URL}/rest/v1/rpc/invite_preview`, {
      method: 'POST',
      headers: {
        apikey: JOINY_PUBLISHABLE_KEY,
        Authorization: `Bearer ${JOINY_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_token: token, p_from: from }),
      cache: 'no-store',
    });
    if (!res.ok) return 'error';
    return (await res.json()) as JoinyInvitePreview | null;
  } catch {
    return 'error';
  }
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function short(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}.${d} (${weekday})`;
}

/** "10.1 (목) – 10.4 (일) · 3박 4일" */
export function tripRange(start: string, end: string): string {
  const nights = Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000);
  const range = start === end ? short(start) : `${short(start)} – ${short(end)}`;
  return `${range} · ${nights === 0 ? '당일' : `${nights}박 ${nights + 1}일`}`;
}

export function cityNames(p: Pick<JoinyInvitePreview, 'cities'>): string {
  const names = p.cities.map((c) => c.name_ko ?? c.name_en);
  return names.length > 3 ? `${names.slice(0, 3).join(' · ')} 외 ${names.length - 3}곳` : names.join(' · ');
}

export function inviteHeadline(p: Pick<JoinyInvitePreview, 'inviter' | 'title'>): string {
  return p.inviter ? `${p.inviter} 님이 '${p.title}'에 초대했어요` : `'${p.title}'에 초대받았어요`;
}

/** Android 설치 뒤 이어가기: Play 스토어 링크에 토큰을 실어 앱이 install referrer로 읽는다. */
export function playStoreUrl(token: string, from: string | null): string {
  const referrer = new URLSearchParams(from ? { t: token, from } : { t: token }).toString();
  return `https://play.google.com/store/apps/details?id=${JOINY_ANDROID_PACKAGE}&referrer=${encodeURIComponent(referrer)}`;
}

export interface JoinyInstall {
  url: string;
  label: string;
  /** 설치한 뒤 할 일 */
  hint: string;
}

/**
 * 앱이 없는 사람에게 보여줄 설치 버튼. 스토어 → 테스트(TestFlight·Play 내부 테스트) 순서로 고르고, 둘 다 없으면 null.
 * Android가 아니면(아이폰·데스크톱) 아이폰 주소를 쓴다.
 */
export function joinyInstall(android: boolean, token: string, from: string | null): JoinyInstall | null {
  if (android) {
    if (JOINY_PLAY_PUBLISHED) {
      return { url: playStoreUrl(token, from), label: 'Google Play에서 받기', hint: '설치하면 이 초대로 바로 이어져요.' };
    }
    if (JOINY_PLAY_TEST_URL) {
      return {
        url: JOINY_PLAY_TEST_URL,
        label: '테스트 버전 받기',
        hint: "'테스터 되기'를 누르고 설치한 뒤, 받은 링크를 다시 눌러 주세요.",
      };
    }
    return null;
  }
  if (JOINY_APP_STORE_URL) {
    return { url: JOINY_APP_STORE_URL, label: 'App Store에서 받기', hint: '앱을 설치한 뒤 받은 링크를 다시 눌러 주세요. 바로 이어서 참여할 수 있어요.' };
  }
  if (JOINY_TESTFLIGHT_URL) {
    return {
      url: JOINY_TESTFLIGHT_URL,
      label: 'TestFlight로 받기',
      hint: 'TestFlight 앱을 먼저 설치한 뒤 Joiny를 받고, 받은 링크를 다시 눌러 주세요.',
    };
  }
  return null;
}

/** 구글 폰트에서 쓰는 글자만 받아 ImageResponse에 넣는다(기본 글꼴에는 한글이 없다). */
export async function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}
