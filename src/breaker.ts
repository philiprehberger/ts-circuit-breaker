import type { CircuitBreakerOptions, CircuitState } from './types';

export interface CircuitBreakerInstance<
  T extends (...args: any[]) => Promise<any>,
> {
  fire(...args: Parameters<T>): Promise<Awaited<ReturnType<T>>>;
  readonly state: CircuitState;
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
  let openedAt = 0;

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
          closeCircuit();
          return result;
        } catch (error) {
          tripOpen();
          throw error;
        }
      }

      // closed state
      try {
        const result = await fn(...args);
        failures = 0;
        return result;
      } catch (error) {
        failures++;
        if (failures >= threshold) {
          tripOpen();
        }
        throw error;
      }
    },

    reset(): void {
      state = 'closed';
      failures = 0;
    },
  };

  return instance;
}
