#!/usr/bin/env python3
"""두 호스트의 렌더 결과를 본문 수준에서 비교한다.

헤더 검증만으로는 런타임(Node 메이저) 차이로 생기는 숫자/날짜 표기 변화를
잡을 수 없다. toLocaleString('ko-KR') 같은 ICU 의존 출력이 그렇다.
"""
import re, sys, difflib, urllib.request

A = "https://daily1bite.com"
B = "https://daily-1-bite.vercel.app"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "migration-check"})
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")

def norm(s):
    s = s.replace(A, "<SITE>").replace(B, "<SITE>")
    s = re.sub(r"/_next/static/[^\"']*", "<ASSET>", s)
    s = re.sub(r"[?&][a-f0-9]{8,}\b", "", s)
    s = re.sub(r'<script src="[^"]*"[^>]*></script>', "<SCRIPT>", s)
    # 빌드마다 달라지는 것들 — 빌드 ID, 청크 해시. 서로 다른 빌드니 당연히 다르다.
    s = re.sub(r"static/chunks/[^\"\\\\]*", "<CHUNK>", s)
    s = re.sub(r'\\"b\\":\\"[^\\\\]*\\"', '\\\\"b\\\\":\\\\"<BUILD>\\\\"', s)
    s = re.sub(r"<!--[A-Za-z0-9_\-]{10,}-->", "<!--<BUILD>-->", s)
    # 태그 경계로 쪼개 diff 단위를 작게 만든다
    return [ln for ln in re.split(r"(?=<)", s) if ln.strip()]

paths = sys.argv[1:] or ["/ko", "/ko/blog", "/ko/stats", "/ko/blog/ai-tools/ai-3-2"]
bad = 0
for p in paths:
    try:
        a, b = norm(fetch(A + p)), norm(fetch(B + p))
    except Exception as e:
        print(f"{p:42} ERROR {e}")
        bad += 1
        continue
    d = [l for l in difflib.unified_diff(a, b, lineterm="", n=0)
         if l[:1] in "+-" and l[:3] not in ("+++", "---")]
    if not d:
        print(f"{p:42} ✅ 본문 동일 ({len(a)} 조각)")
    else:
        bad += 1
        print(f"{p:42} ⚠️ 차이 {len(d)}조각")
        for l in d[:12]:
            print("      " + l[:150])
sys.exit(1 if bad else 0)
