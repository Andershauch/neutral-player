"use client";

import { useCallback, useRef, useState } from "react";

interface UseAsyncActionOptions<TResult> {
  onSuccess?: (result: TResult) => void;
  onError?: (error: Error) => void;
}

interface UseAsyncActionResult<TArgs extends unknown[], TResult> {
  run: (...args: TArgs) => Promise<TResult | undefined>;
  isPending: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

/// Formaliserer moenstret "kald API, hold styr paa saving/error, koer
/// onSuccess", som ellers er haandrullet paa naesten samme facon ~25 steder
/// i admin/internal-komponenterne (se docs/saas-roadmap.md TASK-11.1-fundet).
export function useAsyncAction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: UseAsyncActionOptions<TResult> = {}
): UseAsyncActionResult<TArgs, TResult> {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  // Tillader at kalde run() igen foer et tidligere kald er faerdigt (fx et
  // effect der genkoerer paa en aendret dependency) uden at et sent-ankommet
  // svar fra det gamle kald overskriver resultatet af det nye.
  const callId = useRef(0);

  const run = useCallback(
    async (...args: TArgs) => {
      const thisCallId = ++callId.current;
      setIsPending(true);
      setError(null);
      try {
        const result = await fn(...args);
        if (callId.current !== thisCallId) return undefined;
        optionsRef.current.onSuccess?.(result);
        return result;
      } catch (err) {
        if (callId.current !== thisCallId) return undefined;
        const message = err instanceof Error ? err.message : "Ukendt fejl";
        setError(message);
        optionsRef.current.onError?.(err instanceof Error ? err : new Error(message));
        return undefined;
      } finally {
        if (callId.current === thisCallId) setIsPending(false);
      }
    },
    [fn]
  );

  return { run, isPending, error, setError };
}
