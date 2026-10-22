import { useCallback, useEffect, useState } from "react";
import { ApiRequestError } from "./api";

export interface QueryState<T> {
  data?: T;
  error?: string;
  loading: boolean;
  reload: () => void;
}

interface Settled<T> {
  key: string;
  data?: T;
  error?: string;
}

/** Small fetch-on-mount hook; a change in `deps` (or `reload()`) starts a new request. */
export function useQuery<T>(fetcher: () => Promise<T>, deps: readonly unknown[]): QueryState<T> {
  const [tick, setTick] = useState(0);
  const key = JSON.stringify([...deps, tick]);
  const [settled, setSettled] = useState<Settled<T>>();
  const reload = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    let active = true;
    fetcher().then(
      (data) => active && setSettled({ key, data }),
      (e: unknown) => active && setSettled({ key, error: describeError(e) }),
    );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const current = settled?.key === key ? settled : undefined;
  return { data: current?.data ?? settled?.data, error: current?.error, loading: !current, reload };
}

export function describeError(e: unknown): string {
  if (e instanceof ApiRequestError) return `${e.body.message} (${e.body.code})`;
  return e instanceof Error ? e.message : String(e);
}
