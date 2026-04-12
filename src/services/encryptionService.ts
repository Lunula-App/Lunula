/**
 * AES-256-GCM encryption layer for Bloom backups.
 *
 * Keys are derived from a user passphrase using PBKDF2-SHA256 (210,000
 * iterations — OWASP 2023 recommendation). A unique 128-bit salt is
 * generated when the passphrase is first set; it is stored in SecureStore
 * on this device and also embedded in every backup file so the backup can
 * be decrypted on any device using just the passphrase.
 *
 * Nothing sensitive (key, passphrase) is persisted — only the salt.
 */

import Crypto from 'react-native-quick-crypto';
import { pbkdf2Sync } from 'react-native-quick-crypto';
import { Buffer } from '@craftzdog/react-native-buffer';
import * as SecureStore from 'expo-secure-store';

const SALT_STORE_KEY = 'bloom_backup_salt_v2';
const PBKDF2_ITERATIONS = 210_000;
const PBKDF2_KEYLEN = 32; // 256 bits
const PBKDF2_DIGEST = 'sha256';

export interface EncryptedPayload {
  version: 2;
  iv: string;         // base64
  ciphertext: string; // base64
  tag: string;        // base64 GCM auth tag
}

// ── Salt management ───────────────────────────────────────────────────────────

/** Returns the stored salt, or generates and stores a fresh one. */
export async function getOrCreateSalt(): Promise<Buffer> {
  const stored = await SecureStore.getItemAsync(SALT_STORE_KEY);
  if (stored) return Buffer.from(stored, 'base64');

  const salt = Crypto.randomBytes(16) as Buffer;
  await SecureStore.setItemAsync(SALT_STORE_KEY, salt.toString('base64'));
  return salt;
}

/** Returns true if a salt (i.e. a passphrase has been set) exists on this device. */
export async function hasPassphrase(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(SALT_STORE_KEY);
  return stored !== null;
}

/**
 * Imports a salt from a backup file and stores it on this device.
 * Called during restore — lets subsequent backups use the same salt/passphrase.
 */
export async function importSalt(base64Salt: string): Promise<void> {
  await SecureStore.setItemAsync(SALT_STORE_KEY, base64Salt);
}

// ── Key derivation ────────────────────────────────────────────────────────────

export function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return pbkdf2Sync(
    passphrase,
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEYLEN,
    PBKDF2_DIGEST
  ) as Buffer;
}

// ── GCM cipher interfaces ─────────────────────────────────────────────────────
// react-native-quick-crypto's TS types omit GCM-specific methods; these
// interfaces let us cast to them safely instead of reaching for `as any`.

interface GCMCipher {
  update(data: string, inputEncoding: string, outputEncoding: string): string;
  final(outputEncoding: string): string;
  getAuthTag(): Buffer;
}

interface GCMDecipher {
  update(data: string, inputEncoding: string, outputEncoding: string): string;
  final(outputEncoding: string): string;
  setAuthTag(tag: Buffer): void;
}

// ── Encrypt / decrypt ─────────────────────────────────────────────────────────

export function encrypt(plaintext: string, key: Buffer): EncryptedPayload {
  const iv = Crypto.randomBytes(12) as Buffer;
  const cipher = Crypto.createCipheriv('aes-256-gcm', key, iv) as unknown as GCMCipher;

  const part1 = cipher.update(plaintext, 'utf8', 'base64');
  const part2 = cipher.final('base64');
  const tag = cipher.getAuthTag();

  if (!tag || tag.length !== 16) {
    throw new Error('AES-GCM auth tag has unexpected length — encryption failed');
  }

  return {
    version: 2,
    iv: iv.toString('base64'),
    ciphertext: part1 + part2,
    tag: tag.toString('base64'),
  };
}

export function decrypt(payload: EncryptedPayload, key: Buffer): string {
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');

  if (iv.length !== 12) throw new Error('Invalid IV length for AES-GCM');
  if (tag.length !== 16) throw new Error('Invalid GCM auth tag length');

  const decipher = Crypto.createDecipheriv('aes-256-gcm', key, iv) as unknown as GCMDecipher;
  decipher.setAuthTag(tag);

  const part1 = decipher.update(payload.ciphertext, 'base64', 'utf8');
  const part2 = decipher.final('utf8');
  return part1 + part2;
}
