import { useState, useEffect } from "react";
import { FilePreview } from "./FilePreview";
import { getFilePreview } from "../lib/commands";
import { formatBytes, timeAgo, LARGE_FILE_THRESHOLD } from "../lib/utils";
import type { FileEntry, PreviewData } from "../lib/types";

interface Props {
  file: FileEntry;
}

export function FileCard({ file }: Props) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setPreview(null);

    getFilePreview(file.path)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file.path]);

  const isLargeFile = file.size > LARGE_FILE_THRESHOLD;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold truncate flex-1 leading-tight">
            {file.name}
          </h2>
          {file.extension && (
            <span className="shrink-0 text-[11px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-full uppercase font-mono tracking-wide text-neutral-500">
              {file.extension}
            </span>
          )}
        </div>
        {isLargeFile && (
          <span className="inline-block mt-1.5 text-[11px] px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full font-medium">
            Large File!
          </span>
        )}
      </div>

      {/* Preview */}
      <div className="px-5 py-3 min-h-[200px] flex items-center justify-center">
        <FilePreview file={file} preview={preview} isLoading={isLoading} />
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[13px] text-neutral-500 dark:text-neutral-400">
        <span>{formatBytes(file.size)}</span>
        <span>Modified {timeAgo(file.modified)}</span>
      </div>
    </div>
  );
}
