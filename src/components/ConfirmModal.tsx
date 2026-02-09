import { motion, AnimatePresence } from "framer-motion";
import { formatBytes } from "../lib/utils";

interface Props {
  visible: boolean;
  fileName: string;
  fileSize: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  fileName,
  fileSize,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-2xl max-w-sm mx-4 border border-neutral-200 dark:border-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">Trash large file?</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5 leading-relaxed">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {fileName}
              </span>{" "}
              is {formatBytes(fileSize)}. Are you sure you want to move it to
              trash?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Trash it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
