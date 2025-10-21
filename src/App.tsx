import { useEffect, useMemo, useState } from "react";
import { SidebarFilters } from "./components/SidebarFilters";
import { NoteList } from "./components/NoteList";
import { NoteDetail } from "./components/NoteDetail";
import { mockNotes } from "./data/mockNotes";
import { Note } from "./types/note";

function filterNotes(
  notes: Note[],
  options: {
    search: string;
    category: string | null;
    tags: string[];
  }
) {
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

export default function App() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(mockNotes[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const filteredNotes = useMemo(
    () =>
      filterNotes(mockNotes, {
        search,
        category: selectedCategory,
        tags: selectedTags
      }),
    [search, selectedCategory, selectedTags]
  );

  useEffect(() => {
    if (filteredNotes.length === 0) {
      setSelectedNoteId(null);
      return;
    }

    const stillVisible = filteredNotes.some((note) => note.id === selectedNoteId);
    if (!stillVisible) {
      setSelectedNoteId(filteredNotes[0]?.id ?? null);
    }
  }, [filteredNotes, selectedNoteId]);

  const selectedNote = filteredNotes.find((note) => note.id === selectedNoteId) ?? null;

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleNewNote = () => {
    setSelectedNoteId(null);
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    window.setTimeout(() => setIsSyncing(false), 1200);
  };

  return (
    <div className="relative min-h-screen px-6 py-10 md:px-10 bg-[var(--color-background)]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-10 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-accent-muted/20 blur-3xl" />
      </div>

      <header className="relative mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Labloom Notes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Netlify Functions와 Neon(PostgreSQL)로 확장 가능한 메모 워크플로를 구축하는 중입니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleManualSync}
            className="rounded-full border border-[var(--color-border)] bg-white/70 dark:bg-slate-800/40 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-200 transition hover:bg-white"
          >
            {isSyncing ? "동기화 중..." : "수동 동기화"}
          </button>
          <button
            type="button"
            onClick={handleNewNote}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow hover:shadow-lg transition"
          >
            새 메모 만들기
          </button>
        </div>
      </header>

      <div className="relative grid grid-cols-1 gap-4 xl:grid-cols-[18rem,1fr,1.6fr] xl:gap-6 2xl:grid-cols-[18rem,1.2fr,1.8fr]">
        <SidebarFilters
          notes={mockNotes}
          selectedCategory={selectedCategory}
          selectedTags={selectedTags}
          onCategoryChange={setSelectedCategory}
          onTagToggle={handleTagToggle}
          search={search}
          onSearchChange={setSearch}
        />
        <NoteList
          notes={filteredNotes}
          selectedId={selectedNoteId}
          onSelect={setSelectedNoteId}
        />
        <NoteDetail note={selectedNote} />
      </div>
    </div>
  );
}
