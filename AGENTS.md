# 저장소 가이드라인

Labloom은 간결하면서도 확장 가능한 포트폴리오를 목표로 합니다. 아래 지침을 따라 코드 품질과 협업 경험을 일정하게 유지해주세요.

## 프로젝트 구조 & 모듈 구성
- 주요 소스는 `src/`에 유지하고, 기능 단위로 UI 모듈을 구성합니다 (`src/sections/Hero`, `src/components/Button` 등).
- 공유 스타일은 `src/styles`, 데이터 기반 콘텐츠는 `src/content`에 보관합니다.
- 정적 자산(파비콘, 폰트, PDF 등)은 `public/`에 두고, 빌드 산출물(`dist/` 등)은 커밋하지 않습니다.
- 실행 구조를 `tests/`에서 미러링하고, 보조 스크립트는 실행 권한과 함께 `scripts/`에 둡니다.
- 루트 디렉터리는 설정 파일(`package.json`, `tsconfig.json`, 린터 구성)과 문서만 최소한으로 유지합니다.

## 빌드·테스트·개발 명령
- `npm install` — 의존성을 설치합니다. Node 20 LTS에 고정해 환경 차이를 줄입니다.
- `npm run dev` — Vite(또는 동등한 툴) 기반 개발 서버를 시작합니다.
- `npm run build` — 최적화된 정적 번들을 `dist/`에 생성합니다.
- `npm run preview` — 배포 전 프로덕션 번들을 로컬에서 점검합니다.
- `npm run test` — Vitest 기반 단위/컴포넌트 테스트를 커버리지와 함께 실행하고 CI에 연결합니다.

## 코딩 스타일 & 네이밍 컨벤션
- Prettier 기본값(2칸 들여쓰기, TS/JS 단일 인용부호)과 ESLint 추천 규칙을 적용하며, `.eslintrc.cjs`, `.prettierrc`를 루트에 둡니다.
- React 컴포넌트는 PascalCase(`HeroSection.tsx`), 커스텀 훅은 camelCase(`useScrollLock.ts`), 유틸 디렉터리는 kebab-case를 사용합니다.
- CSS Module 또는 Tailwind 레이어는 기능 폴더 범위로 제한하고, 전역 스타일은 `src/styles/base.css` 등에서만 관리합니다.

## 테스트 지침
- 단위/컴포넌트 검증에는 Vitest(`*.spec.tsx`), 핵심 사용자 여정에는 Playwright(`tests/e2e/*.spec.ts`)를 사용합니다.
- 명령 `vitest --coverage` 기반으로 문장 커버리지 80% 이상을 유지하고, 기준 이하에서는 빌드를 실패시킵니다.
- 스냅샷은 컴포넌트와 같은 위치에 두며, 의도적인 UI 변경 시에만 갱신합니다.

## 커밋 & PR 가이드
- Conventional Commits(`feat:`, `fix:`, `chore:` 등)을 따르고, 범위를 기능 폴더로 한정합니다 (`feat(hero): ...`). 내용은 한국어. 
- 형식은 영어 (`feat:`, `fix:`, `chore:` 등) 내용은 한국어로 명시.
- PR에는 문제 정의, 구현 요약, UI 변경 시 스크린샷/녹화 링크를 포함합니다.
- GitHub 이슈를 `Closes #ID`로 링크하고, 변화량은 300라인 내외로 유지해 리뷰 효율을 높입니다.

## 환경 변수 & 보안
- 실행 환경 변수는 `.env.local`에 저장하고, 안전한 기본값은 `config/defaults.ts`에 정의합니다.
- 필요한 키는 `/.env.example`에 문서화하고, 비밀 값이 유출되면 즉시 회전합니다.

## 커뮤니케이션 & 작업 기록
- 모든 작업 후 루트의 `WORKLOG.md`에 날짜, 변경 사항, 확인 결과를 추가합니다.
- 최종 답변 말미에는 반드시 세 줄을 보고합니다: 첫 줄 `git: feat(...)` 형식의 커밋 메모, 둘째 줄 `test: ...` 형식의 확인 방법 또는 결과, 셋째 줄 `next: ...` 형식으로 남은 후속 작업을 짧게 기록합니다. 완료된 작업이라면 `next: 완료`로 명시하세요.
- 위 형식을 지키지 못한 경우 즉시 후속 메시지로 수정 보고를 남깁니다.
