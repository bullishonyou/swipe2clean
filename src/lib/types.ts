export type FileKind = "image" | "video" | "text" | "document" | "binary";

export interface FileEntry {
  path: string;
  name: string;
  extension: string;
  size: number;
  modified: number; // unix timestamp (seconds)
  accessed: number; // unix timestamp (seconds)
  file_type: FileKind;
}

export interface PreviewData {
  kind: FileKind;
  content: string | null; // base64 for images, text for text files, null for binary/video
  extension: string;
}

export interface SessionStats {
  reviewed: number;
  trashed: number;
  kept: number;
  spaceReclaimed: number; // bytes
}

export type Theme = "system" | "light" | "dark";

export interface AppState {
  last_folder: string | null;
  recursive: boolean;
  /** Large-file warning threshold in megabytes. */
  large_file_threshold_mb: number;
  /** Theme preference. */
  theme: Theme;
}
