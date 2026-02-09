import {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from "framer-motion";
import { FileCard } from "./FileCard";
import type { FileEntry } from "../lib/types";

const SWIPE_THRESHOLD = 100;
const FLY_OFF_DISTANCE = 600;

export interface CardStackHandle {
  completeSwipe: (direction: "left" | "right") => void;
}

interface Props {
  currentFile: FileEntry;
  nextFile: FileEntry | null;
  isLargeFile: boolean;
  onSwipeIntent: (direction: "left" | "right") => void;
  onSwipeComplete: (direction: "left" | "right") => void;
}

export const CardStack = forwardRef<CardStackHandle, Props>(
  function CardStack(
    { currentFile, nextFile, isLargeFile, onSwipeIntent, onSwipeComplete },
    ref,
  ) {
    const [isAnimating, setIsAnimating] = useState(false);
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12]);
    const keepOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
    const trashOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

    // ----------------------------------------------------------------
    // Animate the card off-screen, then notify the parent
    // ----------------------------------------------------------------
    const completeSwipe = useCallback(
      (direction: "left" | "right") => {
        if (isAnimating) return;
        setIsAnimating(true);

        const target = direction === "left" ? -FLY_OFF_DISTANCE : FLY_OFF_DISTANCE;
        animate(x, target, {
          type: "spring",
          stiffness: 500,
          damping: 35,
          restDelta: 0.5,
        }).then(() => {
          x.set(0);
          setIsAnimating(false);
          onSwipeComplete(direction);
        });
      },
      [isAnimating, x, onSwipeComplete],
    );

    useImperativeHandle(ref, () => ({ completeSwipe }), [completeSwipe]);

    // ----------------------------------------------------------------
    // Handle drag release
    // ----------------------------------------------------------------
    const handleDragEnd = useCallback(
      (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (isAnimating) return;

        const swipe = info.offset.x + info.velocity.x * 0.3;

        if (Math.abs(swipe) > SWIPE_THRESHOLD) {
          const direction: "left" | "right" = swipe > 0 ? "right" : "left";

          // Large files swiped left need confirmation — snap back
          if (direction === "left" && isLargeFile) {
            animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
            onSwipeIntent(direction);
            return;
          }

          completeSwipe(direction);
        } else {
          // Below threshold — snap back
          animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
        }
      },
      [isAnimating, isLargeFile, completeSwipe, onSwipeIntent, x],
    );

    return (
      <div className="relative w-full h-[420px] flex items-center justify-center">
        {/* Background card (peek) */}
        {nextFile && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full scale-[0.95] opacity-50">
              <FileCard file={nextFile} />
            </div>
          </div>
        )}

        {/* Active card */}
        <motion.div
          className="relative w-full cursor-grab active:cursor-grabbing touch-none select-none"
          drag={isAnimating ? false : "x"}
          style={{ x, rotate }}
          onDragEnd={handleDragEnd}
        >
          {/* KEEP overlay */}
          <motion.div
            className="absolute inset-0 rounded-2xl z-10 pointer-events-none flex items-center justify-center bg-green-500/20 border-2 border-green-400/40"
            style={{ opacity: keepOpacity }}
          >
            <span className="text-green-600 dark:text-green-400 text-3xl font-black tracking-wider -rotate-12">
              KEEP
            </span>
          </motion.div>

          {/* TRASH overlay */}
          <motion.div
            className="absolute inset-0 rounded-2xl z-10 pointer-events-none flex items-center justify-center bg-red-500/20 border-2 border-red-400/40"
            style={{ opacity: trashOpacity }}
          >
            <span className="text-red-600 dark:text-red-400 text-3xl font-black tracking-wider rotate-12">
              TRASH
            </span>
          </motion.div>

          <FileCard file={currentFile} />
        </motion.div>
      </div>
    );
  },
);
