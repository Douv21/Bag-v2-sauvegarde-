const config = require('../config.json');

class RateLimit {
    constructor() {
        this.userLimits = new Map();
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
    }

    checkRateLimit(userId) {
        const now = Date.now();
        const windowStart = now - config.rateLimitWindow;
        
        if (!this.userLimits.has(userId)) {
            return { allowed: true, count: 0, timeLeft: 0 };
        }

        const userRecord = this.userLimits.get(userId);
        
        // Filter out old attempts outside the window
        const recentAttempts = userRecord.attempts.filter(timestamp => timestamp > windowStart);
        
        if (recentAttempts.length >= config.rateLimitMax) {
            const oldestAttempt = Math.min(...recentAttempts);
            const timeLeft = config.rateLimitWindow - (now - oldestAttempt);
            
            return { 
                allowed: false, 
                count: recentAttempts.length, 
                timeLeft: Math.max(0, timeLeft)
            };
        }

        return { 
            allowed: true, 
            count: recentAttempts.length, 
            timeLeft: 0 
        };
    }

    updateRateLimit(userId) {
        const now = Date.now();
        const windowStart = now - config.rateLimitWindow;

        if (!this.userLimits.has(userId)) {
            this.userLimits.set(userId, { attempts: [] });
        }

        const userRecord = this.userLimits.get(userId);
        
        // Add current attempt
        userRecord.attempts.push(now);
        
        // Remove old attempts outside the window
        userRecord.attempts = userRecord.attempts.filter(timestamp => timestamp > windowStart);
        
        // Update the record
        this.userLimits.set(userId, userRecord);
    }

    getRemainingAttempts(userId) {
        const result = this.checkRateLimit(userId);
        return config.rateLimitMax - result.count;
    }

    resetUserLimit(userId) {
        this.userLimits.delete(userId);
    }

    cleanup() {
        const now = Date.now();
        const cutoff = now - config.rateLimitWindow;
        
        for (const [userId, userRecord] of this.userLimits.entries()) {
            // Filter out old attempts
            userRecord.attempts = userRecord.attempts.filter(timestamp => timestamp > cutoff);
            
            // Remove users with no recent attempts
            if (userRecord.attempts.length === 0) {
                this.userLimits.delete(userId);
            }
        }
    }

    getStatistics() {
        return {
            totalUsers: this.userLimits.size,
            rateLimitConfig: {
                windowMs: config.rateLimitWindow,
                maxAttempts: config.rateLimitMax
            }
        };
    }

    // Admin function to check user's current rate limit status
    getUserStatus(userId) {
        const result = this.checkRateLimit(userId);
        return {
            userId,
            attempts: result.count,
            remaining: config.rateLimitMax - result.count,
            timeUntilReset: result.timeLeft,
            isLimited: !result.allowed
        };
    }
}

module.exports = new RateLimit();
