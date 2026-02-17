import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { CardStack, type CardStackHandle } from "../components/CardStack";
import { UndoToast } from "../components/UndoToast";
import { ConfirmModal } from "../components/ConfirmModal";
import { useFileQueue } from "../hooks/useFileQueue";
import { useSwipe } from "../hooks/useSwipe";
import { openInViewer } from "../lib/commands";
import type { FileEntry, SessionStats } from "../lib/types";

interface Props {
  files: FileEntry[];
  onFinish: (stats: SessionStats) => void;
  largeFileThreshold: number;
}

export function SwipeView({ files, onFinish, largeFileThreshold }: Props) {
  const queue = useFileQueue(files);
  const cardRef = useRef<CardStackHandle>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const hasFinished = useRef(false);

  // Keep a ref to the latest stats so async callbacks never use stale data
  const statsRef = useRef(queue.stats);
  statsRef.current = queue.stats;

  // ------------------------------------------------------------------
  // Auto-finish when all files have been reviewed
  // ------------------------------------------------------------------
  useEffect(() => {
    if (queue.isComplete && !hasFinished.current) {
      hasFinished.current = true;
      // Transition to summary immediately, flush trash in the background
      const finalStats = { ...statsRef.current };
      queue.flush();
      onFinish(finalStats);
    }
  }, [queue.isComplete, queue.flush, onFinish]);

  const isCurrentLargeFile = queue.currentFile
    ? queue.currentFile.size > largeFileThreshold
    : false;

  // ------------------------------------------------------------------
  // Called by CardStack after the card animation finishes
  // ------------------------------------------------------------------
  const handleSwipeComplete = useCallback(
    (direction: "left" | "right") => {
      queue.swipe(direction);
      setShowUndo(direction === "left");
    },
    [queue],
  );

  // ------------------------------------------------------------------
  // Intent to swipe (from drag threshold, button, or keyboard)
  // ------------------------------------------------------------------
  const handleSwipeIntent = useCallback(
    (direction: "left" | "right") => {
      if (direction === "left" && isCurrentLargeFile) {
        setShowConfirm(true);
        return;
      }
      cardRef.current?.completeSwipe(direction);
    },
    [isCurrentLargeFile],
  );

  const handleConfirmLargeFile = useCallback(() => {
    setShowConfirm(false);
    cardRef.current?.completeSwipe("left");
  }, []);

  const handleUndo = useCallback(() => {
    setShowUndo(false);
    queue.undo();
  }, [queue]);

  const handleOpen = useCallback(async () => {
    if (queue.currentFile) {
      try {
        await openInViewer(queue.currentFile.path);
      } catch (err) {
        console.error("Failed to open file:", err);
      }
    }
  }, [queue.currentFile]);

  const handleFinishEarly = useCallback(() => {
    if (hasFinished.current) return;
    hasFinished.current = true;
    // Transition to summary immediately, flush trash in the background
    const finalStats = { ...statsRef.current };
    queue.flush();
    onFinish(finalStats);
  }, [queue.flush, onFinish]);

  // ------------------------------------------------------------------
  // Keyboard shortcuts
  // ------------------------------------------------------------------
  useSwipe({
    onSwipeLeft: () => handleSwipeIntent("left"),
    onSwipeRight: () => handleSwipeIntent("right"),
    onUndo: handleUndo,
    onOpen: handleOpen,
    enabled: !showConfirm && !queue.isComplete,
  });

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  if (queue.isComplete) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-neutral-400">Finishing up...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between h-full py-8 px-6">
      {/* Progress */}
      <div className="w-full max-w-sm space-y-2">
        <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>
            {queue.stats.reviewed} of {files.length} files
          </span>
          <span>{queue.remaining} remaining</span>
        </div>
        <div className="h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-neutral-900 dark:bg-neutral-100 rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${(queue.stats.reviewed / files.length) * 100}%`,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* Card stack */}
      <div className="flex-1 flex items-center justify-center w-full max-w-sm my-4">
        {queue.currentFile && (
          <CardStack
            ref={cardRef}
            currentFile={queue.currentFile}
            nextFile={queue.nextFile}
            isLargeFile={isCurrentLargeFile}
            largeFileThreshold={largeFileThreshold}
            onSwipeIntent={handleSwipeIntent}
            onSwipeComplete={handleSwipeComplete}
          />
        )}
      </div>

      {/* Action buttons + hints */}
      <div className="space-y-4 w-full max-w-sm">
        <div className="flex items-center justify-center gap-6">
          {/* Trash button */}
          <button
            onClick={() => handleSwipeIntent("left")}
            className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 text-red-500 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors active:scale-95"
            aria-label="Trash file"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </button>

          {/* Keep button */}
          <button
            onClick={() => handleSwipeIntent("right")}
            className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 text-green-500 flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors active:scale-95"
            aria-label="Keep file"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </button>
        </div>

        <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">
          Arrow keys to swipe &middot; Space to preview &middot; Cmd+Z to undo
        </p>

        <button
          onClick={handleFinishEarly}
          className="w-full py-2 text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          Finish Session
        </button>
      </div>

      {/* Undo toast */}
      <UndoToast
        visible={showUndo && queue.canUndo}
        onUndo={handleUndo}
        onDismiss={() => setShowUndo(false)}
      />

      {/* Large file confirmation */}
      {queue.currentFile && (
        <ConfirmModal
          visible={showConfirm}
          fileName={queue.currentFile.name}
          fileSize={queue.currentFile.size}
          onConfirm={handleConfirmLargeFile}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
