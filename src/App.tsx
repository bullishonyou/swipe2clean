import { useState, useCallback, useEffect } from "react";
import { SelectionView } from "./views/SelectionView";
import { SwipeView } from "./views/SwipeView";
import { SummaryView } from "./views/SummaryView";
import { SettingsView } from "./views/SettingsView";
import { loadState, saveState } from "./lib/commands";
import type { FileEntry, SessionStats, Theme } from "./lib/types";
import { DEFAULT_LARGE_FILE_THRESHOLD_MB } from "./lib/utils";
import { useTheme } from "./hooks/useTheme";

type View = "selection" | "review" | "summary" | "settings";

export function App() {
  const [view, setView] = useState<View>("selection");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [largeFileThresholdMb, setLargeFileThresholdMb] = useState(
    DEFAULT_LARGE_FILE_THRESHOLD_MB,
  );
  const [theme, setTheme] = useState<Theme>("system");
  const [themePreview, setThemePreview] = useState<Theme | null>(null);
  const [stats, setStats] = useState<SessionStats>({
    reviewed: 0,
    trashed: 0,
    kept: 0,
    spaceReclaimed: 0,
  });

  // Apply the theme to the DOM — preview overrides saved when active
  useTheme(themePreview ?? theme);

  // Load persisted settings on mount
  useEffect(() => {
    loadState()
      .then((state) => {
        setLargeFileThresholdMb(state.large_file_threshold_mb);
        setTheme((state.theme as Theme) || "system");
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
    (thresholdMb: number, newTheme: Theme) => {
      setLargeFileThresholdMb(thresholdMb);
      setTheme(newTheme);
      setThemePreview(null);
      // Persist — re-load current state to avoid overwriting folder/recursive.
      loadState()
        .then((current) =>
          saveState({
            ...current,
            large_file_threshold_mb: thresholdMb,
            theme: newTheme,
          }),
        )
        .catch(() => {
          /* best-effort persist */
        });
      setView("selection");
    },
    [],
  );

  const handleBackFromSettings = useCallback(() => {
    setThemePreview(null);
    setView("selection");
  }, []);

  const largeFileThreshold = largeFileThresholdMb * 1024 * 1024;

  return (
    <div className="h-full bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
      {view === "selection" && (
        <SelectionView
          onStart={handleStart}
          onOpenSettings={() => setView("settings")}
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
          theme={theme}
          onSave={handleSaveSettings}
          onBack={handleBackFromSettings}
          onPreviewTheme={setThemePreview}
        />
      )}
    </div>
  );
}
