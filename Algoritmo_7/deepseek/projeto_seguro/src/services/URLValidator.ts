// src/services/URLValidator.ts
import dns from 'dns/promises';

export class URLValidator {
  private static BLOCKED_DOMAINS = [
    'localhost', '127.0.0.1', '0.0.0.0', '::1',
    '192.168.', '10.', '172.16.', '172.17.', '172.18.',
    '172.19.', '172.20.', '172.21.', '172.22.', '172.23.',
    '172.24.', '172.25.', '172.26.', '172.27.', '172.28.',
    '172.29.', '172.30.', '172.31.', '169.254.', 'metadata'
  ];

  private static ALLOWED_PROTOCOLS = ['https:', 'http:'];
  private static MAX_URL_LENGTH = 2000;

  static async validateAndSanitize(rawUrl: string): Promise<string> {
    // Basic validations
    if (!rawUrl || typeof rawUrl !== 'string') {
      throw new Error('URL is required');
    }

    if (rawUrl.length > this.MAX_URL_LENGTH) {
      throw new Error(`URL exceeds maximum length of ${this.MAX_URL_LENGTH} characters`);
    }

    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch (error) {
      throw new Error('Invalid URL format');
    }

    // Protocol validation
    if (!this.ALLOWED_PROTOCOLS.includes(url.protocol)) {
      throw new Error('Only HTTP and HTTPS protocols are allowed');
    }

    // Prevent URL parsing inconsistencies
    if (rawUrl !== url.toString() && rawUrl !== url.href) {
      throw new Error('URL contains invalid encoding');
    }

    const hostname = url.hostname.toLowerCase();

    // Check blocked domains
    for (const blocked of this.BLOCKED_DOMAINS) {
      if (hostname === blocked || hostname.startsWith(blocked)) {
        throw new Error(`Domain ${hostname} is not allowed for security reasons`);
      }
    }

    // Resolve DNS and check if IP is private
    try {
      const addresses = await dns.resolve(hostname);
      for (const addr of addresses) {
        if (this.isPrivateIP(addr)) {
          throw new Error(`IP address ${addr} is private/internal`);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('private/internal')) {
        throw error;
      }
      // DNS resolution failed - still allow if domain looks safe
      console.warn(`DNS resolution failed for ${hostname}:`, error);
    }

    // Remove any fragments or weird stuff
    url.hash = '';
    url.password = '';
    url.username = '';

    return url.toString();
  }

  private static isPrivateIP(ip: string): boolean {
    // IPv4 private ranges
    const ipv4Private = [
      /^10\./, /^127\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^192\.168\./, /^169\.254\./,
      /^0\./, /^224\./, /^240\./
    ];

    // IPv6 private/unique local
    const ipv6Private = [
      /^::1$/, /^fc00:/, /^fd00:/, /^fe80:/
    ];

    if (ipv4Private.some(pattern => pattern.test(ip))) return true;
    if (ipv6Private.some(pattern => pattern.test(ip))) return true;

    return false;
  }
}