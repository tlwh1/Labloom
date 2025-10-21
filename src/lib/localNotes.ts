import { Note, type NoteAttachment } from "../types/note";

const STORAGE_KEY = "labloom.localNotes";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadLocalNotes(): Note[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item) => typeof item === "object" && item !== null) as Note[];
  } catch (error) {
    console.warn("로컬 메모를 불러오지 못했습니다.", error);
    return [];
  }
}

export function saveLocalNotes(notes: Note[]) {
  if (!isBrowser()) return;

  const sanitize = (input: Note[]) =>
    input.map((note) => {
      const trimmedAttachments = note.attachments.map((attachment) => {
        const next: NoteAttachment = {
          id: attachment.id,
          name: attachment.name,
          size: attachment.size,
          type: attachment.type
        };

        if (attachment.previewUrl && !attachment.previewUrl.startsWith("data:")) {
          next.previewUrl = attachment.previewUrl;
        }

        if (attachment.dataUrl && !attachment.dataUrl.startsWith("data:")) {
          next.dataUrl = attachment.dataUrl;
        }

        return next;
      });

      const sanitizedContent = note.content.replace(/!\[([^\]]*)\]\(data:[^\)]+\)/g, "![$1](inline-image)");

      return {
        ...note,
        content: sanitizedContent,
        attachments: trimmedAttachments
      };
    });

  try {
    const serialized = JSON.stringify(sanitize(notes));
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    if (error instanceof DOMException && (error.name === "QuotaExceededError" || error.code === 22)) {
      console.warn("로컬 스토리지 용량이 초과되었습니다. 가장 오래된 메모부터 제거합니다.");
      const trimmed = sanitize(notes.slice(-5));
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      } catch (retryError) {
        console.warn("로컬 스토리지 정리 후에도 저장하지 못했습니다.", retryError);
      }
      return;
    }
    console.warn("로컬 메모를 저장하지 못했습니다.", error);
  }
}
