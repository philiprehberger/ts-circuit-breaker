export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitStats {
  failures: number;
  successes: number;
  lastFailureAt: number | null;
}

export interface CircuitBreakerOptions {
  threshold?: number;
  timeout?: number;
  fallback?: (...args: any[]) => any;
  onOpen?: () => void;
  onClose?: () => void;
  onHalfOpen?: () => void;
}
