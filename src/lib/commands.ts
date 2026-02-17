import { invoke } from "@tauri-apps/api/core";
import type { FileEntry, PreviewData, AppState } from "./types";

export async function scanDirectory(
  path: string,
  recursive: boolean,
): Promise<FileEntry[]> {
  return invoke("scan_directory", { path, recursive });
}

export async function getFilePreview(path: string): Promise<PreviewData> {
  return invoke("get_file_preview", { path });
}

export async function trashFiles(paths: string[]): Promise<void> {
  return invoke("trash_files", { paths });
}

export async function openInViewer(path: string): Promise<void> {
  return invoke("open_in_viewer", { path });
}

export async function loadState(): Promise<AppState> {
  return invoke("load_state");
}

export async function saveState(state: AppState): Promise<void> {
  return invoke("save_state", { state });
}
