export type BinaryLike = ArrayBuffer | ArrayBufferView; // works for Buffer, Uint8Array, etc.

export function byteLength(data: BinaryLike): number {
  if (data instanceof ArrayBuffer) {
    return data.byteLength;
  }
  return data.byteLength; // ArrayBufferView (includes Buffer)
}

export function asUint8Array(data: BinaryLike): Uint8Array {
  if (data instanceof Uint8Array) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

/**
 * Cross-platform copy, mirroring Buffer.copy's signature.
 * Returns the number of bytes copied.
 */
export function bufferCopy(
  src: BinaryLike,
  dst: BinaryLike,
  targetStart = 0,
  sourceStart = 0,
  sourceEnd?: number,
): number {
  const s = asUint8Array(src);
  const d = asUint8Array(dst);

  const sLen = s.length;
  const ss = Math.max(0, Math.min(sourceStart, sLen));
  const se = sourceEnd === undefined ? sLen : Math.max(ss, Math.min(sourceEnd, sLen));
  const ts = Math.max(0, Math.min(targetStart, d.length));

  const toCopy = Math.min(se - ss, d.length - ts);
  if (toCopy <= 0) {
    return 0;
  }

  // Handles overlap correctly per TypedArray.set semantics
  d.set(s.subarray(ss, ss + toCopy), ts);
  return toCopy;
}

/** Cross-platform test for Buffer, ArrayBuffer, or typed array */
export function isBufferLike(x: unknown): x is BinaryLike {
  return (
    x instanceof ArrayBuffer || ArrayBuffer.isView(x) // true for all TypedArrays and Node Buffers
  );
}
