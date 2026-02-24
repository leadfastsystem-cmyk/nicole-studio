export function generateId(): string {
  // Use crypto.randomUUID when available (browser or Node 19+)
  const cryptoObj = (globalThis as any).crypto;

  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }

  // Fallback: pseudo-random ID (suficiente para IDs de mensaje en UI)
  // Forma: timestamp-base36 + random-base36
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);

  return `${timestamp}-${random}`;
}

