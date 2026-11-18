import { describe, expect, it } from 'vitest';

import {
    RateLimiter,
} from '../src/utils/rate-limiter.js';

describe('RateLimiter utilities', () =>
{
    it('allows requests within limits', () => {
        const limiter =new RateLimiter({
            maxRequestsPerMinute: 2,
            maxTokensPerMinute: 100,
            maxConcurrent: 1,
        });

        expect(
            limiter.canProceed(50)
        ).toBe(true);
    });
    
    it('tracks active requests', async () => {
        const limiter = new RateLimiter({
            maxRequestsPerMinute: 10,
            maxTokensPerMinute: 100,
            maxConcurrent: 2,
        });

        expect(limiter.canProceed(50)).toBe(true);

        await limiter.acquire(50);

        expect(
            limiter.getStatus().activeRequests
        ).toBe(1);

        limiter.release(40);

        expect(
            limiter.getStatus().activeRequests
        ).toBe(0);
    });

    it('blocks requests exceeding token capacity', async () => {
        const limiter = new RateLimiter({
            maxRequestsPerMinute: 10,
            maxTokensPerMinute: 100,
            maxConcurrent: 2,
        });

        await limiter.acquire(80);

        expect(
            limiter.canProceed(30)
        ).toBe(false);

        limiter.release(80);
    });
});