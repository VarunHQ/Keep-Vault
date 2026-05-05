export function utf8ToBytes(str: string): Uint8Array {
  // Hermes may not provide TextEncoder in all environments.
  const g = globalThis as any;
  if (typeof g.TextEncoder === 'function') {
    return new g.TextEncoder().encode(str);
  }
  const utf8 = unescape(encodeURIComponent(str));
  const out = new Uint8Array(utf8.length);
  for (let i = 0; i < utf8.length; i++) out[i] = utf8.charCodeAt(i);
  return out;
}

export function bytesToUtf8(bytes: Uint8Array): string {
  const g = globalThis as any;
  if (typeof g.TextDecoder === 'function') {
    return new g.TextDecoder().decode(bytes);
  }
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return decodeURIComponent(escape(s));
}

