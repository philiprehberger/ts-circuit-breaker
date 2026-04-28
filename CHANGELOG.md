# Changelog

## 0.2.0

- Add `forceOpen()` and `forceClose()` admin methods
- Add `stats` getter exposing `{ failures, successes, lastFailureAt }`
- Add `isOpen()` / `isClosed()` / `isHalfOpen()` state predicates
- `reset()` now also clears success and last-failure stats

## 0.1.2

- Standardize README to 3-badge format with emoji Support section
- Update CI actions to v5 for Node.js 24 compatibility
- Add GitHub issue templates, dependabot config, and PR template

## 0.1.1

- Standardize README badges

## 0.1.0 (2026-03-21)

- Initial release
- `circuitBreaker()` for fault-tolerant async calls
- Closed, open, and half-open states
- Configurable failure threshold and timeout
- Fallback function support
- `reset()` to force closed state
