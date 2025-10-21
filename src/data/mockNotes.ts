import { Note } from "../types/note";
import dayjs from "../lib/dayjs";

const now = dayjs();

export const mockNotes: Note[] = [
  {
    id: "1",
    title: "모바일 UX 메모",
    content:
      "### 인터랙션 체크리스트\n- 햅틱 피드백 여부 확인\n- 접근성 라벨링 (VoiceOver)\n- 라이트/다크 모드 대비 비율\n\n> 다음 스프린트까지 상기 항목 점검하기",
    createdAt: now.subtract(2, "day").toISOString(),
    updatedAt: now.subtract(6, "hour").toISOString(),
    category: "리서치",
    tags: [
      { id: "ux", label: "UX" },
      { id: "mobile", label: "Mobile" }
    ],
    attachments: [
      {
        id: "att-1",
        name: "motion-reference.mp4",
        size: 6_553_600,
        type: "video/mp4"
      }
    ]
  },
  {
    id: "2",
    title: "포트폴리오 콘텐츠 구상",
    content:
      "- 대표 프로젝트 3개 선정\n- KPI 전후 비교 그래프 준비\n- 사용자 인터뷰 인용구 5개 추출\n\n**Todo**: Cloudinary 업로드 Flow 정리",
    createdAt: now.subtract(5, "day").toISOString(),
    updatedAt: now.subtract(2, "day").toISOString(),
    category: "브랜딩",
    tags: [
      { id: "branding", label: "브랜딩" },
      { id: "netlify", label: "Netlify" }
    ],
    attachments: [
      {
        id: "att-2",
        name: "wireframe-v2.fig",
        size: 2_448_640,
        type: "application/octet-stream"
      },
      {
        id: "att-3",
        name: "hero-mock.png",
        size: 1_048_576,
        type: "image/png",
        previewUrl: "https://images.unsplash.com/photo-1522199990770-6929e039bf0c?auto=format&fit=crop&w=600&q=80"
      }
    ]
  },
  {
    id: "3",
    title: "데이터 모델 정리",
    content:
      "```sql\nCREATE TABLE notes (\n  id uuid PRIMARY KEY,\n  title text NOT NULL,\n  content text,\n  category text,\n  tags text[],\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);\n```",
    createdAt: now.subtract(8, "day").toISOString(),
    updatedAt: now.subtract(1, "day").toISOString(),
    category: "백엔드",
    tags: [
      { id: "postgres", label: "PostgreSQL" },
      { id: "schema", label: "Schema" }
    ],
    attachments: []
  }
];
