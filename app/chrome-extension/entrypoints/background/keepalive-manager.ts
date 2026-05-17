/**
 * Hardened minimal keepalive shim.
 *
 * The old implementation kept the MV3 service worker alive via an offscreen
 * record/replay document. The minimal Hermes bridge does not need that extra
 * document or permission; native messaging ports keep the worker alive while
 * connected.
 */
export function acquireKeepalive(_tag: string): () => void {
  return () => {};
}

export function isKeepaliveActive(): boolean {
  return false;
}

export function getKeepaliveRefCount(): number {
  return 0;
}
