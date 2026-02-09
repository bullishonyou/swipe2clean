import { motion } from "framer-motion";
import type { SessionStats } from "../lib/types";
import { formatBytes } from "../lib/utils";

interface Props {
  stats: SessionStats;
  onRestart: () => void;
}

export function SummaryView({ stats, onRestart }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md space-y-8 text-center"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Session Complete
          </h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            Here&apos;s what you accomplished
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Reviewed"
            value={String(stats.reviewed)}
            delay={0.1}
          />
          <StatCard
            label="Trashed"
            value={String(stats.trashed)}
            delay={0.15}
          />
          <StatCard label="Kept" value={String(stats.kept)} delay={0.2} />
          <StatCard
            label="Reclaimed"
            value={formatBytes(stats.spaceReclaimed)}
            delay={0.25}
          />
        </div>

        <button
          onClick={onRestart}
          className="w-full py-3.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Clean Another Folder
        </button>
      </motion.div>
    </div>
  );
}

function StatCard({
  label,
  value,
  delay,
}: {
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 20 }}
      className="p-4 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
    >
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
        {label}
      </p>
    </motion.div>
  );
}
