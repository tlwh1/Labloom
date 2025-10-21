# 작업 로그

> 최신 작업을 문서 상단에 추가해주세요.
## 2025-10-22 — 첨부 용량 관리
- NoteComposer에 총 첨부 용량 8MB 한도를 도입하고, 업로드/붙여넣기 시 남은 예산을 계산해 이미지 품질을 자동으로 조정하거나 초과분을 제외하도록 개선했습니다.
- 첨부 용량 초과 상황에 대한 메시지를 추가하고, 일부 파일이 제외된 경우 사용자에게 명확히 안내합니다.
- Netlify Functions 응답이 거대해지는 문제를 예방하기 위해 이미지 압축 목표 용량을 동적으로 줄였으며, clip보드 업로드에도 동일한 예산 로직을 적용했습니다.
- 확인: `npx tsc --noEmit` 통과, `npm run test`, `npm run build`, `npm run lint`는 WSL의 `@rollup/rollup-linux-x64-gnu` 및 `@typescript-eslint/parser` 미설치로 실패.

## 2025-10-22 — 이미지 뷰어 모달 도입
- `src/components/ImageViewerModal.tsx`를 신설해 첨부 이미지 전용 팝업을 구현하고, 키보드(←/→/ESC) 내비게이션과 단일/전체 저장 버튼을 제공했습니다.
- NoteDetail에서 이미지 첨부 클릭 시 모달을 호출하도록 변경하고(`이미지 뷰어` 버튼), 미리보기 섹션에 이미지 개수를 배지로 노출했습니다.
- 다운로드는 data URL 또는 원격 미리보기 URL을 Blob으로 변환해 직접 저장하도록 처리하며, 전체 저장 시 연속 다운로드가 발생하도록 간격을 두어 브라우저 차단을 최소화했습니다.
- 확인: `npx tsc --noEmit` 통과, `npm run test`, `npm run build`, `npm run lint`는 WSL의 `@rollup/rollup-linux-x64-gnu` 및 `@typescript-eslint/parser` 미설치로 실패.

## 2025-10-22 — 노트 상세 표기 및 목록 프리뷰 개선
- NoteDetail에서 작성/수정 시간이 동일한 경우 수정 시각 표기를 숨겨 중복 정보를 제거했고, NoteList 본문 프리뷰에서는 DOMPurify 옵션으로 `<img>` 태그를 제외해 섬네일과 본문 이미지가 겹쳐 보이지 않도록 조정했습니다.
- 인라인 이미지가 제거된 노트 프리뷰에는 `이미지` 배지를 추가해 내용에 사진이 포함된 메모임을 한눈에 확인할 수 있게 했습니다.
- 초기 로드 시에도 `sortNotesByUpdatedAt`를 적용해 로컬 저장 메모가 최신순으로 정렬되도록 맞췄습니다.
- 확인: `npx tsc --noEmit` 통과, `npm run test`, `npm run build`, `npm run lint`는 WSL의 `@rollup/rollup-linux-x64-gnu` 및 `@typescript-eslint/parser` 미설치로 계속 실패.

## 2025-10-22 — 메모 유틸 모듈화 및 품질 보강
- `src/lib/notes.ts`에서 메모 정규화·정렬·중복 첨부 제거 유틸을 모듈화하고, `App.tsx`는 해당 유틸을 사용해 원격/로컬 데이터를 일관된 정렬로 노출하도록 개선.
- 첨부파일 용량 출력을 `formatBytes`(신규)로 통일하고, NoteDetail/NoteComposer UI의 빈 카테고리 표기와 첨부 출력 품질을 손봤습니다.
- Vitest 기반 단위 테스트(`src/lib/notes.spec.ts`, `src/lib/format.spec.ts`)를 추가해 필터링, 정규화, 포맷 로직을 검증하고 `npx tsc --noEmit`으로 타입 검사를 통과시켰습니다.
- 확인: `npm run test`, `npm run build`, `npm run lint`는 WSL 환경에서 `@rollup/rollup-linux-x64-gnu`와 `@typescript-eslint/parser` 미설치로 실패하며, 원복을 위해 해당 패키지 재설치가 필요합니다.
## 2025-10-21 — 메모 작성 UI 및 API 토글
- `src/App.tsx`에 로컬/원격 API 전환(`VITE_USE_REMOTE_API`)을 도입하고, 새 메모 작성을 위한 `NoteComposer` 흐름과 임시 저장 로직을 추가.
- `src/components/NoteComposer.tsx`, `src/lib/tags.ts` 등 보조 유틸을 생성해 태그 파싱과 ID 생성을 모듈화.
- Netlify Functions에서 DB URL이 비어 있을 때 `db/local-notes.json` 파일을 활용하는 로컬 스토리지(`netlify/functions/_shared/local-store.ts`)를 추가하고, CRUD 함수 전반에 적용.
- 원격/로컬 생성 시 `category` 등의 필드를 보정하는 `normalizeNote` 유틸을 적용해 타입 빌드 오류를 해결.
- 프론트엔드에서 원격 API 실패 시 `localStorage`에 메모를 캐시해 새로고침 후에도 데이터가 유지되도록 보완.
- 새 메모 작성 폼에 첨부파일 업로드 UI(`src/components/NoteComposer.tsx`)를 추가하고, Data URL 기반으로 저장·미리보기할 수 있도록 상세 화면을 확장.
- 메모 수정·삭제 흐름을 도입해(`src/App.tsx`, `src/components/NoteDetail.tsx`) 원격 API와 로컬 저장소가 모두 동기화되도록 처리.
- 본문 입력 영역에서 이미지 붙여넣기를 지원하고(`src/components/NoteComposer.tsx`), 1600px 기준으로 리사이징해 인라인 Markdown으로 삽입되도록 구성.
- 본문 편집 영역을 WYSIWYG 방식으로 전환해 이미지 붙여넣기 시 즉시 확인하고 Markdown은 내부적으로만 관리되도록 개선.
- 메모 목록 카드에 인라인 미리보기와 썸네일(최대 3개, 나머지 개수 표시)을 추가하고, Markdown 이미지가 원문 대신 바로 렌더링되도록 처리.
- 로컬 스토리지 저장 시 base64 본문/첨부를 제거해 용량 초과를 방지하고, 초과 발생 시 최근 5개만 보존하도록 방어 로직을 추가.
- 원격 API 호출 실패 시 로컬 모드로 자동 전환하면서 헤더에 현재 모드(원격/로컬)를 안내하도록 개선.
- Turndown 타입 정의(`@types/turndown`)를 추가해 Netlify 빌드의 타입 오류를 해결.
- 헤더에서 수동 동기화 버튼을 제거하고, 원격/로컬 상태와 동기화 필요 여부를 자동 표시하는 인디케이터로 대체.
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
