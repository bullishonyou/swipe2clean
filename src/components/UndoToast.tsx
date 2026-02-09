import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  visible: boolean;
  onUndo: () => void;
  onDismiss: () => void;
}

const TOAST_DURATION_MS = 3_000;

export function UndoToast({ visible, onUndo, onDismiss }: Props) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <button
            onClick={onUndo}
            className="px-5 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full shadow-lg text-sm font-medium hover:opacity-90 transition-opacity active:scale-95"
          >
            Undo — Restore file
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
