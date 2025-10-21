import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { NotePayload, NoteUpdatePayload } from "./validation";

type StoredNote = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: Array<{ id: string; label: string }>;
  attachments: Array<{
    id?: string;
    name: string;
    size: number;
    type: string;
    previewUrl?: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

type QueryFilters = {
  search?: string;
  category?: string;
  tags?: string[];
};

const LOCAL_DB_PATH =
  process.env.LOCAL_NOTES_DB ?? path.join(process.cwd(), "db", "local-notes.json");

async function ensureStore(): Promise<StoredNote[]> {
  try {
    const raw = await fs.readFile(LOCAL_DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((note) => ({
        ...note,
        tags: Array.isArray(note.tags) ? note.tags : [],
        attachments: Array.isArray(note.attachments) ? note.attachments : [],
        createdAt: typeof note.createdAt === "string" ? note.createdAt : new Date().toISOString(),
        updatedAt: typeof note.updatedAt === "string" ? note.updatedAt : new Date().toISOString()
      }));
    }
    return [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await fs.mkdir(path.dirname(LOCAL_DB_PATH), { recursive: true });
      await fs.writeFile(LOCAL_DB_PATH, "[]", "utf8");
      return [];
    }
    throw error;
  }
}

async function writeStore(notes: StoredNote[]) {
  await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(notes, null, 2), "utf8");
}

function matchesFilters(note: StoredNote, filters: QueryFilters) {
  const search = filters.search?.trim().toLowerCase() ?? "";
  const category = filters.category?.trim();
  const tagFilters = filters.tags?.filter(Boolean) ?? [];

  const matchCategory = category ? note.category === category : true;
  const matchSearch =
    search.length === 0
      ? true
      : `${note.title} ${note.content} ${note.tags.map((tag) => tag.label).join(" ")}`
          .toLowerCase()
          .includes(search);

  const matchTags =
    tagFilters.length === 0 ||
    tagFilters.every((tagId) => note.tags.some((tag) => tag.id === tagId));

  return matchCategory && matchSearch && matchTags;
}

export async function localGetNote(id: string) {
  const notes = await ensureStore();
  return notes.find((note) => note.id === id) ?? null;
}

export async function localListNotes(filters: QueryFilters = {}) {
  const notes = await ensureStore();
  return notes.filter((note) => matchesFilters(note, filters)).sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export async function localCreateNote(payload: NotePayload) {
  const notes = await ensureStore();
  const now = new Date().toISOString();
  const id = typeof randomUUID === "function" ? randomUUID() : `note-${Date.now()}`;

  const newNote: StoredNote = {
    id,
    title: payload.title,
    content: payload.content,
    category: payload.category ?? "",
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
    createdAt: now,
    updatedAt: now
  };

  notes.push(newNote);
  await writeStore(notes);

  return newNote;
}

export async function localUpdateNote(payload: NoteUpdatePayload) {
  const notes = await ensureStore();
  const index = notes.findIndex((note) => note.id === payload.id);

  if (index === -1) {
    return null;
  }

  const updated: StoredNote = {
    ...notes[index],
    title: payload.title,
    content: payload.content,
    category: payload.category ?? "",
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
    updatedAt: new Date().toISOString()
  };

  notes[index] = updated;
  await writeStore(notes);

  return updated;
}

export async function localDeleteNote(id: string) {
  const notes = await ensureStore();
  const next = notes.filter((note) => note.id !== id);

  if (next.length === notes.length) {
    return null;
  }

  await writeStore(next);
  return id;
}
