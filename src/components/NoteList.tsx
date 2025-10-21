import clsx from "clsx";
import dayjs from "../lib/dayjs";
import { Note } from "../types/note";
import { TagBadge } from "./TagBadge";
import { marked } from "marked";
import DOMPurify from "dompurify";

type NoteListProps = {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function NoteList({ notes, selectedId, onSelect }: NoteListProps) {
  return (
    <section
      className="glass-panel rounded-3xl p-4 flex flex-col gap-3 overflow-y-auto xl:max-h-[calc(100vh-6rem)]"
      aria-label="메모 목록"
    >
      <header className="px-2">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em]">
          Notes ({notes.length})
        </h2>
      </header>
      <ul className="flex flex-col">
        {notes.map((note) => {
          const isActive = selectedId === note.id;
          const parsed = marked.parse(note.content ?? "", { breaks: true });
          const rawHtml = typeof parsed === "string" ? parsed : "";
          const hadInlineImages = /<img\s/i.test(rawHtml);
          const sanitizedPreview = rawHtml
            ? DOMPurify.sanitize(rawHtml, {
                FORBID_TAGS: ["img"]
              })
            : "";
          const previewHtml = hadInlineImages
            ? `${sanitizedPreview} <span class="ml-2 inline-flex items-center gap-1 rounded-full bg-slate-200/70 px-2 py-[0.1rem] text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-700/50 dark:text-slate-200">이미지</span>`
            : sanitizedPreview;
          const imageAttachments = note.attachments.filter((attachment) =>
            (attachment.type ?? "").startsWith("image/") || (attachment.previewUrl ?? attachment.dataUrl ?? "").startsWith("data:image")
          );
          return (
            <li key={note.id}>
              <button
                type="button"
                className={clsx(
                  "w-full text-left px-4 py-3 rounded-2xl transition flex flex-col gap-3 border",
                  isActive
                    ? "bg-accent text-white border-transparent shadow"
                    : "border-transparent glass-panel-hover"
                )}
                onClick={() => onSelect(note.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold truncate">{note.title}</h3>
                  <time
                    className={clsx(
                      "text-xs",
                      isActive ? "text-white/80" : "text-slate-400 dark:text-slate-500"
                    )}
                    dateTime={note.updatedAt}
                  >
                    {dayjs(note.updatedAt).fromNow()}
                  </time>
                </div>
                <div
                  className={clsx(
                    "text-sm note-preview min-h-[1.5rem] max-h-20 overflow-hidden",
                    isActive ? "text-white/90" : "text-slate-500 dark:text-slate-400"
                  )}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <TagBadge key={tag.id} tag={tag} variant={isActive ? "light" : "solid"} />
                  ))}
                </div>
                {imageAttachments.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {imageAttachments.slice(0, 3).map((attachment) => {
                        const src = attachment.previewUrl ?? attachment.dataUrl ?? "";
                        return (
                          <img
                            key={attachment.id ?? attachment.name}
                            src={src}
                            alt={attachment.name}
                            className={clsx(
                              "h-10 w-10 rounded-xl border border-white/60 object-cover shadow-sm",
                              isActive ? "border-white/70" : "border-[var(--color-border)]"
                            )}
                          />
                        );
                      })}
                    </div>
                    {imageAttachments.length > 3 && (
                      <span className={clsx("text-xs font-semibold", isActive ? "text-white/80" : "text-slate-400")}>
                        +{imageAttachments.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            </li>
          );
        })}
        {notes.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-slate-400">
            조건에 맞는 메모가 없습니다. 필터를 조정해보세요.
          </li>
        )}
      </ul>
    </section>
  );
}
