
import { createHash, createHmac } from 'crypto';

export const sha256Hex = (s: string) =>
  createHash('sha256').update(s, 'utf8').digest('hex');

// Optional: legacy HMAC used in earlier PHP (not used in current demo)
// api_hash = HMAC-SHA1( md5(username + mobile), SSO_API_PUBLIC_KEY )
export function legacyApiHash(username: string, mobile: string, sharedKey: string): string {
  const md5 = createHash('md5').update(`${username}${mobile}`).digest('hex');
  return createHmac('sha1', sharedKey).update(md5).digest('hex');
}
