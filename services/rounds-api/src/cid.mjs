/**
 * The CID for a block of bytes, the same one `ipfs add --cid-version=1
 * --raw-leaves` gives: CIDv1, raw codec, sha2-256, base32. That holds for
 * anything up to kubo's 256 KiB chunk size — above it a file becomes a DAG of
 * several blocks and the root is not a plain hash of the bytes, so this refuses
 * rather than return a CID the network would not resolve.
 */
import { createHash } from "node:crypto";

export const MAX_RAW_BLOCK = 256 * 1024;

const BASE32 = "abcdefghijklmnopqrstuvwxyz234567";

/** RFC 4648 base32, lowercase and unpadded, which is multibase `b`. */
function base32(bytes) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

export function rawCid(bytes) {
  if (bytes.length > MAX_RAW_BLOCK) {
    throw new Error(
      `${bytes.length} bytes is over the ${MAX_RAW_BLOCK} byte block size; ` +
        "add it with kubo and use the CID it returns",
    );
  }
  const digest = createHash("sha256").update(bytes).digest();
  // <version 1><codec raw><sha2-256><length 32><digest>
  const cid = Buffer.concat([Buffer.from([0x01, 0x55, 0x12, 0x20]), digest]);
  return `b${base32(cid)}`;
}
