/**
 * Rate Limiter simple par IP (in-memory) pour protéger les routes API Next.js.
 */

export function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 5 } = {}) {
  const hits = new Map();

  return function checkRateLimit(ip) {
    if (!ip || ip === "unknown") return false;

    const now = Date.now();

    // Nettoyage des anciennes entrées périodiquement
    for (const [key, val] of hits) {
      if (now - val.start > windowMs) hits.delete(key);
    }

    const record = hits.get(ip);
    if (!record || now - record.start > windowMs) {
      hits.set(ip, { count: 1, start: now });
      return false;
    }

    record.count++;
    return record.count > max;
  };
}

export function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}
