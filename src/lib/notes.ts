import { Note, NoteAttachment, NoteTag } from "../types/note";
import { createRandomId } from "./id";

export type NormalizableAttachment = Partial<NoteAttachment> & {
  id?: string;
  name?: string;
  size?: number;
  type?: string;
  previewUrl?: string;
  dataUrl?: string;
};

export type NormalizableNote = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  category?: string | null;
  tags?: NoteTag[] | null;
  attachments?: NormalizableAttachment[] | null;
};

export function normalizeAttachment(attachment: NormalizableAttachment): NoteAttachment {
  const fallbackPreview = attachment.previewUrl ?? attachment.dataUrl ?? "";
  const dataUrl =
    attachment.dataUrl ?? (fallbackPreview.startsWith("data:") ? fallbackPreview : undefined);

  return {
    id: attachment.id ?? createRandomId("att"),
    name: attachment.name?.trim() ? attachment.name.trim() : "첨부파일",
    size: typeof attachment.size === "number" && Number.isFinite(attachment.size) ? attachment.size : 0,
    type: attachment.type && attachment.type.trim().length > 0 ? attachment.type : "application/octet-stream",
    previewUrl: fallbackPreview || undefined,
    dataUrl
  };
}

export function normalizeNote(note: NormalizableNote): Note {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    category: note.category?.trim() ?? "",
    tags: Array.isArray(note.tags) ? note.tags : [],
    attachments: Array.isArray(note.attachments)
      ? note.attachments.map((attachment) => normalizeAttachment(attachment))
      : [],
    createdAt: note.createdAt,
    updatedAt: note.updatedAt
  };
}

export type NoteFilterOptions = {
  search: string;
  category: string | null;
  tags: string[];
};

export function filterNotes(notes: Note[], options: NoteFilterOptions) {
  const query = options.search.trim().toLowerCase();
  return notes.filter((note) => {
    const matchCategory = options.category ? note.category === options.category : true;
    const matchTags =
      options.tags.length === 0 || options.tags.every((tagId) => note.tags.some((tag) => tag.id === tagId));

    const searchable = `${note.title} ${note.content} ${note.tags.map((tag) => tag.label).join(" ")}`.toLowerCase();
    const matchQuery = query.length === 0 ? true : searchable.includes(query);

    return matchCategory && matchTags && matchQuery;
  });
}

export function sortNotesByUpdatedAt(notes: Note[]) {
  return [...notes].sort((a, b) => {
    const aTime = new Date(a.updatedAt).getTime();
    const bTime = new Date(b.updatedAt).getTime();
    return bTime - aTime;
  });
}

export function dedupeAttachments(existing: NoteAttachment[], incoming: NoteAttachment[]) {
  const result: NoteAttachment[] = [];
  const signatures = new Set<string>();

  const add = (attachment: NoteAttachment) => {
    const keyCandidates = [
      attachment.dataUrl,
      attachment.previewUrl,
      attachment.id,
      `${attachment.name}-${attachment.size}`
    ].filter(Boolean) as string[];

    if (keyCandidates.some((candidate) => signatures.has(candidate))) {
      return;
    }

    if (keyCandidates.length === 0) {
      keyCandidates.push(createRandomId("att-signature"));
    }

    keyCandidates.forEach((candidate) => signatures.add(candidate));
    result.push(attachment);
  };

  existing.forEach(add);
  incoming.forEach(add);

  return result;
}
