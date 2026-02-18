import { useEffect, useRef, useState, useCallback } from "react";
import { getFilePreview } from "../lib/commands";
import type { FileEntry, PreviewData } from "../lib/types";

const PREFETCH_AHEAD = 5;
const EVICT_BEHIND = 10;

interface CacheEntry {
  data: PreviewData | null;
}

export interface PreviewResult {
  data: PreviewData | null;
  loading: boolean;
}

/**
 * Maintains an in-memory preview cache with look-ahead prefetching.
 *
 * - On every `currentIndex` change, prefetches the next PREFETCH_AHEAD files.
 * - Deduplicates in-flight requests so the same path is never fetched twice.
 * - Evicts entries far behind `currentIndex` to cap memory usage.
 * - Exposes a `get(path)` function that returns cached data synchronously.
 */
export function usePreviewCache(files: FileEntry[], currentIndex: number) {
  const cache = useRef(new Map<string, CacheEntry>());
  const inflight = useRef(new Set<string>());
  const [, bump] = useState(0);

  const rerender = useCallback(() => bump((n) => n + 1), []);

  const fetchOne = useCallback(
    (path: string) => {
      if (cache.current.has(path) || inflight.current.has(path)) return;

      inflight.current.add(path);
      getFilePreview(path)
        .then((data) => {
          cache.current.set(path, { data });
        })
        .catch(() => {
          cache.current.set(path, { data: null });
        })
        .finally(() => {
          inflight.current.delete(path);
          rerender();
        });
    },
    [rerender],
  );

  // Eagerly kick off fetches for the initial window on first render.
  // useRef tracks whether we've already done this to avoid double-firing.
  const initialized = useRef(false);
  if (!initialized.current) {
    initialized.current = true;
    for (let i = 0; i <= PREFETCH_AHEAD && i < files.length; i++) {
      fetchOne(files[i].path);
    }
  }

  // Prefetch ahead and evict behind whenever the index moves
  useEffect(() => {
    for (let i = currentIndex; i <= currentIndex + PREFETCH_AHEAD && i < files.length; i++) {
      fetchOne(files[i].path);
    }

    if (currentIndex > EVICT_BEHIND) {
      for (let i = 0; i < currentIndex - EVICT_BEHIND; i++) {
        const path = files[i]?.path;
        if (path) cache.current.delete(path);
      }
    }
  }, [currentIndex, files, fetchOne]);

  const get = useCallback(
    (path: string): PreviewResult => {
      const entry = cache.current.get(path);
      if (entry) return { data: entry.data, loading: false };
      return { data: null, loading: true };
    },
    [],
  );

  return { get };
}
