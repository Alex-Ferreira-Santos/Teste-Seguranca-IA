import dns from "dns/promises";
import { WebhookValidationResult } from "../types/webhook.types";

// ─── Blocklists ───────────────────────────────────────────────────────────────

/**
 * RFC 5735 / RFC 6890 private & special-purpose IPv4 ranges.
 * Used to prevent SSRF attacks targeting internal infrastructure.
 */
const BLOCKED_IPV4_CIDRS: Array<{ network: number; mask: number }> = [
  // Loopback
  { network: ipToInt("127.0.0.0"), mask: cidrMask(8) },
  // Private class A
  { network: ipToInt("10.0.0.0"), mask: cidrMask(8) },
  // Private class B
  { network: ipToInt("172.16.0.0"), mask: cidrMask(12) },
  // Private class C
  { network: ipToInt("192.168.0.0"), mask: cidrMask(16) },
  // Link-local
  { network: ipToInt("169.254.0.0"), mask: cidrMask(16) },
  // CGNAT
  { network: ipToInt("100.64.0.0"), mask: cidrMask(10) },
  // Broadcast
  { network: ipToInt("255.255.255.255"), mask: cidrMask(32) },
  // Unspecified
  { network: ipToInt("0.0.0.0"), mask: cidrMask(8) },
  // Documentation ranges
  { network: ipToInt("192.0.2.0"), mask: cidrMask(24) },
  { network: ipToInt("198.51.100.0"), mask: cidrMask(24) },
  { network: ipToInt("203.0.113.0"), mask: cidrMask(24) },
];

const BLOCKED_IPV6_PREFIXES = [
  "::1",           // loopback
  "fc",            // unique local
  "fd",            // unique local
  "fe80",          // link-local
  "::",            // unspecified
];

/** Schemas that must never be used in webhook URLs. */
const ALLOWED_SCHEMES = new Set(["https:"]);

/** Ports forbidden even on HTTPS — prevents redirecting to non-standard services. */
const BLOCKED_PORTS = new Set([
  0, 21, 22, 23, 25, 53, 80, 110, 143, 389, 443, 445,
  1080, 1433, 1521, 2375, 2376, 3306, 3389, 5432, 5900,
  6379, 6443, 8080, 8443, 8888, 9200, 27017,
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ipToInt(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0;
}

function cidrMask(bits: number): number {
  return (~0 << (32 - bits)) >>> 0;
}

function isPrivateIPv4(ip: string): boolean {
  const n = ipToInt(ip);
  return BLOCKED_IPV4_CIDRS.some(
    ({ network, mask }) => (n & mask) === network
  );
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return BLOCKED_IPV6_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

// ─── Main validator ───────────────────────────────────────────────────────────

export async function validateWebhookUrl(
  rawUrl: string
): Promise<WebhookValidationResult> {
  // 1. Basic sanity checks
  if (!rawUrl || typeof rawUrl !== "string") {
    return { isValid: false, error: "URL is required." };
  }

  const trimmed = rawUrl.trim();

  if (trimmed.length > 2048) {
    return { isValid: false, error: "URL must not exceed 2048 characters." };
  }

  // 2. Parse URL (throws on malformed input)
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: "Invalid URL format." };
  }

  // 3. Scheme check — only HTTPS allowed (prevents plain-text exfiltration)
  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    return {
      isValid: false,
      error: "Only HTTPS URLs are accepted for security reasons.",
    };
  }

  // 4. No credentials in URL (user:pass@host leaks secrets in logs)
  if (parsed.username || parsed.password) {
    return {
      isValid: false,
      error: "URLs must not contain embedded credentials.",
    };
  }

  // 5. No fragment — fragments are client-side only and have no purpose here
  if (parsed.hash) {
    return { isValid: false, error: "URLs must not contain fragments (#)." };
  }

  // 6. Port check
  const port = parsed.port ? parseInt(parsed.port, 10) : 443;
  if (BLOCKED_PORTS.has(port)) {
    return {
      isValid: false,
      error: `Port ${port} is not allowed for webhook delivery.`,
    };
  }

  const hostname = parsed.hostname;

  // 7. Disallow raw IP literals in the URL
  //    (attackers could bypass DNS by providing the IP directly)
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Pattern = /^\[.*\]$/; // bracket notation means IPv6 literal

  if (ipv4Pattern.test(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return {
        isValid: false,
        error: "Webhook URL must not point to a private/internal IP address.",
      };
    }
    // Even public IPs are rejected — we require a proper hostname
    return {
      isValid: false,
      error: "IP address literals are not accepted; provide a hostname.",
    };
  }

  if (ipv6Pattern.test(hostname)) {
    const bare = hostname.slice(1, -1); // strip brackets
    if (isPrivateIPv6(bare)) {
      return {
        isValid: false,
        error: "Webhook URL must not point to a private/internal IPv6 address.",
      };
    }
    return {
      isValid: false,
      error: "IPv6 literals are not accepted; provide a hostname.",
    };
  }

  // 8. Hostname length / label validity (prevents exotic bypasses)
  if (hostname.length > 253) {
    return { isValid: false, error: "Hostname is too long." };
  }

  const labelRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
  const labels = hostname.split(".");
  for (const label of labels) {
    if (!labelRegex.test(label)) {
      return { isValid: false, error: `Invalid hostname label: "${label}".` };
    }
  }

  // 9. DNS resolution — resolve the hostname and block any private IPs
  //    This is the primary SSRF mitigation for DNS rebinding scenarios.
  //    NOTE: There is still a TOCTOU window between resolution and the actual
  //    HTTP request. Mitigate by re-resolving inside the HTTP dispatcher and
  //    using a dedicated egress proxy that blocks RFC-1918 ranges.
  let resolvedAddresses: string[];
  try {
    const result = await dns.lookup(hostname, { all: true });
    resolvedAddresses = result.map((r) => r.address);
  } catch {
    return {
      isValid: false,
      error: "Unable to resolve hostname. Verify the URL is correct.",
    };
  }

  for (const addr of resolvedAddresses) {
    if (ipv4Pattern.test(addr) && isPrivateIPv4(addr)) {
      return {
        isValid: false,
        error: "Hostname resolves to a private/internal address.",
      };
    }
    if (!ipv4Pattern.test(addr) && isPrivateIPv6(addr)) {
      return {
        isValid: false,
        error: "Hostname resolves to a private/internal IPv6 address.",
      };
    }
  }

  return { isValid: true };
}