import {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  useCallback,
  useMemo,
  useRef,
  useState
} from "react";
import { TagBadge } from "./TagBadge";
import { parseTagInput } from "../lib/tags";
import { createRandomId } from "../lib/id";
import type { NoteAttachment } from "../types/note";
import { estimateDataUrlSize, fileToDataUrl, resizeImageFile } from "../lib/images";
import { marked } from "marked";
import DOMPurify from "dompurify";

export type NoteComposerDraft = {
  title: string;
  category: string;
  content: string;
  tagsInput: string;
  attachments: NoteAttachment[];
};

type NoteComposerProps = {
  draft: NoteComposerDraft;
  onChange: (draft: NoteComposerDraft) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
  mode: "create" | "edit";
};

export function NoteComposer({
  draft,
  onChange,
  onCancel,
  onSubmit,
  isSubmitting,
  error,
  mode
}: NoteComposerProps) {
  const previewTags = useMemo(() => parseTagInput(draft.tagsInput), [draft.tagsInput]);
  const [isProcessingAttachments, setIsProcessingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
  const isEditMode = mode === "edit";
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const renderedPreview = useMemo(() => {
    const raw = marked.parse(draft.content, { breaks: true });
    if (typeof raw !== "string") return "";
    return DOMPurify.sanitize(raw);
  }, [draft.content]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleAttachmentAdd = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const oversized = files.filter((file) => file.size > MAX_ATTACHMENT_SIZE);
    const allowedFiles = files.filter((file) => file.size <= MAX_ATTACHMENT_SIZE);

    if (oversized.length > 0) {
      setAttachmentError("각 첨부파일은 최대 10MB까지 업로드할 수 있습니다.");
    } else {
      setAttachmentError(null);
    }

    if (allowedFiles.length === 0) {
      event.target.value = "";
      return;
    }

    setIsProcessingAttachments(true);

    try {
      const processed = await Promise.all(
        allowedFiles.map(async (file) => {
          const base: NoteAttachment = {
            id: createRandomId("att"),
            name: file.name,
            size: file.size,
            type: file.type || "application/octet-stream",
            previewUrl: undefined,
            dataUrl: undefined
          };

          if (file.type.startsWith("image/")) {
            const resized = await resizeImageFile(file, {
              maxWidth: 1600,
              maxHeight: 1600,
              quality: 0.82
            });
            return {
              ...base,
              size: resized.size,
              type: resized.mimeType,
              previewUrl: resized.dataUrl,
              dataUrl: resized.dataUrl
            };
          }

          const dataUrl = await fileToDataUrl(file);
          return {
            ...base,
            size: estimateDataUrlSize(dataUrl) || file.size,
            previewUrl: dataUrl,
            dataUrl
          };
        })
      );

      onChange({
        ...draft,
        attachments: [...draft.attachments, ...processed]
      });
    } catch (attachmentError) {
      console.error("첨부파일을 처리하지 못했습니다.", attachmentError);
    } finally {
      setIsProcessingAttachments(false);
      event.target.value = "";
    }
  };

  const handleAttachmentRemove = (id: string | undefined, index: number) => {
    onChange({
      ...draft,
      attachments: draft.attachments.filter((attachment, attachmentIndex) =>
        id ? attachment.id !== id : attachmentIndex !== index
      )
    });
  };

  const handleContentPaste = useCallback(
    async (event: ClipboardEvent<HTMLTextAreaElement>) => {
      const items = Array.from(event.clipboardData?.items ?? []);
      const imageFiles = items
        .filter((item) => item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null);

      if (imageFiles.length === 0) {
        return;
      }

      event.preventDefault();

      const textarea = contentRef.current;
      if (!textarea) return;

      const selectionStart = textarea.selectionStart ?? draft.content.length;
      const selectionEnd = textarea.selectionEnd ?? draft.content.length;
      const before = draft.content.slice(0, selectionStart);
      const after = draft.content.slice(selectionEnd);

      const processed = await Promise.all(
        imageFiles.map(async (file, index) => {
          const resized = await resizeImageFile(file, {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.8
          });
          const label = file.name || `clipboard-image-${Date.now()}-${index + 1}`;
          return `![${label}](${resized.dataUrl})`;
        })
      );

      const textData = event.clipboardData?.getData("text/plain") ?? "";
      const segments = [
        textData.trim().length > 0 ? textData.trim() : null,
        ...processed
      ].filter(Boolean) as string[];

      const insertion = segments.join("\n\n");

      const needsLeading = before.length > 0 && !before.endsWith("\n") ? "\n\n" : "";
      const needsTrailing = after.length > 0 && !after.startsWith("\n") ? "\n\n" : "";

      const nextContent = `${before}${needsLeading}${insertion}${needsTrailing}${after}`;

      onChange({
        ...draft,
        content: nextContent
      });

      requestAnimationFrame(() => {
        const cursorPosition =
          selectionStart + needsLeading.length + insertion.length;
        const target = contentRef.current;
        if (target) {
          target.focus();
          target.setSelectionRange(cursorPosition, cursorPosition);
        }
      });
    },
    [draft, onChange]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel rounded-3xl p-6 flex flex-col gap-6 xl:max-h-[calc(100vh-6rem)] overflow-y-auto"
    >
      <header className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isEditMode ? "메모 수정" : "새 메모 작성"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isEditMode
              ? "내용과 첨부파일을 업데이트하고 저장하면 변경 사항이 반영됩니다."
              : "제목과 내용을 입력하고 저장하면 목록에 메모가 추가됩니다."}
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
          ref={contentRef}
          className="rounded-2xl border border-[var(--color-border)] bg-white/80 dark:bg-slate-800/40 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent min-h-[12rem]"
          value={draft.content}
          onChange={(event) => onChange({ ...draft, content: event.target.value })}
          onPaste={handleContentPaste}
          placeholder="핵심 메모를 적어주세요. 목록에서는 앞부분만 표시됩니다."
        />
      </label>

      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            미리보기
          </h3>
          <span className="text-xs text-slate-400">이미지는 실제 크기와 동일하게 표시됩니다.</span>
        </header>
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white/50 dark:bg-slate-900/30 px-4 py-3 overflow-auto">
          {draft.content.trim().length === 0 ? (
            <p className="text-xs text-slate-400">본문을 입력하거나 이미지를 붙여넣으면 여기서 바로 확인할 수 있어요.</p>
          ) : (
            <article
              className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderedPreview }}
            />
          )}
        </div>
      </section>

      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            첨부파일
          </h3>
          <span className="text-xs text-slate-400">
            {draft.attachments.length}개 추가됨
          </span>
        </header>

        <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--color-border)] bg-white/40 dark:bg-slate-800/30 px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-300 cursor-pointer hover:bg-white/70 transition">
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleAttachmentAdd}
            disabled={isSubmitting || isProcessingAttachments}
          />
          <svg
            className="h-8 w-8 text-accent"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          <div className="space-y-1">
            <p className="font-medium text-slate-600 dark:text-slate-200">
              파일을 드래그하거나 클릭해서 올려주세요
            </p>
            <p className="text-xs text-slate-400">
              이미지, PDF, 영상 등 최대 10MB (임시로 base64 데이터로 저장됩니다)
            </p>
          </div>
        </label>

        {draft.attachments.length > 0 && (
          <ul className="space-y-2">
            {draft.attachments.map((attachment, index) => (
              <li
                key={attachment.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-white/80 dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-600 dark:text-slate-200"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{attachment.name}</span>
                  <span className="text-xs text-slate-400">
                    {(attachment.size / (1024 * 1024)).toFixed(2)} MB · {attachment.type || "파일"}
                  </span>
                </div>
                <button
                  type="button"
                  className="text-xs text-accent hover:underline"
                  onClick={() => handleAttachmentRemove(attachment.id, index)}
                >
                  제거
                </button>
              </li>
            ))}
          </ul>
        )}

        {isProcessingAttachments && (
          <p className="text-xs text-accent">첨부파일을 변환하는 중입니다...</p>
        )}
        {attachmentError && <p className="text-xs text-red-500">{attachmentError}</p>}
      </section>

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
          disabled={isSubmitting || isProcessingAttachments}
        >
          {isSubmitting
            ? "저장 중..."
            : isProcessingAttachments
              ? "첨부 변환 중"
              : isEditMode
                ? "변경 사항 저장"
                : "메모 저장"}
        </button>
      </footer>
    </form>
  );
}
