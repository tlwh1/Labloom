# Labloom
Personal portfolio site

## Notes Console Quick Start

- `npm run dev`와 `netlify dev`를 동시에 실행하면 Vite 프론트엔드가 Netlify Functions에 프록시되어 바로 테스트할 수 있습니다.
- Functions가 로컬에서 실행되고 DB URL이 비어 있으면 `db/local-notes.json` 파일을 자동으로 사용해 CRUD 요청을 처리합니다.
- `.env.local`에 `VITE_USE_REMOTE_API=false`를 명시하면 함수 호출 없이 mock 데이터만으로 UI를 미리보기 할 수 있습니다.
- 원격 API 호출이 실패하면 mock 데이터로 자동 전환되며, 저장 실패 시 임시 메모가 로컬 상태에 추가됩니다.
- Functions를 찾지 못하는 상황이라면 브라우저 `localStorage`에 메모가 캐시되어 새로고침 후에도 작성 내용이 유지됩니다.
- 첨부파일은 브라우저에서 base64(Data URL)로 인코딩되어 저장되므로 1파일 10MB 이내만 허용됩니다.

## Create A Note

1. 화면 우측 상단의 `새 메모 만들기` 버튼을 클릭합니다.
2. 제목, 카테고리, 쉼표로 구분한 태그, 내용을 입력합니다. Markdown을 지원합니다.
3. 필요하면 파일 업로드 영역을 눌러 이미지·PDF 등을 추가하세요. 10MB 초과 파일은 무시됩니다.
4. `메모 저장`을 누르면 목록 상단에 새 메모가 추가되며, 원격 저장이 활성화되어 있다면 Netlify Functions로 전송됩니다.

## Update Or Delete

- 상세 화면 우측 상단에서 `수정`을 누르면 기존 내용을 편집할 수 있고, 저장 시 첨부파일 변경 사항까지 반영됩니다.
- `삭제`는 확인 창을 거쳐 진행되며, 원격 삭제가 실패하면 로컬 데이터에서만 제거하고 경고 메시지를 표시합니다.

## Attachments

- 업로드된 파일은 데이터 URL로 메모에 인라인 저장되며, Netlify Functions/Neon에 저장될 때도 같은 구조를 유지합니다.
- 이미지 파일은 상세 화면에서 썸네일과 함께 미리보기를 제공하며, 기타 파일은 새 탭에서 열리거나 다운로드됩니다.
- 로컬 전용으로 실행 중(`VITE_USE_REMOTE_API=false`)인 경우에도 첨부파일은 `localStorage`와 `db/local-notes.json`에 보존됩니다.

## Local JSON Store

- 로컬 테스트 시 데이터는 `db/local-notes.json`에 저장됩니다. 서버를 재시작해도 파일이 유지되므로 손쉽게 시나리오를 재현할 수 있습니다.
- 파일 경로를 바꾸고 싶다면 환경 변수 `LOCAL_NOTES_DB`에 새 경로를 지정하세요.
- Netlify Functions에 데이터베이스 URL이 설정되면 자동으로 PostgreSQL 연결로 전환됩니다.
