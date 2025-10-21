import { describe, expect, it } from "vitest";
import { normalizeAttachment, normalizeNote, filterNotes, sortNotesByUpdatedAt, dedupeAttachments } from "./notes";
import type { Note, NoteAttachment } from "../types/note";

describe("notes utilities", () => {
  it("normalizes attachment with sensible defaults", () => {
    const normalized = normalizeAttachment({
      name: "",
      size: undefined,
      type: "",
      previewUrl: "",
      dataUrl: undefined
    });

    expect(normalized.name).toBe("첨부파일");
    expect(normalized.size).toBe(0);
    expect(normalized.type).toBe("application/octet-stream");
    expect(normalized.id).toMatch(/^att-/);
  });

  it("normalizes note with empty fields", () => {
    const normalized = normalizeNote({
      id: "note-1",
      title: "제목",
      content: "내용",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
      category: null,
      tags: null,
      attachments: [
        {
          name: "자료.pdf",
          size: 1024,
          type: "application/pdf"
        }
      ]
    });

    expect(normalized.category).toBe("");
    expect(normalized.tags).toEqual([]);
    expect(normalized.attachments).toHaveLength(1);
  });

  it("filters notes by search, category and tags", () => {
    const notes: Note[] = [
      {
        id: "a",
        title: "React 메모",
        content: "Hook 정리",
        category: "프론트엔드",
        tags: [{ id: "react", label: "React" }],
        attachments: [],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z"
      },
      {
        id: "b",
        title: "네온 연결",
        content: "연결 문자열 메모",
        category: "백엔드",
        tags: [{ id: "postgres", label: "PostgreSQL" }],
        attachments: [],
        createdAt: "2024-01-03T00:00:00.000Z",
        updatedAt: "2024-01-04T00:00:00.000Z"
      }
    ];

    const filtered = filterNotes(notes, {
      search: "hook",
      category: "프론트엔드",
      tags: ["react"]
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("a");
  });

  it("sorts notes by updatedAt in descending order", () => {
    const notes: Note[] = [
      {
        id: "older",
        title: "",
        content: "",
        category: "",
        tags: [],
        attachments: [],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      },
      {
        id: "newer",
        title: "",
        content: "",
        category: "",
        tags: [],
        attachments: [],
        createdAt: "2024-01-02T00:00:00.000Z",
        updatedAt: "2024-01-03T00:00:00.000Z"
      }
    ];

    const sorted = sortNotesByUpdatedAt(notes);
    expect(sorted[0].id).toBe("newer");
  });

  it("deduplicates attachments using data identifiers", () => {
    const existing: NoteAttachment[] = [
      {
        id: "att-1",
        name: "이미지.png",
        size: 2048,
        type: "image/png",
        dataUrl: "data:image/png;base64,aaa"
      }
    ];

    const incoming: NoteAttachment[] = [
      {
        id: "att-2",
        name: "이미지.png",
        size: 2048,
        type: "image/png",
        dataUrl: "data:image/png;base64,aaa"
      },
      {
        id: "att-3",
        name: "다른.png",
        size: 4096,
        type: "image/png",
        dataUrl: "data:image/png;base64,bbb"
      }
    ];

    const deduped = dedupeAttachments(existing, incoming);
    expect(deduped).toHaveLength(2);
    expect(deduped.map((attachment) => attachment.id)).toEqual(["att-1", "att-3"]);
  });
});

