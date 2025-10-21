import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { NoteAttachment } from "../types/note";
import { formatBytes } from "../lib/format";

type ImageViewerModalProps = {
  attachments: NoteAttachment[];
  initialIndex: number;
  onClose: () => void;
};

function dataUrlToBlob(dataUrl: string) {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) {
    return new Blob();
  }

  const meta = dataUrl.slice(0, commaIndex);
  const base64 = dataUrl.slice(commaIndex + 1);
  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] ?? "application/octet-stream";
  const binary = atob(base64);
  const length = binary.length;
  const bytes = new Uint8Array(length);

  for (let index = 0; index < length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

async function resolveAttachmentBlob(attachment: NoteAttachment) {
  if (attachment.dataUrl) {
    return dataUrlToBlob(attachment.dataUrl);
  }
  if (attachment.previewUrl) {
    const response = await fetch(attachment.previewUrl);
    if (!response.ok) {
      return null;
    }
    return response.blob();
  }
  return null;
}

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  requestAnimationFrame(() => {
    URL.revokeObjectURL(objectUrl);
    anchor.remove();
  });
}

export function ImageViewerModal({ attachments, initialIndex, onClose }: ImageViewerModalProps) {
  const sanitizedAttachments = useMemo(
    () =>
      attachments.filter((attachment) => {
        const src = attachment.previewUrl ?? attachment.dataUrl ?? "";
        return typeof src === "string" && src.length > 0;
      }),
    [attachments]
  );

  const [index, setIndex] = useState(() =>
    initialIndex >= 0 && initialIndex < sanitizedAttachments.length ? initialIndex : 0
  );
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isDownloadingSingle, setIsDownloadingSingle] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const total = sanitizedAttachments.length;
  const current = sanitizedAttachments[index] ?? null;

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
      if (total === 0) {
        return;
      }
      if (event.key === "ArrowRight") {
        setIndex((prev) => (prev + 1) % total);
      }
      if (event.key === "ArrowLeft") {
        setIndex((prev) => (prev - 1 + total) % total);
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, total]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    setIndex(() => (initialIndex >= 0 && initialIndex < total ? initialIndex : 0));
  }, [initialIndex, total]);

  const goNext = () => {
    if (total === 0) return;
    setIndex((prev) => (prev + 1) % total);
  };

  const goPrevious = () => {
    if (total === 0) return;
    setIndex((prev) => (prev - 1 + total) % total);
  };

  const handleDownloadCurrent = async () => {
    if (!current) return;
    try {
      setIsDownloadingSingle(true);
      const blob = await resolveAttachmentBlob(current);
      if (blob) {
        downloadBlob(blob, current.name);
      }
    } finally {
      setIsDownloadingSingle(false);
    }
  };

  const handleDownloadAll = async () => {
    if (total === 0) return;
    try {
      setIsDownloadingAll(true);
      for (const attachment of sanitizedAttachments) {
        try {
          const blob = await resolveAttachmentBlob(attachment);
          if (!blob) continue;
          downloadBlob(blob, attachment.name);
          await new Promise((resolve) => setTimeout(resolve, 150));
        } catch (error) {
          console.warn(`"${attachment.name}" 다운로드에 실패했습니다.`, error);
        }
      }
    } finally {
      setIsDownloadingAll(false);
    }
  };

  if (!current || total === 0) return null;

  const imageSrc = current.previewUrl ?? current.dataUrl ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur">
      <div
        ref={dialogRef}
        className="relative flex w-[min(90vw,900px)] max-h-[90vh] flex-col overflow-hidden rounded-3xl bg-slate-900/70 text-slate-100 shadow-2xl ring-1 ring-white/10"
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div className="flex flex-col">
            <h3 className="text-base font-semibold">{current.name}</h3>
            <p className="text-xs text-slate-300/80">
              {formatBytes(current.size)} · {current.type}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 hover:bg-white/20 transition"
          >
            닫기
          </button>
        </header>

        <div className="relative flex flex-1 items-center justify-center bg-slate-950/40">
          <button
            type="button"
            onClick={goPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition"
            aria-label="이전 이미지"
          >
            ‹
          </button>
          <img
            src={imageSrc}
            alt={current.name}
            className="max-h-[70vh] max-w-[80vw] rounded-2xl border border-white/10 object-contain shadow-2xl"
          />
          <button
            type="button"
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition"
            aria-label="다음 이미지"
          >
            ›
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/60 px-3 py-1 text-xs font-semibold text-white/80">
            {index + 1} / {total}
          </span>
        </div>

        <footer className="flex flex-col gap-4 border-t border-white/10 px-6 py-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 text-slate-300/80">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em]">
                보기 전용 창
              </span>
              <span>
                이미지 전용 뷰어에서 확대·축소 없이 원본 비율로 감상하고, 필요 시 선택적으로 저장할 수 있습니다.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadCurrent}
                disabled={isDownloadingSingle}
                className={clsx(
                  "rounded-full px-4 py-2 text-xs font-semibold transition",
                  isDownloadingSingle
                    ? "bg-white/10 text-white/50 cursor-progress"
                    : "bg-accent text-white hover:bg-accent/80"
                )}
              >
                {isDownloadingSingle ? "다운로드 중..." : "현재 이미지 저장"}
              </button>
              <button
                type="button"
                onClick={handleDownloadAll}
                disabled={isDownloadingAll}
                className={clsx(
                  "rounded-full px-4 py-2 text-xs font-semibold transition",
                  isDownloadingAll
                    ? "bg-white/10 text-white/50 cursor-progress"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {isDownloadingAll ? "전체 저장 중..." : "전체 이미지 저장"}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
