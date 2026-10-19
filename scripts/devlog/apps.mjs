// 개발일지 대상 앱 목록. 단일 출처는 Threads 자동화의 config/apps.json(앱 이름·상태·레포 경로)이다 —
// 레포 경로는 이 머신에만 맞는 값이라 공개 저장소인 여기에는 두지 않는다.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const APPS_FILE =
  process.env.DEVLOG_APPS_FILE || path.join(os.homedir(), 'issol-threads/config/apps.json');

export function loadApps() {
  const cfg = JSON.parse(fs.readFileSync(APPS_FILE, 'utf8'));
  return cfg.apps
    .filter((a) => a.repo && fs.existsSync(path.join(a.repo, '.git')))
    .map((a) => ({
      key: a.key,
      name: a.name,
      ko: a.ko,
      status: a.status,
      released: a.released,
      platforms: a.platforms,
      oneLiner: a.oneLiner,
      features: a.features ?? [],
      repo: a.repo,
      branch: a.branch || 'main',
      productDoc: a.productDoc || 'docs/current-product.md',
    }));
}

export function appByKey(key) {
  const app = loadApps().find((a) => a.key === key);
  if (!app) throw new Error(`모르는 앱: ${key} (있는 것: ${loadApps().map((a) => a.key).join(', ')})`);
  return app;
}

export const APP_KEYS = () => loadApps().map((a) => a.key);
