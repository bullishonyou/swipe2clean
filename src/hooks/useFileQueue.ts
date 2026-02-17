import { useState, useCallback, useRef } from "react";
import { trashFiles } from "../lib/commands";
import type { FileEntry, SessionStats } from "../lib/types";
import { BATCH_SIZE } from "../lib/utils";

export type SwipeDirection = "left" | "right";

interface UndoEntry {
  file: FileEntry;
  index: number;
}

export interface UseFileQueueReturn {
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
 * Manages the file review queue, trash buffer, undo stack, and session stats.
 *
 * Files swiped left accumulate in an in-memory buffer and are moved to the
 * system trash in batches of `BATCH_SIZE` (or when the session ends).
 */
export function useFileQueue(files: FileEntry[]): UseFileQueueReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const trashBuffer = useRef<string[]>([]);
  const [lastTrashed, setLastTrashed] = useState<UndoEntry | null>(null);
  const [stats, setStats] = useState<SessionStats>({
    reviewed: 0,
    trashed: 0,
    kept: 0,
    spaceReclaimed: 0,
  });
  const swipeCount = useRef(0);

  const currentFile =
    currentIndex < files.length ? files[currentIndex] : null;
  const nextFile =
    currentIndex + 1 < files.length ? files[currentIndex + 1] : null;
  const isComplete = currentIndex >= files.length;
  const remaining = Math.max(0, files.length - currentIndex);

  // ------------------------------------------------------------------
  // Flush the trash buffer to the OS trash
  // ------------------------------------------------------------------

  const flush = useCallback(async () => {
    const paths = [...trashBuffer.current];
    if (paths.length === 0) return;

    trashBuffer.current = [];

    try {
      await trashFiles(paths);
      // Once flushed to OS trash, undo is no longer possible — dismiss the toast
      setLastTrashed(null);
    } catch (err) {
      console.error("Failed to trash files:", err);
    }
  }, []);

  // ------------------------------------------------------------------
  // Swipe handler
  // ------------------------------------------------------------------

  const swipe = useCallback(
    (direction: SwipeDirection) => {
      if (currentIndex >= files.length) return;
      const file = files[currentIndex];

      if (direction === "left") {
        trashBuffer.current.push(file.path);
        setLastTrashed({ file, index: currentIndex });
        setStats((prev) => ({
          reviewed: prev.reviewed + 1,
          trashed: prev.trashed + 1,
          kept: prev.kept,
          spaceReclaimed: prev.spaceReclaimed + file.size,
        }));
      } else {
        setLastTrashed(null);
        setStats((prev) => ({
          reviewed: prev.reviewed + 1,
          trashed: prev.trashed,
          kept: prev.kept + 1,
          spaceReclaimed: prev.spaceReclaimed,
        }));
      }

      setCurrentIndex((prev) => prev + 1);
      swipeCount.current++;

      // Auto-flush every BATCH_SIZE swipes
      if (swipeCount.current % BATCH_SIZE === 0) {
        const paths = [...trashBuffer.current];
        if (paths.length > 0) {
          trashBuffer.current = [];
          trashFiles(paths)
            .then(() => setLastTrashed(null))
            .catch((err) => console.error("Auto-flush failed:", err));
        }
      }
    },
    [currentIndex, files],
  );

  // ------------------------------------------------------------------
  // Undo last trash action
  // ------------------------------------------------------------------

  const undo = useCallback(() => {
    if (!lastTrashed) return;
    const { file, index } = lastTrashed;

    // Remove the file from the in-memory buffer (only works pre-flush)
    trashBuffer.current = trashBuffer.current.filter(
      (p) => p !== file.path,
    );

    setCurrentIndex(index);
    setStats((prev) => ({
      reviewed: prev.reviewed - 1,
      trashed: prev.trashed - 1,
      kept: prev.kept,
      spaceReclaimed: prev.spaceReclaimed - file.size,
    }));
    setLastTrashed(null);
  }, [lastTrashed]);

  return {
    currentFile,
    nextFile,
    isComplete,
    remaining,
    stats,
    swipe,
    undo,
    flush,
    canUndo: lastTrashed !== null,
  };
}
