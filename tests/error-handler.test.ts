import { describe, expect, it, vi } from 'vitest';

import {
    ReviewError,
    withRetry,
    withTimeout,
} from '../src/utils/error-handler.js';

describe('error-handler utilities', () => {
    it('retries before succeeding',async () => {
            const fn = vi
            .fn()
            .mockRejectedValueOnce(new Error('temporary'))
            .mockResolvedValueOnce('ok');

            await expect(
                withRetry(fn, 2, 1)
            ).resolves.toBe('ok');

            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('throws when retries are exhausted', async() => {
            const fn = vi
            .fn()
            .mockRejectedValue(
                new Error('persistent failure')
            );

            await expect(
                withRetry(fn, 2, 1)
            ).rejects.toBeInstanceOf(ReviewError);

            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('returns before timeout', async () => {
            await expect(
                withTimeout(
                    async () => 'completed',
                    100
                )
            ).resolves.toBe('completed');
        });

        it('times out long operations', async () => {
            await expect(
                withTimeout(
                    () => new Promise<never>(() => {}),
                    5
                )
            ).rejects.toBeInstanceOf(ReviewError);
        });
});