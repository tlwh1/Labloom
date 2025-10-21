import {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  useCallback,
  useEffect,
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
import TurndownService from "turndown";
import dayjs from "../lib/dayjs";
import { dedupeAttachments } from "../lib/notes";
import { formatBytes } from "../lib/format";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 총 8MB
const MIN_IMAGE_TARGET_BYTES = 200 * 1024;
const DEFAULT_IMAGE_TARGET_BYTES = 1.1 * 1024 * 1024;

const getAttachmentSize = (attachment: NoteAttachment) =>
  typeof attachment.size === "number" && Number.isFinite(attachment.size) ? attachment.size : 0;

const calculateTotalSize = (attachments: NoteAttachment[]) =>
  attachments.reduce((sum, attachment) => sum + getAttachmentSize(attachment), 0);

async function buildAttachmentWithinBudget(
  file: File,
  availableBudget: number,
  remainingCount: number
): Promise<NoteAttachment | null> {
  if (availableBudget <= 0) {
    return null;
  }

  const base: NoteAttachment = {
    id: createRandomId("att"),
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    previewUrl: undefined,
    dataUrl: undefined
  };

  const isImage = file.type.startsWith("image/");

  if (isImage) {
    const normalizedRemaining = Math.max(remainingCount, 1);
    const dynamicTarget = Math.max(
      MIN_IMAGE_TARGET_BYTES,
      Math.min(DEFAULT_IMAGE_TARGET_BYTES, Math.floor(availableBudget / normalizedRemaining) || availableBudget)
    );
    const primaryTarget = Math.min(dynamicTarget, availableBudget);

    const resizeWithTarget = (targetBytes: number, quality: number, maxDimension: number) =>
      resizeImageFile(file, {
        maxWidth: maxDimension,
        maxHeight: maxDimension,
        quality,
        maxBytes: Math.max(MIN_IMAGE_TARGET_BYTES, Math.floor(targetBytes)),
        minQuality: 0.4
      });

    let resized = await resizeWithTarget(primaryTarget, 0.8, 1600);

    if (resized.size > availableBudget) {
      if (availableBudget < MIN_IMAGE_TARGET_BYTES) {
        return null;
      }
      resized = await resizeWithTarget(Math.min(availableBudget, primaryTarget * 0.75), 0.7, 1400);
      if (resized.size > availableBudget) {
        return null;
      }
    }

    return {
      ...base,
      size: resized.size,
      type: resized.mimeType,
      previewUrl: resized.dataUrl,
      dataUrl: resized.dataUrl
    };
  }

  const dataUrl = await fileToDataUrl(file);
  const estimatedSize = estimateDataUrlSize(dataUrl) || file.size;

  if (estimatedSize > availableBudget) {
    return null;
  }

  return {
    ...base,
    size: estimatedSize,
    previewUrl: dataUrl,
    dataUrl
  };
}

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
  const isEditMode = mode === "edit";
  const editorRef = useRef<HTMLDivElement | null>(null);

  const turndown = useMemo(() => {
    const service = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced"
    });
    service.addRule("lineBreak", {
      filter: "br",
      replacement: () => "\n"
    });
    return service;
  }, []);

  const renderedHtml = useMemo(() => {
    const raw = marked.parse(draft.content, { breaks: true });
    if (typeof raw !== "string") return "";
    return DOMPurify.sanitize(raw);
  }, [draft.content]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== renderedHtml) {
      editor.innerHTML = renderedHtml;
    }
  }, [renderedHtml]);

  const syncMarkdownFromEditor = useCallback(
    (overrideAttachments?: NoteAttachment[]) => {
      const editor = editorRef.current;
      if (!editor) {
        onChange({
          ...draft,
          attachments: overrideAttachments ?? draft.attachments
        });
        return;
      }

      const sanitizedHtml = DOMPurify.sanitize(editor.innerHTML, {
        ADD_ATTR: ["target", "rel", "download"]
      });
      const markdown = turndown.turndown(sanitizedHtml);
      onChange({
        ...draft,
        content: markdown,
        attachments: overrideAttachments ?? draft.attachments
      });
    },
    [draft, onChange, turndown]
  );

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

    const existingSize = calculateTotalSize(draft.attachments);
    let remainingBudget = MAX_TOTAL_ATTACHMENT_BYTES - existingSize;

    if (remainingBudget <= MIN_IMAGE_TARGET_BYTES) {
      setAttachmentError("전체 첨부 용량은 최대 8MB입니다. 기존 첨부를 일부 정리한 뒤 다시 시도해주세요.");
      event.target.value = "";
      return;
    }

    setIsProcessingAttachments(true);

    try {
      const added: NoteAttachment[] = [];
      let skippedCount = 0;

      for (let index = 0; index < allowedFiles.length; index += 1) {
        const file = allowedFiles[index];
        try {
          const attachment = await buildAttachmentWithinBudget(
            file,
            remainingBudget,
            allowedFiles.length - index
          );

          if (!attachment) {
            skippedCount += 1;
            continue;
          }

          added.push(attachment);
          remainingBudget -= attachment.size;

          if (remainingBudget <= MIN_IMAGE_TARGET_BYTES) {
            break;
          }
        } catch (error) {
          skippedCount += 1;
          console.warn(`"${file.name}" 파일을 처리하지 못했습니다.`, error);
        }
      }

      if (added.length > 0) {
        const nextAttachments = dedupeAttachments(draft.attachments, added);
        syncMarkdownFromEditor(nextAttachments);
        setAttachmentError(
          skippedCount > 0
            ? "일부 파일은 8MB 첨부 한도를 넘어 제외했습니다."
            : null
        );
      } else if (skippedCount > 0) {
        setAttachmentError("첨부 가능 용량(8MB)을 초과해 파일을 추가하지 못했습니다.");
      }
    } catch (attachmentError) {
      console.error("첨부파일을 처리하지 못했습니다.", attachmentError);
    } finally {
      setIsProcessingAttachments(false);
      event.target.value = "";
    }
  };

  const handleAttachmentRemove = (id: string | undefined, index: number) => {
    const nextAttachments = draft.attachments.filter((attachment, attachmentIndex) =>
      id ? attachment.id !== id : attachmentIndex !== index
    );
    syncMarkdownFromEditor(nextAttachments);
  };

  const handleEditorInput = useCallback(() => {
    syncMarkdownFromEditor();
  }, [syncMarkdownFromEditor]);

  const handleContentPaste = useCallback(
    async (event: ClipboardEvent<HTMLDivElement>) => {
      const items = Array.from(event.clipboardData?.items ?? []);
      const imageFiles = items
        .filter((item) => item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null);

      if (imageFiles.length === 0) {
        setTimeout(() => {
          syncMarkdownFromEditor();
        }, 0);
        return;
      }

      event.preventDefault();
      const editor = editorRef.current;
      if (!editor) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      range.deleteContents();

      setIsProcessingAttachments(true);

      try {
        const fragment = document.createDocumentFragment();
        const textData = event.clipboardData?.getData("text/plain");
        if (textData) {
          fragment.appendChild(document.createTextNode(textData));
        }

        const addedAttachments: NoteAttachment[] = [];
        const existingSize = calculateTotalSize(draft.attachments);
        let remainingBudget = MAX_TOTAL_ATTACHMENT_BYTES - existingSize;

        if (remainingBudget <= MIN_IMAGE_TARGET_BYTES) {
          setAttachmentError("전체 첨부 용량은 최대 8MB입니다. 기존 첨부를 정리한 뒤 다시 시도해주세요.");
          setIsProcessingAttachments(false);
          return;
        }

        let skippedCount = 0;

        for (let index = 0; index < imageFiles.length; index += 1) {
          const file = imageFiles[index];
          try {
            const attachment = await buildAttachmentWithinBudget(
              file,
              remainingBudget,
              imageFiles.length - index
            );

            if (!attachment) {
              skippedCount += 1;
              continue;
            }

            const timestamp = dayjs().format("YYYYMMDD-HHmmss");
            const extension = file.name?.includes(".") ? file.name.split(".").pop() : attachment.type.split("/")[1];
            const label = `clipboard-${timestamp}-${index + 1}.${extension ?? "png"}`;

            const img = document.createElement("img");
            img.src = attachment.previewUrl ?? attachment.dataUrl ?? "";
            img.alt = label;
            img.style.maxWidth = "100%";
            img.style.borderRadius = "0.75rem";
            img.style.display = "block";
            img.style.margin = "0.5rem 0";
            fragment.appendChild(img);

            addedAttachments.push({
              ...attachment,
              name: label
            });
            remainingBudget -= attachment.size;

            if (remainingBudget <= MIN_IMAGE_TARGET_BYTES) {
              break;
            }
          } catch (error) {
            skippedCount += 1;
            console.warn(`클립보드 이미지 처리 중 오류가 발생했습니다.`, error);
          }
        }

        range.insertNode(fragment);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);

        const nextAttachments = dedupeAttachments(draft.attachments, addedAttachments);

        syncMarkdownFromEditor(nextAttachments);
        setAttachmentError(
          skippedCount > 0 ? "일부 이미지는 8MB 첨부 한도를 넘어 제외했습니다." : null
        );
      } finally {
        setIsProcessingAttachments(false);
      }
    },
    [draft.attachments, syncMarkdownFromEditor]
  );

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-3xl flex flex-col xl:max-h-[calc(100vh-6rem)]">
      <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
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

      <section className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          본문 (이미지를 직접 붙여넣을 수 있습니다)
        </span>
        <div
          ref={editorRef}
          className="rounded-2xl border border-[var(--color-border)] bg-white/80 dark:bg-slate-800/40 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent min-h-[12rem] whitespace-pre-wrap break-words"
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          onPaste={handleContentPaste}
          role="textbox"
          aria-multiline="true"
          aria-label="본문 편집기"
        />
      </section>

      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            첨부파일
          </h3>
          <span className="text-xs text-slate-400">{draft.attachments.length}개 추가됨</span>
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
                    {formatBytes(attachment.size)} · {attachment.type || "파일"}
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
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-white/0 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
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
        </div>
      </div>
    </form>
  );
}
