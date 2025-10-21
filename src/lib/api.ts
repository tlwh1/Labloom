import { Note, NoteAttachment, NoteTag } from "../types/note";

const BASE_URL = "/.netlify/functions";

type ListParams = {
  search?: string;
  category?: string | null;
  tags?: string[];
};

export type NoteInput = {
  title: string;
  content: string;
  category?: string;
  tags?: NoteTag[];
  attachments?: NoteAttachment[];
};

async function request<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "요청을 처리하지 못했습니다.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function listNotes(params: ListParams = {}): Promise<Note[]> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.tags && params.tags.length > 0) query.set("tags", params.tags.join(","));

  return request<Note[]>(`notes-read${query.toString() ? `?${query.toString()}` : ""}`);
}

export async function createNote(payload: NoteInput): Promise<Note> {
  return request<Note>("notes-create", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateNote(id: string, payload: NoteInput): Promise<Note> {
  return request<Note>("notes-update", {
    method: "PUT",
    body: JSON.stringify({ id, ...payload })
  });
}

export async function deleteNote(id: string): Promise<{ id: string }> {
  return request<{ id: string }>(`notes-delete?id=${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}
