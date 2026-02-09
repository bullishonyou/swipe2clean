import { useEffect, useCallback } from "react";

interface UseSwipeOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onUndo: () => void;
  onOpen: () => void;
  enabled?: boolean;
}

/**
 * Registers global keyboard shortcuts for the swipe interface.
 *
 * - ArrowLeft  → trash
 * - ArrowRight → keep
 * - Space      → open in system viewer
 * - Cmd/Ctrl+Z → undo
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onUndo,
  onOpen,
  enabled = true,
}: UseSwipeOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Cmd/Ctrl + Z → undo
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        onUndo();
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          onSwipeLeft();
          break;
        case "ArrowRight":
          e.preventDefault();
          onSwipeRight();
          break;
        case " ":
          e.preventDefault();
          onOpen();
          break;
      }
    },
    [enabled, onSwipeLeft, onSwipeRight, onUndo, onOpen],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
