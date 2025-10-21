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
  const url = `${BASE_URL}/${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  let rawBody: string | undefined;

  try {
    rawBody = await response.text();
  } catch (error) {
    throw new Error("응답 본문을 읽지 못했습니다.");
  }

  if (!response.ok) {
    const message = rawBody?.trim().length ? rawBody : "요청을 처리하지 못했습니다.";
    throw new Error(message);
  }

  if (response.status === 204 || rawBody === undefined || rawBody.length === 0) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const trimmedBody = rawBody.trimStart();
  const looksLikeHtml = trimmedBody.startsWith("<") && trimmedBody.toLowerCase().includes("<!doctype");

  if (!contentType.includes("application/json") || looksLikeHtml) {
    throw new Error("원격 함수가 JSON 대신 HTML을 반환했습니다. Netlify Functions 실행 여부를 확인하세요.");
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch (error) {
    throw new Error("응답이 JSON 형식이 아닙니다. 함수 URL을 다시 확인해주세요.");
  }
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
