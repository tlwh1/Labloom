import clsx from "clsx";
import dayjs from "../lib/dayjs";
import { Note } from "../types/note";
import { TagBadge } from "./TagBadge";

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
          return (
            <li key={note.id}>
              <button
                type="button"
                className={clsx(
                  "w-full text-left px-4 py-3 rounded-2xl transition flex flex-col gap-2 border",
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
                <p
                  className={clsx(
                    "text-sm line-clamp-2",
                    isActive ? "text-white/90" : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  {note.content.replace(/[#>*`]/g, "").slice(0, 120)}...
                </p>
                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <TagBadge key={tag.id} tag={tag} variant={isActive ? "light" : "solid"} />
                  ))}
                </div>
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
