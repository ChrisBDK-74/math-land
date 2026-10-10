/**
 * `crypto.randomUUID()` only exists in a secure context (HTTPS, or
 * exactly `localhost`) — it's simply undefined over plain HTTP on a
 * LAN address, which is how this app gets tested on a tablet before a
 * real deployment exists. `crypto.getRandomValues()` has no such
 * restriction, so we build a UUID out of that instead, with a
 * Math.random fallback for the rare case neither is available.
 */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      // Secure-context check failed even though the function exists —
      // fall through to the manual implementation below.
    }
  }

  const bytes = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }

  // Set version (4) and variant bits per RFC 4122.
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
