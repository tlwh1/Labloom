import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { SidebarFilters } from "./components/SidebarFilters";
import { NoteList } from "./components/NoteList";
import { NoteDetail } from "./components/NoteDetail";
import { NoteComposer, type NoteComposerDraft } from "./components/NoteComposer";
import { mockNotes } from "./data/mockNotes";
import { Note } from "./types/note";
import { createNote, deleteNote, listNotes, updateNote } from "./lib/api";
import type { NoteInput } from "./lib/api";
import { parseTagInput } from "./lib/tags";
import { createRandomId } from "./lib/id";
import { loadLocalNotes, saveLocalNotes } from "./lib/localNotes";
import { filterNotes, normalizeNote, sortNotesByUpdatedAt } from "./lib/notes";

const normalizedMockNotes = sortNotesByUpdatedAt(mockNotes.map((note) => normalizeNote(note)));

export default function App() {
  const [initialNotes] = useState<Note[]>(() => {
    const stored = loadLocalNotes();
    if (stored.length > 0) {
      return sortNotesByUpdatedAt(stored.map((note) => normalizeNote(note)));
    }
    return normalizedMockNotes;
  });

  const [allNotes, setAllNotes] = useState<Note[]>(initialNotes);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(initialNotes[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [remoteHash, setRemoteHash] = useState<string | null>(null);
  const [localHash, setLocalHash] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modeMessage, setModeMessage] = useState<string>("");
  const [composerDraft, setComposerDraft] = useState<NoteComposerDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [composerMode, setComposerMode] = useState<"create" | "edit">("create");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const defaultRemotePreference =
    import.meta.env.VITE_USE_REMOTE_API === "true" ||
    (import.meta.env.DEV && import.meta.env.VITE_USE_REMOTE_API !== "false");
  const [remoteEnabled, setRemoteEnabled] = useState(defaultRemotePreference);

  useEffect(() => {
    setModeMessage(
      remoteEnabled
        ? "Netlify Functions에 연결된 원격 데이터 모드입니다."
        : "현재 로컬 데이터 모드입니다. Netlify Functions가 비활성 상태입니다."
    );
  }, [remoteEnabled]);

  useEffect(() => {
    setLocalHash(JSON.stringify(allNotes));
  }, [allNotes]);

  const filteredNotes = useMemo(
    () =>
      filterNotes(allNotes, {
        search,
        category: selectedCategory,
        tags: selectedTags
      }),
    [allNotes, search, selectedCategory, selectedTags]
  );

  const fetchNotes = useCallback(
    async ({ forceRemote = false }: { forceRemote?: boolean } = {}) => {
      const shouldUseRemote = forceRemote || remoteEnabled;

      if (!shouldUseRemote) {
        const stored = loadLocalNotes();
        const normalized =
          stored.length > 0 ? sortNotesByUpdatedAt(stored.map((note) => normalizeNote(note))) : normalizedMockNotes;
        setAllNotes(normalized);
        saveLocalNotes(normalized);
        setSelectedNoteId(normalized[0]?.id ?? null);
        setLoadError(null);
        setModeMessage("현재 로컬 데이터 모드입니다. Netlify Functions가 비활성 상태입니다.");
        setLocalHash(JSON.stringify(normalized));
        return;
      }

      setIsSyncing(true);
      try {
        const notes = await listNotes();
        if (Array.isArray(notes) && notes.length > 0) {
          const normalizedRemote = sortNotesByUpdatedAt(notes.map(normalizeNote));
          setAllNotes(normalizedRemote);
          saveLocalNotes(normalizedRemote);
          setSelectedNoteId(normalizedRemote[0]?.id ?? null);
          setLoadError(null);
          setModeMessage("Netlify Functions에 연결된 원격 데이터 모드입니다.");
          const hash = JSON.stringify(normalizedRemote);
          setRemoteHash(hash);
          setLocalHash(hash);
        } else {
          setAllNotes([]);
          saveLocalNotes([]);
          setLoadError("저장된 메모가 없습니다. 새 메모를 생성해보세요.");
          setSelectedNoteId(null);
          setModeMessage("원격 데이터가 비어 있어 로컬 상태로 유지합니다.");
          setRemoteHash("empty");
          setLocalHash("empty");
        }
        setRemoteEnabled(true);
      } catch (error) {
        setRemoteEnabled(false);
        setRemoteHash(null);
        const stored = loadLocalNotes();
        const normalized =
          stored.length > 0 ? sortNotesByUpdatedAt(stored.map((note) => normalizeNote(note))) : normalizedMockNotes;
        setAllNotes(normalized);
        saveLocalNotes(normalized);
        setLoadError(null);
        setModeMessage("Netlify Functions에 연결하지 못해 로컬 데이터 모드로 전환했습니다.");
        setSelectedNoteId(normalized[0]?.id ?? null);
        setLocalHash(JSON.stringify(normalized));
      } finally {
        setIsSyncing(false);
      }
    },
    [remoteEnabled]
  );

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

  const handleEditCurrentNote = useCallback(() => {
    const noteToEdit =
      selectedNote ?? (selectedNoteId ? allNotes.find((note) => note.id === selectedNoteId) ?? null : null);

    if (!noteToEdit) return;

    setComposerMode("edit");
    setEditingNoteId(noteToEdit.id);
    setComposerDraft({
      title: noteToEdit.title,
      content: noteToEdit.content,
      category: noteToEdit.category,
      tagsInput: noteToEdit.tags.map((tag) => tag.label).join(", "),
      attachments: noteToEdit.attachments.map((attachment) => ({ ...attachment }))
    });
    setComposerError(null);
  }, [selectedNote, selectedNoteId, allNotes]);

  const handleDeleteCurrentNote = useCallback(async () => {
    const noteToDelete =
      selectedNote ?? (selectedNoteId ? allNotes.find((note) => note.id === selectedNoteId) ?? null : null);

    if (!noteToDelete) return;

    const confirmed = window.confirm(`"${noteToDelete.title}" 메모를 삭제할까요?`);
    if (!confirmed) return;

    setIsDeleting(true);
    let remoteError = false;
    let attemptedRemote = false;

    try {
      if (remoteEnabled) {
        attemptedRemote = true;
        await deleteNote(noteToDelete.id);
        setRemoteEnabled(true);
        setLoadError(null);
        setModeMessage("Netlify Functions에 연결된 원격 데이터 모드입니다.");
      }
    } catch (error) {
      remoteError = true;
      console.warn("메모 삭제 중 문제가 발생했습니다. 로컬 데이터에서 제거합니다.", error);
      setRemoteEnabled(false);
    } finally {
        setAllNotes((prev) => {
          const next = prev.filter((note) => note.id !== noteToDelete.id);
          saveLocalNotes(next);
          setLocalHash(JSON.stringify(next));
          if (remoteEnabled && !remoteError) {
            setRemoteHash(JSON.stringify(next));
          }
          const fallbackId = next[0]?.id ?? null;
          setSelectedNoteId(fallbackId);
          return next;
        });
      setComposerDraft(null);
      setEditingNoteId(null);
      setComposerMode("create");
      setComposerError(null);
      setIsDeleting(false);

        if (remoteError) {
          setLoadError("원격 삭제에 실패했습니다. 로컬 데이터에서 제거했습니다.");
          setModeMessage("Netlify Functions에 연결하지 못해 로컬 데이터 모드로 전환했습니다.");
        } else if (attemptedRemote) {
          setLoadError(null);
          setModeMessage("Netlify Functions에 연결된 원격 데이터 모드입니다.");
        }
    }
  }, [selectedNote, selectedNoteId, allNotes, remoteEnabled]);

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
      tagsInput: "",
      attachments: []
    });
    setComposerError(null);
    setSelectedNoteId(null);
    setComposerMode("create");
    setEditingNoteId(null);
  };

  const canSync = remoteEnabled && remoteHash !== null && localHash !== null && remoteHash !== localHash;
  const isRemoteSynced = remoteEnabled && remoteHash !== null && localHash === remoteHash;

  const handleSyncIndicatorClick = () => {
    if (canSync && !isSyncing) {
      void fetchNotes({ forceRemote: true });
    }
  };

  const handleSelectNote = useCallback(
    (id: string) => {
      setComposerDraft(null);
      setComposerError(null);
      setSelectedNoteId(id);
      setEditingNoteId(null);
      setComposerMode("create");
    },
    []
  );

  const handleCancelComposer = () => {
    setComposerDraft(null);
    setComposerError(null);
    setEditingNoteId(null);
    setComposerMode("create");
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
      attachments: composerDraft.attachments
    };

    const nowIso = new Date().toISOString();

    setComposerError(null);
    setIsSaving(true);

    const isEditModeActive = composerMode === "edit" && editingNoteId !== null;

    if (isEditModeActive) {
      const existingNote = allNotes.find((note) => note.id === editingNoteId) ?? null;

      try {
        let updatedNote: Note | null = null;

        if (remoteEnabled) {
          const remoteNote = await updateNote(editingNoteId, payload);
          updatedNote = normalizeNote(remoteNote);
          setRemoteEnabled(true);
          setLoadError(null);
          setModeMessage("Netlify Functions에 연결된 원격 데이터 모드입니다.");
        }

        const finalNote = normalizeNote(
          updatedNote ?? {
            id: editingNoteId,
            title: payload.title,
            content: payload.content,
            category: payload.category ?? "",
            tags: payload.tags ?? [],
            attachments: payload.attachments ?? [],
            createdAt: existingNote?.createdAt ?? nowIso,
            updatedAt: nowIso
          }
        );

        setAllNotes((prev) => {
          const next = sortNotesByUpdatedAt([finalNote, ...prev.filter((note) => note.id !== finalNote.id)]);
          saveLocalNotes(next);
          setLocalHash(JSON.stringify(next));
          if (remoteEnabled && updatedNote) {
            setRemoteHash(JSON.stringify(next));
          }
          return next;
        });
        setSelectedNoteId(finalNote.id);
        setComposerDraft(null);
        setEditingNoteId(null);
        setComposerMode("create");
      } catch (error) {
        console.warn("메모 업데이트 중 문제가 발생했습니다. 로컬 데이터로 대체합니다.", error);
        setRemoteEnabled(false);

        const fallbackNote = normalizeNote({
          id: editingNoteId,
          title: payload.title,
          content: payload.content,
          category: payload.category ?? "",
          tags: payload.tags ?? [],
          attachments: payload.attachments ?? [],
          createdAt: existingNote?.createdAt ?? nowIso,
          updatedAt: nowIso
        });

        setAllNotes((prev) => {
          const next = sortNotesByUpdatedAt([fallbackNote, ...prev.filter((note) => note.id !== fallbackNote.id)]);
          saveLocalNotes(next);
          setLocalHash(JSON.stringify(next));
          return next;
        });
        setSelectedNoteId(fallbackNote.id);
        setLoadError("원격 업데이트에 실패했습니다. 로컬 데이터에만 반영했습니다.");
        setComposerDraft(null);
        setEditingNoteId(null);
        setComposerMode("create");
      } finally {
        setIsSaving(false);
      }

      return;
    }

    try {
      let createdNote: Note | null = null;

      if (remoteEnabled) {
        const remoteNote = await createNote(payload);
        createdNote = normalizeNote(remoteNote);
        setRemoteEnabled(true);
        setLoadError(null);
        setModeMessage("Netlify Functions에 연결된 원격 데이터 모드입니다.");
      }

      const finalNote = normalizeNote(
        createdNote ?? {
          id: createRandomId("note"),
          title: payload.title,
          content: payload.content,
          category: payload.category ?? "",
          tags: payload.tags ?? [],
          attachments: payload.attachments ?? [],
          createdAt: nowIso,
          updatedAt: nowIso
        }
      );

      setAllNotes((prev) => {
        const next = sortNotesByUpdatedAt([finalNote, ...prev.filter((note) => note.id !== finalNote.id)]);
        saveLocalNotes(next);
        const hash = JSON.stringify(next);
        setLocalHash(hash);
        if (remoteEnabled && createdNote) {
          setRemoteHash(hash);
        }
        return next;
      });
      setSelectedNoteId(finalNote.id);
      setComposerDraft(null);
      setComposerMode("create");
      setEditingNoteId(null);
    } catch (error) {
      console.warn("메모 생성 중 문제가 발생했습니다. 임시 메모로 대체합니다.", error);
      setRemoteEnabled(false);

      const fallbackNote = normalizeNote({
        ...payload,
        id: createRandomId("note"),
        createdAt: nowIso,
        updatedAt: nowIso
      });

      setAllNotes((prev) => {
        const next = sortNotesByUpdatedAt([fallbackNote, ...prev.filter((note) => note.id !== fallbackNote.id)]);
        saveLocalNotes(next);
        setLocalHash(JSON.stringify(next));
        return next;
      });
      setSelectedNoteId(fallbackNote.id);
      setLoadError("원격 저장에 실패했습니다. 임시로 로컬에 추가했습니다.");
      setComposerDraft(null);
      setComposerMode("create");
      setEditingNoteId(null);
    } finally {
      setIsSaving(false);
    }
  }, [composerDraft, composerMode, editingNoteId, remoteEnabled, allNotes]);

  const disableActions = isSaving || isDeleting;

  return (
    <div className="relative min-h-screen px-6 py-10 md:px-10 bg-[var(--color-background)]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-10 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-accent-muted/20 blur-3xl" />
      </div>

      <header className="relative mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Labloom Notes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Netlify Functions와 Neon(PostgreSQL)로 확장 가능한 메모 워크플로를 구축하는 중입니다.
            {loadError && <span className="ml-2 text-accent font-medium">{loadError}</span>}
          </p>
          {modeMessage && (
            <p
              className={clsx(
                "text-xs font-semibold",
                remoteEnabled
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-500/80 dark:text-amber-300/80"
              )}
            >
              {modeMessage}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSyncIndicatorClick}
            disabled={!canSync || isSyncing}
            className={clsx(
              "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition",
              canSync && !isSyncing
                ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
                : isRemoteSynced
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : remoteEnabled
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600",
              (!canSync || isSyncing) && "cursor-default"
            )}
          >
            <span
              className={clsx(
                "h-2 w-2 rounded-full",
                canSync && !isSyncing
                  ? "bg-amber-500 animate-pulse"
                  : isRemoteSynced
                    ? "bg-emerald-500"
                    : remoteEnabled
                      ? "bg-blue-500 animate-pulse"
                      : "bg-slate-400"
              )}
            />
            <span>
              {remoteEnabled
                ? isSyncing
                  ? "원격 동기화 중..."
                  : canSync
                    ? "원격과 차이 감지 · 클릭해 최신화"
                    : isRemoteSynced
                      ? "원격 데이터와 동기화 완료"
                      : "원격 상태 확인 중"
                : "로컬 데이터 전용 모드"}
            </span>
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
            mode={composerMode}
            draft={composerDraft}
            onChange={(nextDraft) => setComposerDraft(nextDraft)}
            onCancel={handleCancelComposer}
            onSubmit={handleComposerSubmit}
            isSubmitting={isSaving}
            error={composerError}
          />
        ) : (
          <NoteDetail
            note={selectedNote}
            onEdit={handleEditCurrentNote}
            onDelete={handleDeleteCurrentNote}
            disableActions={disableActions}
            isDeleting={isDeleting}
          />
        )}
      </div>
    </div>
  );
}
