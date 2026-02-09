import { useState, useCallback } from "react";
import { SelectionView } from "./views/SelectionView";
import { SwipeView } from "./views/SwipeView";
import { SummaryView } from "./views/SummaryView";
import type { FileEntry, SessionStats } from "./lib/types";

type View = "selection" | "review" | "summary";

export function App() {
  const [view, setView] = useState<View>("selection");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    reviewed: 0,
    trashed: 0,
    kept: 0,
    spaceReclaimed: 0,
  });

  const handleStart = useCallback((scannedFiles: FileEntry[]) => {
    setFiles(scannedFiles);
    setView("review");
  }, []);

  const handleFinish = useCallback((sessionStats: SessionStats) => {
    setStats(sessionStats);
    setView("summary");
  }, []);

  const handleRestart = useCallback(() => {
    setFiles([]);
    setStats({ reviewed: 0, trashed: 0, kept: 0, spaceReclaimed: 0 });
    setView("selection");
  }, []);

  return (
    <div className="h-full bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
      {view === "selection" && (
        <SelectionView onStart={handleStart} />
      )}
      {view === "review" && (
        <SwipeView files={files} onFinish={handleFinish} />
      )}
      {view === "summary" && (
        <SummaryView stats={stats} onRestart={handleRestart} />
      )}
    </div>
  );
}
