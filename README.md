# Labloom
Personal portfolio site

## Notes Console Quick Start

- 기본 개발 모드에서는 Netlify Functions 연결 여부와 상관없이 목업 데이터를 사용합니다.
- `.env.local`에 `VITE_USE_REMOTE_API=true`를 설정하면 `/netlify/functions` API로 메모를 불러오고 저장합니다.
- 원격 API가 실패하면 자동으로 목업 데이터로 대체되고, 저장 실패 시 임시 메모가 로컬 상태에 추가됩니다.

## Create A Note

1. 화면 우측 상단의 `새 메모 만들기` 버튼을 클릭합니다.
2. 제목, 카테고리, 쉼표로 구분한 태그, 내용을 입력합니다. Markdown을 지원합니다.
3. `메모 저장`을 누르면 목록 상단에 새 메모가 추가되며, 원격 저장이 활성화되어 있다면 Netlify Functions로 전송됩니다.
