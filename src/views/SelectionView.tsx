import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { motion } from "framer-motion";
import { scanDirectory, loadState, saveState } from "../lib/commands";
import type { FileEntry } from "../lib/types";

interface Props {
  onStart: (files: FileEntry[]) => void;
  onOpenSettings: () => void;
  largeFileThresholdMb: number;
}

export function SelectionView({ onStart, onOpenSettings, largeFileThresholdMb }: Props) {
  const [folder, setFolder] = useState<string | null>(null);
  const [recursive, setRecursive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore last session's folder on mount
  useEffect(() => {
    loadState()
      .then((state) => {
        if (state.last_folder) setFolder(state.last_folder);
        setRecursive(state.recursive);
      })
      .catch(() => {
        /* no saved state — use defaults */
      });
  }, []);

  const handlePickFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Choose a folder to clean",
    });
    if (selected) {
      setFolder(selected as string);
      setError(null);
    }
  };

  const handleStart = async () => {
    if (!folder) return;
    setScanning(true);
    setError(null);

    try {
      await saveState({ last_folder: folder, recursive, large_file_threshold_mb: largeFileThresholdMb });
      const files = await scanDirectory(folder, recursive);

      if (files.length === 0) {
        setError("No files found in this folder.");
        setScanning(false);
        return;
      }

      onStart(files);
    } catch (e) {
      setError(String(e));
      setScanning(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-8">
      {/* Settings gear — top right */}
      <button
        onClick={onOpenSettings}
        className="absolute top-6 right-6 p-2 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        aria-label="Settings"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md space-y-8"
      >
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">swipe2clean</h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            Clean your files, one swipe at a time
          </p>
        </div>

        {/* Folder picker */}
        <button
          onClick={handlePickFolder}
          disabled={scanning}
          className="w-full px-6 py-5 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {folder ? (
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                Selected Folder
              </span>
              <p className="text-sm font-mono truncate">{folder}</p>
            </div>
          ) : (
            <div className="text-center space-y-1">
              <p className="font-medium">Choose a Folder</p>
              <p className="text-sm text-neutral-400 dark:text-neutral-500">
                Click to browse...
              </p>
            </div>
          )}
        </button>

        {/* Recursive toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div className="relative inline-flex items-center">
            <input
              type="checkbox"
              checked={recursive}
              onChange={(e) => setRecursive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full peer-checked:bg-neutral-900 dark:peer-checked:bg-neutral-100 transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-neutral-900 rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
          </div>
          <span className="text-sm">Include subfolders</span>
        </label>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!folder || scanning}
          className="w-full py-3.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {scanning ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Scanning...
            </span>
          ) : (
            "Start Cleaning"
          )}
        </button>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-500 dark:text-red-400 text-center"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
