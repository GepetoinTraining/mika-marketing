// lib/gemini/rate-limiter.ts

interface RateLimitConfig {
    requestsPerMinute: number;
    tokensPerMinute: number;
}

const FREE_TIER_LIMITS: Record<string, RateLimitConfig> = {
    'gemini-2.5-flash': { requestsPerMinute: 15, tokensPerMinute: 1_000_000 },
    'gemini-2.5-pro': { requestsPerMinute: 5, tokensPerMinute: 250_000 },
    'gemini-embedding-001': { requestsPerMinute: 1500, tokensPerMinute: 1_000_000 },
};

class RateLimiter {
    private requests: Map<string, number[]> = new Map();

    async acquire(model: string): Promise<void> {
        const limits = FREE_TIER_LIMITS[model];
        if (!limits) return;

        const now = Date.now();
        const windowStart = now - 60_000;

        const modelRequests = this.requests.get(model) || [];
        const recentRequests = modelRequests.filter(t => t > windowStart);

        if (recentRequests.length >= limits.requestsPerMinute) {
            const oldestRequest = recentRequests[0];
            const waitTime = oldestRequest + 60_000 - now;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        recentRequests.push(now);
        this.requests.set(model, recentRequests);
    }
}

export const rateLimiter = new RateLimiter();


// Wrap all Gemini calls
export async function withRateLimit<T>(
    model: string,
    fn: () => Promise<T>
): Promise<T> {
    await rateLimiter.acquire(model);
    return fn();
}