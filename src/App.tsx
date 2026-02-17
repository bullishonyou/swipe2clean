import { useState, useCallback, useEffect } from "react";
import { SelectionView } from "./views/SelectionView";
import { SwipeView } from "./views/SwipeView";
import { SummaryView } from "./views/SummaryView";
import { SettingsView } from "./views/SettingsView";
import { loadState, saveState } from "./lib/commands";
import type { FileEntry, SessionStats } from "./lib/types";
import { DEFAULT_LARGE_FILE_THRESHOLD_MB } from "./lib/utils";

type View = "selection" | "review" | "summary" | "settings";

export function App() {
  const [view, setView] = useState<View>("selection");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [largeFileThresholdMb, setLargeFileThresholdMb] = useState(
    DEFAULT_LARGE_FILE_THRESHOLD_MB,
  );
  const [stats, setStats] = useState<SessionStats>({
    reviewed: 0,
    trashed: 0,
    kept: 0,
    spaceReclaimed: 0,
  });

  // Load persisted settings on mount
  useEffect(() => {
    loadState()
      .then((state) => {
        setLargeFileThresholdMb(state.large_file_threshold_mb);
      })
      .catch(() => {
        /* use defaults */
      });
  }, []);

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

  const handleSaveSettings = useCallback(
    (thresholdMb: number) => {
      setLargeFileThresholdMb(thresholdMb);
      // Persist — we load folder/recursive separately in SelectionView,
      // so re-load current state to avoid overwriting those fields.
      loadState()
        .then((current) =>
          saveState({ ...current, large_file_threshold_mb: thresholdMb }),
        )
        .catch(() => {
          /* best-effort persist */
        });
      setView("selection");
    },
    [],
  );

  const largeFileThreshold = largeFileThresholdMb * 1024 * 1024;

  return (
    <div className="h-full bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
      {view === "selection" && (
        <SelectionView
          onStart={handleStart}
          onOpenSettings={() => setView("settings")}
          largeFileThresholdMb={largeFileThresholdMb}
        />
      )}
      {view === "review" && (
        <SwipeView
          files={files}
          onFinish={handleFinish}
          largeFileThreshold={largeFileThreshold}
        />
      )}
      {view === "summary" && (
        <SummaryView stats={stats} onRestart={handleRestart} />
      )}
      {view === "settings" && (
        <SettingsView
          largeFileThresholdMb={largeFileThresholdMb}
          onSave={handleSaveSettings}
          onBack={() => setView("selection")}
        />
      )}
    </div>
  );
}
