# @philiprehberger/circuit-breaker

[![CI](https://github.com/philiprehberger/ts-circuit-breaker/actions/workflows/ci.yml/badge.svg)](https://github.com/philiprehberger/ts-circuit-breaker/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/circuit-breaker)](https://www.npmjs.com/package/@philiprehberger/circuit-breaker)
[![License](https://img.shields.io/github/license/philiprehberger/ts-circuit-breaker)](LICENSE)

Circuit breaker pattern for fault-tolerant async service calls.

## Installation

```bash
npm install @philiprehberger/circuit-breaker
```

## Usage

```ts
import { circuitBreaker } from '@philiprehberger/circuit-breaker';

const fetchUser = async (id: string) => {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error('Request failed');
  return res.json();
};

const cb = circuitBreaker(fetchUser, {
  threshold: 3,
  timeout: 10000,
});

try {
  const user = await cb.fire('user-123');
  console.log(user);
} catch (err) {
  console.error('Call failed:', err);
}
```

### Fallback

```ts
import { circuitBreaker } from '@philiprehberger/circuit-breaker';

const cb = circuitBreaker(fetchUser, {
  threshold: 3,
  timeout: 10000,
  fallback: (id) => ({ id, name: 'Cached User' }),
});

// When the circuit is open, the fallback is called instead of rejecting
const user = await cb.fire('user-123');
```

### State Callbacks

```ts
import { circuitBreaker } from '@philiprehberger/circuit-breaker';

const cb = circuitBreaker(fetchUser, {
  threshold: 5,
  timeout: 30000,
  onOpen: () => console.log('Circuit opened — too many failures'),
  onHalfOpen: () => console.log('Circuit half-open — testing recovery'),
  onClose: () => console.log('Circuit closed — service recovered'),
});
```

## API

| Function / Property | Description |
|---------------------|-------------|
| `circuitBreaker(fn, options?)` | Wrap an async function with circuit breaker logic |
| `.fire(...args)` | Call the wrapped function (respects circuit state) |
| `.state` | Current circuit state: `'closed'`, `'open'`, or `'half-open'` |
| `.reset()` | Force the circuit back to closed state |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `threshold` | `number` | `5` | Failures before opening the circuit |
| `timeout` | `number` | `30000` | Milliseconds before trying half-open |
| `fallback` | `function` | `undefined` | Called instead of rejecting when open |
| `onOpen` | `function` | `undefined` | Called when circuit opens |
| `onClose` | `function` | `undefined` | Called when circuit closes |
| `onHalfOpen` | `function` | `undefined` | Called when circuit enters half-open |

## Development

```bash
npm install
npm run build
npm test
npm run typecheck
```

## License

MIT
