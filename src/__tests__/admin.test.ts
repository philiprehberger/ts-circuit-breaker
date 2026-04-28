import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { circuitBreaker } from '../../dist/index.js';

describe('admin controls', () => {
  it('forceOpen rejects subsequent calls', async () => {
    const cb = circuitBreaker(async () => 'ok');
    cb.forceOpen();
    assert.equal(cb.isOpen(), true);
    await assert.rejects(() => cb.fire(), /Circuit is open/);
  });

  it('forceClose resets to closed state', async () => {
    const cb = circuitBreaker(async () => 'ok');
    cb.forceOpen();
    cb.forceClose();
    assert.equal(cb.isClosed(), true);
    assert.equal(await cb.fire(), 'ok');
  });

  it('exposes failure/success stats', async () => {
    let n = 0;
    const cb = circuitBreaker(async () => {
      n++;
      if (n <= 2) throw new Error('boom');
      return 'ok';
    }, { threshold: 5 });

    await assert.rejects(() => cb.fire());
    await assert.rejects(() => cb.fire());
    assert.equal(cb.stats.failures, 2);
    assert.equal(cb.stats.successes, 0);
    assert.notEqual(cb.stats.lastFailureAt, null);

    await cb.fire();
    assert.equal(cb.stats.successes, 1);
  });

  it('isHalfOpen reflects half-open state', async () => {
    let fail = true;
    const cb = circuitBreaker(async () => {
      if (fail) throw new Error('boom');
      return 'ok';
    }, { threshold: 1, timeout: 5 });

    await assert.rejects(() => cb.fire());
    assert.equal(cb.isOpen(), true);

    await new Promise((r) => setTimeout(r, 10));
    fail = false;
    await cb.fire();
    assert.equal(cb.isClosed(), true);
  });
});
