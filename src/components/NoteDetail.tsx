import { useMemo } from "react";
import clsx from "clsx";
import dayjs from "../lib/dayjs";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Note } from "../types/note";
import { TagBadge } from "./TagBadge";

type NoteDetailProps = {
  note: Note | null;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  disableActions?: boolean;
  isDeleting?: boolean;
};

export function NoteDetail({ note, onEdit, onDelete, disableActions = false, isDeleting = false }: NoteDetailProps) {
  const rendered = useMemo(() => {
    if (!note) return "";
    const rawHtml = marked.parse(note.content, { breaks: true });
    if (typeof rawHtml !== "string") {
      return "";
    }
    return DOMPurify.sanitize(rawHtml);
  }, [note]);

  if (!note) {
    return (
      <section className="glass-panel rounded-3xl p-10 flex flex-col items-center justify-center text-slate-400 text-sm">
        메모를 선택하거나 새 메모를 생성해주세요.
      </section>
    );
  }

  return (
    <article className="glass-panel rounded-3xl p-6 flex flex-col gap-6 overflow-y-auto xl:max-h-[calc(100vh-6rem)]">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{note.category}</p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{note.title}</h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right text-xs text-slate-400 space-y-1">
              <p>
                작성:{" "}
                <time dateTime={note.createdAt}>{dayjs(note.createdAt).format("YYYY.MM.DD HH:mm")}</time>
              </p>
              <p>
                수정:{" "}
                <time dateTime={note.updatedAt}>{dayjs(note.updatedAt).format("YYYY.MM.DD HH:mm")}</time>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(note)}
                className="rounded-full border border-[var(--color-border)] bg-white/70 dark:bg-slate-800/40 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-200 hover:bg-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={disableActions}
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => onDelete(note)}
                className="rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-red-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={disableActions}
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} variant="solid" />
          ))}
        </div>
      </header>

      <section
        className="prose prose-slate dark:prose-invert max-w-none leading-relaxed"
        dangerouslySetInnerHTML={{ __html: rendered }}
      />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em]">
          Attachments
        </h3>
        {note.attachments.length === 0 ? (
          <p className="text-sm text-slate-400">첨부파일이 아직 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {note.attachments.map((attachment) => {
              const previewSource = attachment.previewUrl ?? attachment.dataUrl ?? "";
              const isImage =
                attachment.type?.startsWith("image/") ??
                (typeof previewSource === "string" && previewSource.startsWith("data:image"));

              return (
                <li
                  key={attachment.id ?? attachment.name}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] px-4 py-3 bg-white/60 dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-3">
                    {isImage && previewSource ? (
                      <img
                        src={previewSource}
                        alt={attachment.name}
                        className="h-12 w-12 rounded-xl object-cover border border-[var(--color-border)]"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl border border-dashed border-[var(--color-border)] flex items-center justify-center text-xs text-slate-400">
                        파일
                      </div>
                    )}

                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {attachment.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {(attachment.size / (1024 * 1024)).toFixed(2)} MB · {attachment.type}
                      </span>
                    </div>
                  </div>

                  {previewSource && (
                    <a
                      href={previewSource}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-accent hover:underline"
                      download={attachment.name}
                    >
                      {isImage ? "이미지 보기" : "파일 열기"}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="mt-auto rounded-2xl border border-dashed border-[var(--color-border)] p-4 text-xs text-slate-400 leading-relaxed">
        이 영역은 Markdown 렌더링과 첨부파일 메타정보 확인을 담당합니다. 향후 업로드·수정·삭제
        동작은 Netlify Functions의 API 연결 후 활성화될 예정입니다.
      </footer>
    </article>
  );
}
