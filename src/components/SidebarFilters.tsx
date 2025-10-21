import { useMemo } from "react";
import { Note } from "../types/note";
import clsx from "clsx";

type SidebarFiltersProps = {
  notes: Note[];
  selectedCategory: string | null;
  selectedTags: string[];
  onCategoryChange: (category: string | null) => void;
  onTagToggle: (tagId: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
};

type TagMeta = {
  id: string;
  label: string;
  count: number;
};

export function SidebarFilters({
  notes,
  selectedCategory,
  selectedTags,
  onCategoryChange,
  onTagToggle,
  search,
  onSearchChange
}: SidebarFiltersProps) {
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    notes.forEach((note) => {
      if (!note.category) return;
      counts.set(note.category, (counts.get(note.category) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  }, [notes]);

  const tags = useMemo(() => {
    const tagMap = new Map<string, TagMeta>();
    notes.forEach((note) => {
      note.tags.forEach((tag) => {
        const current = tagMap.get(tag.id);
        if (current) {
          current.count += 1;
        } else {
          tagMap.set(tag.id, { id: tag.id, label: tag.label, count: 1 });
        }
      });
    });
    return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
  }, [notes]);

  return (
    <aside className="glass-panel glass-panel-hover rounded-3xl p-6 flex flex-col gap-6 w-full lg:w-72">
      <header className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em]">
          Labloom
        </span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Notes Console</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          태그와 카테고리로 빠르게 정리하고, 첨부파일까지 한 번에 관리하세요.
        </p>
      </header>

      <label className="flex items-center gap-2 rounded-full bg-white/60 dark:bg-slate-800/40 border border-[var(--color-border)] px-4 py-2 focus-within:ring-2 focus-within:ring-accent focus-within:bg-white/90">
        <svg
          className="w-4 h-4 text-slate-400"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <input
          className="bg-transparent flex-1 text-sm outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
          type="search"
          placeholder="제목, 내용, 태그 검색"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">
            Categories
          </h2>
          <button
            className="text-xs text-accent hover:underline"
            type="button"
            onClick={() => onCategoryChange(null)}
          >
            전체
          </button>
        </header>
        <ul className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <li key={category.name}>
              <button
                type="button"
                className={clsx(
                  "rounded-full px-3 py-1 text-sm border transition",
                  selectedCategory === category.name
                    ? "bg-accent text-white border-transparent shadow"
                    : "bg-white/50 dark:bg-slate-800/30 border-[var(--color-border)] text-slate-600 dark:text-slate-300 hover:bg-white"
                )}
                onClick={() =>
                  onCategoryChange(selectedCategory === category.name ? null : category.name)
                }
              >
                {category.name}
                <span className="ml-1 text-xs opacity-70">({category.count})</span>
              </button>
            </li>
          ))}
          {categories.length === 0 && (
            <li className="text-sm text-slate-400">등록된 카테고리가 없습니다.</li>
          )}
        </ul>
      </section>

      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">
            Tags
          </h2>
          <span className="text-xs text-slate-400">총 {tags.length}개</span>
        </header>
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag.id}>
              <button
                type="button"
                className={clsx(
                  "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
                  selectedTags.includes(tag.id)
                    ? "bg-accent text-white border-transparent shadow"
                    : "bg-transparent border-[var(--color-border)] text-slate-500 hover:bg-[var(--color-accent-muted)] hover:text-slate-900"
                )}
                onClick={() => onTagToggle(tag.id)}
              >
                #{tag.label}
                <span className="ml-1 text-[0.65rem] opacity-70">{tag.count}</span>
              </button>
            </li>
          ))}
          {tags.length === 0 && <li className="text-sm text-slate-400">태그가 없습니다.</li>}
        </ul>
      </section>

      <footer className="mt-auto pt-4 border-t border-dashed border-[var(--color-border)] text-xs text-slate-400 leading-relaxed">
        Neon(PostgreSQL)과 Netlify Functions에 연결되어 있으며, 업로드/검색/태그 기능이 순차적으로
        추가될 예정입니다.
      </footer>
    </aside>
  );
}
