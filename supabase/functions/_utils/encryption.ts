const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getKey() {
  const keyStr = Deno.env.get('TWOFA_ENCRYPTION_KEY');
  if (!keyStr) throw new Error('TWOFA_ENCRYPTION_KEY not set');
  // Use SHA-256 to derive a 256-bit key from the string
  return crypto.subtle.digest('SHA-256', encoder.encode(keyStr)).then(hash => crypto.subtle.importKey(
    'raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
  ));
}

export async function encrypt(plainText: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plainText)
  );
  // Return base64(iv) + ':' + base64(ciphertext)
  const ivB64 = btoa(String.fromCharCode(...iv));
  const ctB64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  return `${ivB64}:${ctB64}`;
}

export async function decrypt(cipherText: string): Promise<string> {
  const [ivB64, ctB64] = cipherText.split(':');
  if (!ivB64 || !ctB64) throw new Error('Invalid encrypted format');
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));
  const key = await getKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ct
  );
  return decoder.decode(decrypted);
} 