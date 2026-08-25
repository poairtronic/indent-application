import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

interface AttemptRecord {
  count: number;
  firstAttemptTime: number;
  lastAttemptTime: number;
}

@Injectable()
export class AuthRateLimitService {
  // Max failed attempts per window
  private readonly MAX_FAILED_ATTEMPTS = 5;
  // Window duration in milliseconds (1 minute)
  private readonly WINDOW_MS = 60 * 1000;
  // IP Flood protection (e.g. max 60 total attempts per min per IP)
  private readonly IP_FLOOD_LIMIT = 60;

  // In-memory maps for tracking
  private readonly failedAttemptsByIpEmail = new Map<string, AttemptRecord>();
  private readonly failedAttemptsByIp = new Map<string, AttemptRecord>();
  private readonly totalAttemptsByIp = new Map<string, AttemptRecord>();

  /**
   * Check if the incoming login request should be rate-limited before executing auth logic.
   * Throws 429 HttpException if limits are exceeded.
   */
  checkRateLimit(ip: string, email: string): void {
    const now = Date.now();
    const cleanIp = ip || 'unknown';
    const cleanEmail = (email || '').toLowerCase().trim();

    // 1. IP Flood check (DDoS / automated flooding protection)
    const ipTotal = this.totalAttemptsByIp.get(cleanIp);
    if (ipTotal) {
      if (now - ipTotal.firstAttemptTime < this.WINDOW_MS) {
        if (ipTotal.count >= this.IP_FLOOD_LIMIT) {
          throw new HttpException(
            'Too many requests from this IP. Please wait one minute before trying again.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      } else {
        // Window expired, reset
        this.totalAttemptsByIp.delete(cleanIp);
      }
    }

    // 2. Failed attempts by IP + Email (Brute force protection per target account from this IP)
    const key = `${cleanIp}:${cleanEmail}`;
    const targetRecord = this.failedAttemptsByIpEmail.get(key);
    if (targetRecord) {
      if (now - targetRecord.firstAttemptTime < this.WINDOW_MS) {
        if (targetRecord.count >= this.MAX_FAILED_ATTEMPTS) {
          const remainingSeconds = Math.ceil(
            (this.WINDOW_MS - (now - targetRecord.firstAttemptTime)) / 1000,
          );
          throw new HttpException(
            `Too many login attempts. Please wait ${remainingSeconds} second(s) before trying again.`,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      } else {
        // Window expired, clean up
        this.failedAttemptsByIpEmail.delete(key);
      }
    }

    // 3. Failed attempts by IP (Brute force dictionary attacks trying many different usernames)
    const ipRecord = this.failedAttemptsByIp.get(cleanIp);
    if (ipRecord) {
      if (now - ipRecord.firstAttemptTime < this.WINDOW_MS) {
        if (ipRecord.count >= this.MAX_FAILED_ATTEMPTS * 3) {
          throw new HttpException(
            'Too many failed login attempts from this network. Please wait one minute before trying again.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      } else {
        this.failedAttemptsByIp.delete(cleanIp);
      }
    }

    // Record incoming attempt for IP flood tracking
    this.recordIpAttempt(cleanIp, now);
  }

  /**
   * Record a failed login attempt (wrong password, account inactive, user not found).
   */
  recordFailedAttempt(ip: string, email: string): void {
    const now = Date.now();
    const cleanIp = ip || 'unknown';
    const cleanEmail = (email || '').toLowerCase().trim();
    const key = `${cleanIp}:${cleanEmail}`;

    // Record by IP + Email
    const current = this.failedAttemptsByIpEmail.get(key);
    if (!current || now - current.firstAttemptTime >= this.WINDOW_MS) {
      this.failedAttemptsByIpEmail.set(key, {
        count: 1,
        firstAttemptTime: now,
        lastAttemptTime: now,
      });
    } else {
      current.count += 1;
      current.lastAttemptTime = now;
    }

    // Record by IP
    const currentIp = this.failedAttemptsByIp.get(cleanIp);
    if (!currentIp || now - currentIp.firstAttemptTime >= this.WINDOW_MS) {
      this.failedAttemptsByIp.set(cleanIp, {
        count: 1,
        firstAttemptTime: now,
        lastAttemptTime: now,
      });
    } else {
      currentIp.count += 1;
      currentIp.lastAttemptTime = now;
    }
  }

  /**
   * Reset failed attempt counter upon successful login.
   * Legitimate users logging in/out/in are never blocked.
   */
  recordSuccessfulLogin(ip: string, email: string): void {
    const cleanIp = ip || 'unknown';
    const cleanEmail = (email || '').toLowerCase().trim();
    const key = `${cleanIp}:${cleanEmail}`;

    // Clear failed attempts for this user/ip
    this.failedAttemptsByIpEmail.delete(key);

    // Decrement or clear IP failure count
    const ipRecord = this.failedAttemptsByIp.get(cleanIp);
    if (ipRecord) {
      if (ipRecord.count <= 1) {
        this.failedAttemptsByIp.delete(cleanIp);
      } else {
        ipRecord.count -= 1;
      }
    }
  }

  private recordIpAttempt(ip: string, now: number): void {
    const current = this.totalAttemptsByIp.get(ip);
    if (!current || now - current.firstAttemptTime >= this.WINDOW_MS) {
      this.totalAttemptsByIp.set(ip, {
        count: 1,
        firstAttemptTime: now,
        lastAttemptTime: now,
      });
    } else {
      current.count += 1;
      current.lastAttemptTime = now;
    }
  }

  /**
   * Manually reset all rate limits (useful for testing or admin unblock).
   */
  resetAll(): void {
    this.failedAttemptsByIpEmail.clear();
    this.failedAttemptsByIp.clear();
    this.totalAttemptsByIp.clear();
  }
}
