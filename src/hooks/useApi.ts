import { useCallback, useEffect, useRef, useState } from "react";

export interface UseApiState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  setData: (updater: (prev: T | undefined) => T | undefined) => void;
}

/**
 * Generic hook for promise-returning API calls.
 * Re-runs when `deps` change.  Provides imperative refresh and local mutation.
 */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []): UseApiState<T> {
  const [data, setRaw] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const v = await fnRef.current();
      setRaw(v);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  const setData = useCallback((updater: (prev: T | undefined) => T | undefined) => {
    setRaw((prev) => updater(prev));
  }, []);

  return { data, loading, error, refresh: load, setData };
}
