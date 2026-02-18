import { useState, useCallback, useRef } from "react";
import { trashFiles } from "../lib/commands";
import type { FileEntry, SessionStats } from "../lib/types";

export type SwipeDirection = "left" | "right";

interface PendingTrash {
  file: FileEntry;
  index: number;
}

export interface UseFileQueueReturn {
  currentIndex: number;
  currentFile: FileEntry | null;
  nextFile: FileEntry | null;
  isComplete: boolean;
  remaining: number;
  stats: SessionStats;
  swipe: (direction: SwipeDirection) => void;
  undo: () => void;
  flush: () => Promise<void>;
  canUndo: boolean;
}

/**
 * Manages the file review queue with a one-file-delayed trash model.
 *
 * When a file is swiped left it becomes "pending". It only gets sent to the OS
 * trash when the user swipes the *next* card (in either direction) or the
 * session ends. This gives the user exactly one card's worth of undo window,
 * just like Tinder.
 */
export function useFileQueue(files: FileEntry[]): UseFileQueueReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const pending = useRef<PendingTrash | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [stats, setStats] = useState<SessionStats>({
    reviewed: 0,
    trashed: 0,
    kept: 0,
    spaceReclaimed: 0,
  });

  const currentFile =
    currentIndex < files.length ? files[currentIndex] : null;
  const nextFile =
    currentIndex + 1 < files.length ? files[currentIndex + 1] : null;
  const isComplete = currentIndex >= files.length;
  const remaining = Math.max(0, files.length - currentIndex);

  // ------------------------------------------------------------------
  // Commit the pending file to OS trash (fire-and-forget)
  // ------------------------------------------------------------------

  const commitPending = useCallback(() => {
    const entry = pending.current;
    if (!entry) return;
    pending.current = null;
    setCanUndo(false);
    trashFiles([entry.file.path]).catch((err) =>
      console.error("Failed to trash file:", err),
    );
  }, []);

  // ------------------------------------------------------------------
  // Flush — used at session end to commit any pending file
  // ------------------------------------------------------------------

  const flush = useCallback(async () => {
    const entry = pending.current;
    if (!entry) return;
    pending.current = null;
    setCanUndo(false);
    try {
      await trashFiles([entry.file.path]);
    } catch (err) {
      console.error("Failed to trash file:", err);
    }
  }, []);

  // ------------------------------------------------------------------
  // Swipe handler
  // ------------------------------------------------------------------

  const swipe = useCallback(
    (direction: SwipeDirection) => {
      if (currentIndex >= files.length) return;

      // Commit the previously pending file before processing this swipe
      commitPending();

      const file = files[currentIndex];

      if (direction === "left") {
        pending.current = { file, index: currentIndex };
        setCanUndo(true);
        setStats((prev) => ({
          reviewed: prev.reviewed + 1,
          trashed: prev.trashed + 1,
          kept: prev.kept,
          spaceReclaimed: prev.spaceReclaimed + file.size,
        }));
      } else {
        setCanUndo(false);
        setStats((prev) => ({
          reviewed: prev.reviewed + 1,
          trashed: prev.trashed,
          kept: prev.kept + 1,
          spaceReclaimed: prev.spaceReclaimed,
        }));
      }

      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex, files, commitPending],
  );

  // ------------------------------------------------------------------
  // Undo — rescue the pending file before it gets committed
  // ------------------------------------------------------------------

  const undo = useCallback(() => {
    const entry = pending.current;
    if (!entry) return;

    pending.current = null;
    setCanUndo(false);
    setCurrentIndex(entry.index);
    setStats((prev) => ({
      reviewed: prev.reviewed - 1,
      trashed: prev.trashed - 1,
      kept: prev.kept,
      spaceReclaimed: prev.spaceReclaimed - entry.file.size,
    }));
  }, []);

  return {
    currentIndex,
    currentFile,
    nextFile,
    isComplete,
    remaining,
    stats,
    swipe,
    undo,
    flush,
    canUndo,
  };
}
