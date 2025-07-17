// Client-side rate limiter for API calls
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limits: Map<string, { requests: number; windowMs: number }> = new Map();

  constructor() {
    // Define rate limits for different endpoints
    this.limits.set('auth', { requests: 5, windowMs: 60000 }); // 5 requests per minute
    this.limits.set('transaction', { requests: 10, windowMs: 60000 }); // 10 requests per minute
    this.limits.set('api', { requests: 100, windowMs: 60000 }); // 100 requests per minute
  }

  canMakeRequest(endpoint: string): boolean {
    const limit = this.limits.get(endpoint) || { requests: 60, windowMs: 60000 };
    const now = Date.now();
    const windowStart = now - limit.windowMs;

    // Get or create request history for this endpoint
    const requests = this.requests.get(endpoint) || [];
    
    // Filter out requests outside the current window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    // Update the request history
    this.requests.set(endpoint, validRequests);

    // Check if we can make another request
    if (validRequests.length >= limit.requests) {
      return false;
    }

    // Record this request
    validRequests.push(now);
    this.requests.set(endpoint, validRequests);
    
    return true;
  }

  getRemainingRequests(endpoint: string): number {
    const limit = this.limits.get(endpoint) || { requests: 60, windowMs: 60000 };
    const now = Date.now();
    const windowStart = now - limit.windowMs;
    
    const requests = this.requests.get(endpoint) || [];
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, limit.requests - validRequests.length);
  }

  getResetTime(endpoint: string): number {
    const limit = this.limits.get(endpoint) || { requests: 60, windowMs: 60000 };
    const requests = this.requests.get(endpoint) || [];
    
    if (requests.length === 0) return Date.now();
    
    return requests[0] + limit.windowMs;
  }
}

export const rateLimiter = new RateLimiter();