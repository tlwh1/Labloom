import { FormEvent, useMemo } from "react";
import { TagBadge } from "./TagBadge";
import { parseTagInput } from "../lib/tags";

export type NoteComposerDraft = {
  title: string;
  category: string;
  content: string;
  tagsInput: string;
};

type NoteComposerProps = {
  draft: NoteComposerDraft;
  onChange: (draft: NoteComposerDraft) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
};

export function NoteComposer({
  draft,
  onChange,
  onCancel,
  onSubmit,
  isSubmitting,
  error
}: NoteComposerProps) {
  const previewTags = useMemo(() => parseTagInput(draft.tagsInput), [draft.tagsInput]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel rounded-3xl p-6 flex flex-col gap-6 xl:max-h-[calc(100vh-6rem)] overflow-y-auto"
    >
      <header className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">새 메모 작성</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            제목과 내용을 입력하고 저장하면 목록에 메모가 추가됩니다.
          </p>
        </div>
        {error && (
          <p className="rounded-xl bg-red-50 text-red-600 border border-red-200 px-3 py-2 text-sm">
            {error}
          </p>
        )}
      </header>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">제목</span>
        <input
          type="text"
          className="rounded-2xl border border-[var(--color-border)] bg-white/80 dark:bg-slate-800/40 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent"
          value={draft.title}
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
          placeholder="예: Netlify Functions 에러 로그 정리"
          required
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            카테고리
          </span>
          <input
            type="text"
            className="rounded-2xl border border-[var(--color-border)] bg-white/80 dark:bg-slate-800/40 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent"
            value={draft.category}
            onChange={(event) => onChange({ ...draft, category: event.target.value })}
            placeholder="예: 백엔드"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            태그 (쉼표로 구분)
          </span>
          <input
            type="text"
            className="rounded-2xl border border-[var(--color-border)] bg-white/80 dark:bg-slate-800/40 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent"
            value={draft.tagsInput}
            onChange={(event) => onChange({ ...draft, tagsInput: event.target.value })}
            placeholder="예: netlify, postgres"
          />
        </label>
      </div>

      {previewTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previewTags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} variant="solid" />
          ))}
        </div>
      )}

      <label className="flex flex-col gap-2 flex-1">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          내용 (Markdown 지원)
        </span>
        <textarea
          className="rounded-2xl border border-[var(--color-border)] bg-white/80 dark:bg-slate-800/40 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent min-h-[12rem]"
          value={draft.content}
          onChange={(event) => onChange({ ...draft, content: event.target.value })}
          placeholder="핵심 메모를 적어주세요. 목록에서는 앞부분만 표시됩니다."
        />
      </label>

      <footer className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-slate-500 hover:bg-white transition"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          취소
        </button>
        <button
          type="submit"
          className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
        >
          {isSubmitting ? "저장 중..." : "메모 저장"}
        </button>
      </footer>
    </form>
  );
}
