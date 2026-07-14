export type RateLimitResult = { allowed: boolean; retryAfterSeconds?: number }

export interface RateLimiter {
  check(key: string): RateLimitResult
}

/**
 * Sliding window em memória. Adequada para o estágio atual (lançamento,
 * instância única) — cada instância serverless tem seu próprio estado, então
 * o limite real é "por instância", não global. Quando o tráfego justificar,
 * trocar por um store compartilhado (Upstash Redis / Vercel KV) implementando
 * a mesma interface `RateLimiter`: nenhum call site precisa mudar.
 */
export function createInMemoryRateLimiter(opts: {
  limit: number
  windowMs: number
}): RateLimiter {
  const hits = new Map<string, number[]>()

  return {
    check(key: string): RateLimitResult {
      const now = Date.now()
      const windowStart = now - opts.windowMs
      const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart)

      if (timestamps.length >= opts.limit) {
        const retryAfterMs = timestamps[0] + opts.windowMs - now
        hits.set(key, timestamps)
        return { allowed: false, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) }
      }

      timestamps.push(now)
      hits.set(key, timestamps)
      return { allowed: true }
    },
  }
}

export const waitlistRateLimiter = createInMemoryRateLimiter({
  limit: 5,
  windowMs: 10 * 60 * 1000,
})
