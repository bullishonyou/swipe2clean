import type { FileEntry, PreviewData } from "../lib/types";

interface Props {
  file: FileEntry;
  preview: PreviewData | null;
  isLoading: boolean;
}

export function FilePreview({ file, preview, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="w-full h-48 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
    );
  }

  if (!preview) {
    return <GenericIcon extension={file.extension} />;
  }

  switch (preview.kind) {
    case "image":
      return preview.content ? (
        <img
          src={`data:image/png;base64,${preview.content}`}
          alt={file.name}
          className="max-h-52 max-w-full object-contain rounded-lg mx-auto"
          draggable={false}
        />
      ) : (
        <GenericIcon extension={file.extension} />
      );

    case "text":
      return (
        <pre className="selectable w-full text-xs font-mono leading-relaxed bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg overflow-hidden max-h-52 text-neutral-700 dark:text-neutral-300">
          {preview.content || "(empty file)"}
        </pre>
      );

    case "video":
      return <GenericIcon extension={file.extension} label="Video file" />;

    default:
      return <GenericIcon extension={file.extension} />;
  }
}

// ---------------------------------------------------------------------------
// Generic file icon for unsupported preview types
// ---------------------------------------------------------------------------

function GenericIcon({
  extension,
  label,
}: {
  extension: string;
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="w-20 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center border-2 border-neutral-200 dark:border-neutral-700">
        <span className="text-xs font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase">
          {extension || "?"}
        </span>
      </div>
      {label && (
        <span className="text-xs text-neutral-400 dark:text-neutral-500">
          {label}
        </span>
      )}
    </div>
  );
}
