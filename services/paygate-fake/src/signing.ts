import { createHmac, timingSafeEqual } from "node:crypto";

/** `X-PayGate-Signature: sha256=<hex HMAC-SHA256 of the raw body>` — same scheme the worker verifies. */
export function sign(secret: string, rawBody: Buffer | string): string {
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  return `sha256=${digest}`;
}

export function verify(
  secret: string,
  rawBody: Buffer | string,
  header: string | undefined,
): boolean {
  if (!header || !header.startsWith("sha256=")) return false;
  const expected = Buffer.from(sign(secret, rawBody));
  const actual = Buffer.from(header.trim());
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
