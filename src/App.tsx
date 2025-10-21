import { useCallback, useEffect, useMemo, useState } from "react";
import { SidebarFilters } from "./components/SidebarFilters";
import { NoteList } from "./components/NoteList";
import { NoteDetail } from "./components/NoteDetail";
import { NoteComposer, type NoteComposerDraft } from "./components/NoteComposer";
import { mockNotes } from "./data/mockNotes";
import { Note } from "./types/note";
import { createNote, listNotes } from "./lib/api";
import type { NoteInput } from "./lib/api";
import { parseTagInput } from "./lib/tags";
import { createRandomId } from "./lib/id";

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
  const [allNotes, setAllNotes] = useState<Note[]>(mockNotes);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(mockNotes[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [composerDraft, setComposerDraft] = useState<NoteComposerDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  const filteredNotes = useMemo(
    () =>
      filterNotes(allNotes, {
        search,
        category: selectedCategory,
        tags: selectedTags
      }),
    [allNotes, search, selectedCategory, selectedTags]
  );

  const useRemoteApi = import.meta.env.VITE_USE_REMOTE_API === "true";

  const fetchNotes = useCallback(async () => {
    if (!useRemoteApi) {
      setAllNotes(mockNotes);
      setSelectedNoteId(mockNotes[0]?.id ?? null);
      setLoadError("Netlify Functions 연결을 설정하기 전까지는 목업 데이터를 사용합니다.");
      return;
    }

    setIsSyncing(true);
    try {
      const notes = await listNotes();
      if (Array.isArray(notes) && notes.length > 0) {
        setAllNotes(notes);
        setLoadError(null);
        setSelectedNoteId(notes[0]?.id ?? null);
      } else {
        setAllNotes([]);
        setLoadError("저장된 메모가 없습니다. 새 메모를 생성해보세요.");
        setSelectedNoteId(null);
      }
    } catch (error) {
      console.warn("원격 메모를 불러오지 못했습니다. mock 데이터로 대체합니다.", error);
      setAllNotes(mockNotes);
      setLoadError("Neon 연결을 확인하기 전까지는 목업 데이터를 사용합니다.");
      setSelectedNoteId(mockNotes[0]?.id ?? null);
    } finally {
      setIsSyncing(false);
    }
  }, [useRemoteApi]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    if (filteredNotes.length === 0) {
      setSelectedNoteId(null);
      return;
    }

    if (selectedNoteId === null) {
      if (!composerDraft) {
        setSelectedNoteId(filteredNotes[0]?.id ?? null);
      }
      return;
    }

    const stillVisible = filteredNotes.some((note) => note.id === selectedNoteId);
    if (!stillVisible) {
      setSelectedNoteId(composerDraft ? null : filteredNotes[0]?.id ?? null);
    }
  }, [filteredNotes, selectedNoteId, composerDraft]);

  const selectedNote = filteredNotes.find((note) => note.id === selectedNoteId) ?? null;

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleNewNote = () => {
    setComposerDraft({
      title: "",
      content: "",
      category: "",
      tagsInput: ""
    });
    setComposerError(null);
    setSelectedNoteId(null);
  };

  const handleManualSync = () => {
    void fetchNotes();
  };

  const handleSelectNote = useCallback(
    (id: string) => {
      setComposerDraft(null);
      setComposerError(null);
      setSelectedNoteId(id);
    },
    []
  );

  const handleCancelComposer = () => {
    setComposerDraft(null);
    setComposerError(null);
  };

  const handleComposerSubmit = useCallback(async () => {
    if (!composerDraft) return;

    const title = composerDraft.title.trim();
    if (!title) {
      setComposerError("제목을 입력해주세요.");
      return;
    }

    const tags = parseTagInput(composerDraft.tagsInput);
    const payload: NoteInput = {
      title,
      content: composerDraft.content,
      category: composerDraft.category.trim(),
      tags,
      attachments: []
    };

    const nowIso = new Date().toISOString();

    setComposerError(null);
    setIsSaving(true);

    try {
      let createdNote: Note | null = null;

      if (useRemoteApi) {
        createdNote = await createNote(payload);
      }

      const finalNote =
        createdNote ??
        {
          ...payload,
          id: createRandomId("note"),
          createdAt: nowIso,
          updatedAt: nowIso
        };

      setAllNotes((prev) => [finalNote, ...prev.filter((note) => note.id !== finalNote.id)]);
      setSelectedNoteId(finalNote.id);

      if (useRemoteApi && createdNote) {
        setLoadError(null);
      }

      setComposerDraft(null);
    } catch (error) {
      console.warn("메모 생성 중 문제가 발생했습니다. 임시 메모로 대체합니다.", error);

      const fallbackNote: Note = {
        ...payload,
        id: createRandomId("note"),
        createdAt: nowIso,
        updatedAt: nowIso
      };

      setAllNotes((prev) => [fallbackNote, ...prev.filter((note) => note.id !== fallbackNote.id)]);
      setSelectedNoteId(fallbackNote.id);
      setLoadError("원격 저장에 실패했습니다. 임시로 로컬에 추가했습니다.");
      setComposerDraft(null);
    } finally {
      setIsSaving(false);
    }
  }, [composerDraft, useRemoteApi]);

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
            {loadError && <span className="ml-2 text-accent font-medium">{loadError}</span>}
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
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSaving}
          >
            새 메모 만들기
          </button>
        </div>
      </header>

      <div className="relative grid grid-cols-1 gap-4 xl:grid-cols-[18rem,1fr,1.6fr] xl:gap-6 2xl:grid-cols-[18rem,1.2fr,1.8fr]">
        <SidebarFilters
          notes={allNotes}
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
          onSelect={handleSelectNote}
        />
        {composerDraft ? (
          <NoteComposer
            draft={composerDraft}
            onChange={(nextDraft) => setComposerDraft(nextDraft)}
            onCancel={handleCancelComposer}
            onSubmit={handleComposerSubmit}
            isSubmitting={isSaving}
            error={composerError}
          />
        ) : (
          <NoteDetail note={selectedNote} />
        )}
      </div>
    </div>
  );
}
