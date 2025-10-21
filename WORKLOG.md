# 작업 로그

> 최신 작업을 문서 상단에 추가해주세요.
## 2025-10-21 — 메모 작성 UI 및 API 토글
- `src/App.tsx`에 로컬/원격 API 전환(`VITE_USE_REMOTE_API`)을 도입하고, 새 메모 작성을 위한 `NoteComposer` 흐름과 임시 저장 로직을 추가.
- `src/components/NoteComposer.tsx`, `src/lib/tags.ts` 등 보조 유틸을 생성해 태그 파싱과 ID 생성을 모듈화.
- 확인: `npm run build` 실행 시 `tsc` 바이너리가 없어 실패(`tsc: not found`)하여 설치 후 재시도가 필요.

## 2025-10-21 — Netlify Functions & CRUD 기본기
- `netlify/functions`에 CRUD 함수(`notes-read/create/update/delete`)와 공통 유틸, Zod 검증을 추가.
- Neon용 SQL 스키마(`db/schema.sql`)와 Netlify 배포 설정(`netlify.toml`) 구성, API 클라이언트/프론트 연동.
- 확인: `npm install` 후 `npm run build`로 타입/번들 검증, Netlify Functions는 환경변수가 필요하므로 로컬에서 `NETLIFY_DATABASE_URL` 설정 후 `netlify dev`로 호출 점검.

## 2025-10-21 — 메모 웹앱 메인 UI 초기 구축
- Vite + React + Tailwind 기반 프로젝트 구조 생성(`package.json`, `tsconfig`, `vite.config.ts` 등).
- 3단 메모 레이아웃(필터·목록·상세)과 Markdown 렌더링, 태그/검색 필터 mock 데이터 연결.
- 확인: `npm install`, `npm run dev` 후 브라우저에서 필터/검색 인터랙션과 Markdown 렌더링 시각 확인.

## 2025-10-21 — 가이드라인 한글화 및 커뮤니케이션 규칙
- `AGENTS.md`를 한국어로 변환하고 작업 로그 및 응답 포맷 기준을 명시.
- `WORKLOG.md` 생성 및 향후 기록 절차 확립.
- 확인: `AGENTS.md` 언어 전환, `WORKLOG.md` 파일 생성 여부를 수동 검토.

## 2025-10-21 — Netlify 메인 페이지 초안
- `index.html`에 한국어 UI 기반 랜딩 페이지 추가.
- 메타 태그, 반응형 레이아웃, 다크 모드 스타일 정의.
- 확인: 브라우저에서 `index.html`을 열어 레이아웃과 CTA 동작을 점검.
