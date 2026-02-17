import { useState } from "react";
import { motion } from "framer-motion";
import { formatBytes } from "../lib/utils";
import type { Theme } from "../lib/types";

type Unit = "MB" | "GB";

interface Props {
  largeFileThresholdMb: number;
  theme: Theme;
  onSave: (thresholdMb: number, theme: Theme) => void;
  onBack: () => void;
  onPreviewTheme: (theme: Theme) => void;
}

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: "system",
    label: "System",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" />
      </svg>
    ),
  },
  {
    value: "light",
    label: "Light",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
      </svg>
    ),
  },
];

/** Convert an MB value into a display number + unit. */
function toDisplay(mb: number): { value: number; unit: Unit } {
  if (mb >= 1024 && mb % 1024 === 0) {
    return { value: mb / 1024, unit: "GB" };
  }
  return { value: mb, unit: "MB" };
}

/** Convert a display number + unit back to MB. */
function toMb(value: number, unit: Unit): number {
  return unit === "GB" ? value * 1024 : value;
}

export function SettingsView({ largeFileThresholdMb, theme: savedTheme, onSave, onBack, onPreviewTheme }: Props) {
  const initial = toDisplay(largeFileThresholdMb);
  const [inputValue, setInputValue] = useState(String(initial.value));
  const [unit, setUnit] = useState<Unit>(initial.unit);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(savedTheme);

  const numericValue = Number(inputValue);
  const isValid = !isNaN(numericValue) && numericValue > 0;
  const currentMb = isValid ? toMb(numericValue, unit) : -1;

  const thresholdChanged = isValid && currentMb !== largeFileThresholdMb;
  const themeChanged = selectedTheme !== savedTheme;
  const hasChanges = thresholdChanged || themeChanged;

  const toggleUnit = () => {
    if (!isValid) {
      setUnit((u) => (u === "MB" ? "GB" : "MB"));
      return;
    }
    if (unit === "MB") {
      setInputValue(String(numericValue / 1024));
      setUnit("GB");
    } else {
      setInputValue(String(numericValue * 1024));
      setUnit("MB");
    }
  };

  const handleSave = () => {
    if (!hasChanges) return;
    const finalMb = isValid ? currentMb : largeFileThresholdMb;
    onSave(finalMb, selectedTheme);
  };

  return (
    <div className="flex flex-col min-h-screen p-8">
      {/* Header with back button */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md mx-auto"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors mb-8"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          Back
        </button>

        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Configure how swipe2clean works
        </p>
      </motion.div>

      {/* Settings content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-md mx-auto mt-8 space-y-8"
      >
        {/* Large file threshold */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Large File Warning</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Files above this size will show a warning badge and require
              confirmation before trashing.
            </p>
          </div>

          {/* Input + unit toggle */}
          <div className="flex items-stretch gap-0">
            <input
              type="number"
              min="1"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-4 py-2.5 rounded-l-xl bg-neutral-100 dark:bg-neutral-900 border border-r-0 border-neutral-200 dark:border-neutral-800 text-sm font-semibold outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              placeholder="500"
            />
            <button
              onClick={toggleUnit}
              className="px-4 py-2.5 rounded-r-xl bg-neutral-200 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-sm font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors min-w-[52px]"
            >
              {unit}
            </button>
          </div>

          {/* Saved value hint */}
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            Currently set to{" "}
            <span className="font-medium text-neutral-500 dark:text-neutral-400">
              {formatBytes(largeFileThresholdMb * 1024 * 1024)}
            </span>
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

        {/* Theme */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Appearance</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Choose between light, dark, or follow your system setting.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = selectedTheme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { setSelectedTheme(opt.value); onPreviewTheme(opt.value); }}
                  className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Save button */}
      <div className="w-full max-w-md mx-auto mt-auto pt-8">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: hasChanges ? 1 : 0.3 }}
          onClick={handleSave}
          disabled={!hasChanges}
          className="w-full py-3.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium text-sm hover:opacity-90 transition-opacity disabled:cursor-not-allowed"
        >
          Save Changes
        </motion.button>
      </div>
    </div>
  );
}
