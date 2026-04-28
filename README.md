# @philiprehberger/circuit-breaker

[![CI](https://github.com/philiprehberger/ts-circuit-breaker/actions/workflows/ci.yml/badge.svg)](https://github.com/philiprehberger/ts-circuit-breaker/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/circuit-breaker.svg)](https://www.npmjs.com/package/@philiprehberger/circuit-breaker)
[![Last updated](https://img.shields.io/github/last-commit/philiprehberger/ts-circuit-breaker)](https://github.com/philiprehberger/ts-circuit-breaker/commits/main)

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

### Admin & Stats

```ts
import { circuitBreaker } from '@philiprehberger/circuit-breaker';

const cb = circuitBreaker(fetchUser);

cb.forceOpen();   // trip the breaker manually
cb.forceClose();  // close it again

if (cb.isOpen()) {
  return cachedUser;
}

console.log(cb.stats); // { failures, successes, lastFailureAt }
```

## API

| Function / Property | Description |
|---------------------|-------------|
| `circuitBreaker(fn, options?)` | Wrap an async function with circuit breaker logic |
| `.fire(...args)` | Call the wrapped function (respects circuit state) |
| `.state` | Current circuit state: `'closed'`, `'open'`, or `'half-open'` |
| `.stats` | `{ failures, successes, lastFailureAt }` snapshot |
| `.isOpen()` / `.isClosed()` / `.isHalfOpen()` | State predicates |
| `.forceOpen()` | Force the circuit open |
| `.forceClose()` | Force the circuit closed |
| `.reset()` | Reset to closed state and clear stats |

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

## Support

If you find this project useful:

⭐ [Star the repo](https://github.com/philiprehberger/ts-circuit-breaker)

🐛 [Report issues](https://github.com/philiprehberger/ts-circuit-breaker/issues?q=is%3Aissue+is%3Aopen+label%3Abug)

💡 [Suggest features](https://github.com/philiprehberger/ts-circuit-breaker/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)

❤️ [Sponsor development](https://github.com/sponsors/philiprehberger)

🌐 [All Open Source Projects](https://philiprehberger.com/open-source-packages)

💻 [GitHub Profile](https://github.com/philiprehberger)

🔗 [LinkedIn Profile](https://www.linkedin.com/in/philiprehberger)

## License

[MIT](LICENSE)
