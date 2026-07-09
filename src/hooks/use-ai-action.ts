'use client';

import { useState, useCallback, useRef } from 'react';

export interface AiActionState {
  isPending: boolean;
  error: string | null;
  timestamp: number | null;
}

export function useAiAction<T>(
  action: (...args: any[]) => Promise<T>,
): [AiActionState & { data: T | null }, (...args: any[]) => Promise<T | undefined>] {
  const [state, setState] = useState<AiActionState & { data: T | null }>({
    isPending: false,
    error: null,
    timestamp: null,
    data: null,
  });
  const mountedRef = useRef(true);

  const execute = useCallback(async (...args: any[]): Promise<T | undefined> => {
    setState(prev => ({ ...prev, isPending: true, error: null }));
    try {
      const result = await action(...args);
      if (mountedRef.current) {
        setState({
          isPending: false,
          error: null,
          timestamp: Date.now(),
          data: result,
        });
      }
      return result;
    } catch (e: any) {
      if (mountedRef.current) {
        setState({
          isPending: false,
          error: e.message || 'An unexpected error occurred.',
          timestamp: Date.now(),
          data: null,
        });
      }
      return undefined;
    }
  }, [action]);

  return [state, execute];
}