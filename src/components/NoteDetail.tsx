import { useMemo } from "react";
import clsx from "clsx";
import dayjs from "../lib/dayjs";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Note } from "../types/note";
import { TagBadge } from "./TagBadge";

type NoteDetailProps = {
  note: Note | null;
};

export function NoteDetail({ note }: NoteDetailProps) {
  const rendered = useMemo(() => {
    if (!note) return "";
    const rawHtml = marked.parse(note.content, { breaks: true });
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
            {note.attachments.map((attachment) => (
              <li
                key={attachment.id ?? attachment.name}
                className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] px-4 py-3 bg-white/60 dark:bg-slate-800/40"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {attachment.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {(attachment.size / (1024 * 1024)).toFixed(2)} MB · {attachment.type}
                  </span>
                </div>
                {attachment.previewUrl && (
                  <a
                    href={attachment.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-accent hover:underline"
                  >
                    미리보기
                  </a>
                )}
              </li>
            ))}
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
