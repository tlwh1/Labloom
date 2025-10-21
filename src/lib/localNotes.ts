import { Note, type NoteAttachment } from "../types/note";

const STORAGE_KEY = "labloom.localNotes";
const MAX_NOTES_TO_STORE = 10;

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

  const sanitize = (input: Note[]) => {
    const sorted = [...input].sort((a, b) => {
      const aTime = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const bTime = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      return bTime - aTime;
    });

    const limited = sorted.slice(0, MAX_NOTES_TO_STORE);

    return limited.map((note) => ({
      ...note,
      attachments: note.attachments.map((attachment) => ({ ...attachment }))
    }));
  };

  try {
    const serialized = JSON.stringify(sanitize(notes));
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    if (error instanceof DOMException && (error.name === "QuotaExceededError" || error.code === 22)) {
      console.warn("로컬 스토리지 용량이 초과되었습니다. 가장 오래된 메모부터 제거합니다.");
      const trimmed = sanitize(notes);
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
