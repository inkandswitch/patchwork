import { useMemo } from "react";
import { FileDoc } from "./types";

export const VIDEO_EXTENSIONS = ["mp4", "webm", "ogg"];
export const IMAGE_EXTENSIONS = [
  "svg",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
];

export const isImageFile = (doc: FileDoc) => {
  return IMAGE_EXTENSIONS.includes(doc.extension);
};

export const isVideoFile = (doc: FileDoc) => {
  return VIDEO_EXTENSIONS.includes(doc.extension);
};

export const useBinaryUrl = (value: Uint8Array | undefined) => {
  return useMemo(() => {
    if (!(value instanceof Uint8Array)) {
      return;
    }

    return URL.createObjectURL(new Blob([value as BlobPart]));
  }, [value]);
};

/**
 * Efficiently compares two array buffers or typed arrays for equality.
 * Optimized for large buffers (10MB+) by comparing in 64-bit chunks.
 * @param {ArrayBuffer|Uint8Array} buf1 First buffer to compare
 * @param {ArrayBuffer|Uint8Array} buf2 Second buffer to compare
 * @returns {boolean} True if buffers are identical, false otherwise
 */
export function compareBuffers(
  buf1: ArrayBuffer | Uint8Array,
  buf2: ArrayBuffer | Uint8Array
) {
  // Convert ArrayBuffers to Uint8Arrays if needed
  const a1 = buf1 instanceof ArrayBuffer ? new Uint8Array(buf1) : buf1;
  const a2 = buf2 instanceof ArrayBuffer ? new Uint8Array(buf2) : buf2;

  if (a1.byteLength !== a2.byteLength) {
    return false;
  }

  // Use DataView for fast 64-bit comparisons
  const dv1 = new DataView(a1.buffer, a1.byteOffset, a1.byteLength);
  const dv2 = new DataView(a2.buffer, a2.byteOffset, a2.byteLength);

  const len = a1.byteLength;
  const remainder = len % 8;
  const loops = (len - remainder) / 8;

  // Compare 8 bytes at a time using BigInt64
  for (let i = 0; i < loops; i++) {
    if (dv1.getBigInt64(i * 8, true) !== dv2.getBigInt64(i * 8, true)) {
      return false;
    }
  }

  // Compare any remaining bytes individually
  const startByte = len - remainder;
  for (let i = 0; i < remainder; i++) {
    if (a1[startByte + i] !== a2[startByte + i]) {
      return false;
    }
  }

  return true;
}
