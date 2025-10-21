import { Note } from "../types/note";

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

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.warn("로컬 메모를 저장하지 못했습니다.", error);
  }
}
