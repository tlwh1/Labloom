import { NoteTag } from "../types/note";
import { createRandomId } from "./id";

function slugify(label: string) {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug.length > 0 ? slug : createRandomId("tag");
}

export function parseTagInput(input: string): NoteTag[] {
  const unique = new Map<string, NoteTag>();

  input
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .forEach((raw) => {
      const label = raw.replace(/\s+/g, " ");
      const id = slugify(label);

      if (!unique.has(id)) {
        unique.set(id, { id, label });
      }
    });

  return Array.from(unique.values());
}
