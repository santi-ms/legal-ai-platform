/**
 * AES-256-GCM symmetric encryption for sensitive values (portal passwords, tokens).
 *
 * Requires env var PORTAL_ENCRYPTION_KEY — 64 hex chars (32 bytes).
 * Generate once with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Format stored in DB: "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.PORTAL_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "PORTAL_ENCRYPTION_KEY must be 64 hex chars (32 bytes). " +
        "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(hex, "hex");
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv  = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag   = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(stored: string): string {
  const parts = stored.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted value format");

  const [ivHex, tagHex, cipherHex] = parts;
  const key     = getKey();
  const iv      = Buffer.from(ivHex,    "hex");
  const authTag = Buffer.from(tagHex,   "hex");
  const cipher  = Buffer.from(cipherHex,"hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return decipher.update(cipher).toString("utf8") + decipher.final("utf8");
}
