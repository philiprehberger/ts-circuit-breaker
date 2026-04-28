import type { CircuitBreakerOptions, CircuitState, CircuitStats } from './types';

export interface CircuitBreakerInstance<
  T extends (...args: any[]) => Promise<any>,
> {
  fire(...args: Parameters<T>): Promise<Awaited<ReturnType<T>>>;
  readonly state: CircuitState;
  readonly stats: CircuitStats;
  isOpen(): boolean;
  isClosed(): boolean;
  isHalfOpen(): boolean;
  forceOpen(): void;
  forceClose(): void;
  reset(): void;
}

export function circuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CircuitBreakerOptions = {},
): CircuitBreakerInstance<T> {
  const threshold = options.threshold ?? 5;
  const timeout = options.timeout ?? 30000;

  let state: CircuitState = 'closed';
  let failures = 0;
  let successes = 0;
  let openedAt = 0;
  let lastFailureAt: number | null = null;

  function tripOpen(): void {
    state = 'open';
    openedAt = Date.now();
    options.onOpen?.();
  }

  function closeCircuit(): void {
    state = 'closed';
    failures = 0;
    options.onClose?.();
  }

  const instance: CircuitBreakerInstance<T> = {
    get state(): CircuitState {
      return state;
    },

    get stats(): CircuitStats {
      return { failures, successes, lastFailureAt };
    },

    isOpen(): boolean {
      return state === 'open';
    },

    isClosed(): boolean {
      return state === 'closed';
    },

    isHalfOpen(): boolean {
      return state === 'half-open';
    },

    async fire(...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
      if (state === 'open') {
        if (Date.now() - openedAt >= timeout) {
          state = 'half-open';
          options.onHalfOpen?.();
        } else {
          if (options.fallback) {
            return options.fallback(...args);
          }
          throw new Error('Circuit is open');
        }
      }

      if (state === 'half-open') {
        try {
          const result = await fn(...args);
          successes++;
          closeCircuit();
          return result;
        } catch (error) {
          lastFailureAt = Date.now();
          failures++;
          tripOpen();
          throw error;
        }
      }

      // closed state
      try {
        const result = await fn(...args);
        successes++;
        failures = 0;
        return result;
      } catch (error) {
        failures++;
        lastFailureAt = Date.now();
        if (failures >= threshold) {
          tripOpen();
        }
        throw error;
      }
    },

    forceOpen(): void {
      state = 'open';
      openedAt = Date.now();
      options.onOpen?.();
    },

    forceClose(): void {
      state = 'closed';
      failures = 0;
      options.onClose?.();
    },

    reset(): void {
      state = 'closed';
      failures = 0;
      successes = 0;
      lastFailureAt = null;
    },
  };

  return instance;
}
