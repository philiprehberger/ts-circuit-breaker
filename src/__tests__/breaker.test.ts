import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { circuitBreaker } from '../../dist/index.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('circuitBreaker', () => {
  it('should pass through calls in closed state', async () => {
    const fn = async (x: number) => x * 2;
    const cb = circuitBreaker(fn);

    const result = await cb.fire(5);
    assert.equal(result, 10);
    assert.equal(cb.state, 'closed');
  });

  it('should track failures', async () => {
    const fn = async () => {
      throw new Error('fail');
    };
    const cb = circuitBreaker(fn, { threshold: 3 });

    for (let i = 0; i < 2; i++) {
      await assert.rejects(() => cb.fire());
    }
    assert.equal(cb.state, 'closed');
  });

  it('should trip to open after threshold failures', async () => {
    const fn = async () => {
      throw new Error('fail');
    };
    const cb = circuitBreaker(fn, { threshold: 3 });

    for (let i = 0; i < 3; i++) {
      await assert.rejects(() => cb.fire());
    }
    assert.equal(cb.state, 'open');
  });

  it('should reject immediately when open', async () => {
    const fn = async () => {
      throw new Error('fail');
    };
    const cb = circuitBreaker(fn, { threshold: 1, timeout: 60000 });

    await assert.rejects(() => cb.fire());
    assert.equal(cb.state, 'open');

    await assert.rejects(() => cb.fire(), { message: 'Circuit is open' });
  });

  it('should call fallback when open', async () => {
    const fn = async () => {
      throw new Error('fail');
    };
    const cb = circuitBreaker(fn, {
      threshold: 1,
      timeout: 60000,
      fallback: () => 'fallback-value',
    });

    await assert.rejects(() => cb.fire());
    const result = await cb.fire();
    assert.equal(result, 'fallback-value');
  });

  it('should transition to half-open after timeout', async () => {
    const calls: string[] = [];
    let shouldFail = true;
    const fn = async () => {
      if (shouldFail) throw new Error('fail');
      return 'ok';
    };
    const cb = circuitBreaker(fn, {
      threshold: 1,
      timeout: 50,
      onHalfOpen: () => calls.push('half-open'),
    });

    await assert.rejects(() => cb.fire());
    assert.equal(cb.state, 'open');

    await sleep(60);
    shouldFail = false;

    const result = await cb.fire();
    assert.equal(result, 'ok');
    assert.ok(calls.includes('half-open'));
  });

  it('should close circuit on half-open success', async () => {
    const calls: string[] = [];
    let shouldFail = true;
    const fn = async () => {
      if (shouldFail) throw new Error('fail');
      return 'ok';
    };
    const cb = circuitBreaker(fn, {
      threshold: 1,
      timeout: 50,
      onClose: () => calls.push('closed'),
    });

    await assert.rejects(() => cb.fire());
    await sleep(60);
    shouldFail = false;

    await cb.fire();
    assert.equal(cb.state, 'closed');
    assert.ok(calls.includes('closed'));
  });

  it('should re-open circuit on half-open failure', async () => {
    const fn = async () => {
      throw new Error('fail');
    };
    const cb = circuitBreaker(fn, { threshold: 1, timeout: 50 });

    await assert.rejects(() => cb.fire());
    await sleep(60);

    await assert.rejects(() => cb.fire());
    assert.equal(cb.state, 'open');
  });

  it('should reset to closed state', async () => {
    const fn = async () => {
      throw new Error('fail');
    };
    const cb = circuitBreaker(fn, { threshold: 1 });

    await assert.rejects(() => cb.fire());
    assert.equal(cb.state, 'open');

    cb.reset();
    assert.equal(cb.state, 'closed');
  });

  it('should reflect current state', async () => {
    const fn = async () => {
      throw new Error('fail');
    };
    const cb = circuitBreaker(fn, { threshold: 2 });

    assert.equal(cb.state, 'closed');
    await assert.rejects(() => cb.fire());
    assert.equal(cb.state, 'closed');
    await assert.rejects(() => cb.fire());
    assert.equal(cb.state, 'open');
  });

  it('should call onOpen callback', async () => {
    const calls: string[] = [];
    const fn = async () => {
      throw new Error('fail');
    };
    const cb = circuitBreaker(fn, {
      threshold: 1,
      onOpen: () => calls.push('opened'),
    });

    await assert.rejects(() => cb.fire());
    assert.deepEqual(calls, ['opened']);
  });
});
