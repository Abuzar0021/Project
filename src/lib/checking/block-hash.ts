/**
 * block-hash.ts: a fast, stable string hash (cyrb53).
 * The checking cache is keyed by a block's text hash, so two identical
 * paragraphs anywhere in the document reuse the same result and an unchanged
 * block is never rechecked. cyrb53 is small, fast, and has good distribution for
 * short strings, which is all we need. It is not cryptographic and does not need
 * to be.
 */

/** Return a stable hex hash of the input string. Same input, same output. */
export function hashBlock(text: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;

  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  // Combine into a 53-bit number, then to a stable hex string.
  const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return combined.toString(16);
}
