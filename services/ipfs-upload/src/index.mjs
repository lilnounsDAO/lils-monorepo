#!/usr/bin/env node
/**
 * IPFS image upload for the proposal editor.
 *
 * The browser signs one message listing the sha256 of every image it is about to
 * upload, then posts each file with that message and signature. An upload is
 * accepted only when:
 *   - the signature recovers to the wallet named in the message (EOA or ERC-1271),
 *   - the message is recent and for a chain this service allows,
 *   - the file's sha256 is in the signed list (so the file can't be swapped),
 *   - the wallet has Lil Nouns votes (or is on ALLOWED_UPLOADERS),
 *   - the wallet is under its daily count and byte limits,
 *   - the bytes are a PNG, JPEG, GIF or WebP under MAX_IMAGE_BYTES.
 * Files are pinned on the local Kubo node; every upload is logged against the
 * wallet that signed it in `ipfs.upload`.
 */
import http from "node:http";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";
import { createPublicClient, getAddress, http as httpTransport } from "viem";
import { mainnet, sepolia } from "viem/chains";

const env = process.env;
const PORT = Number(env.PORT || 3030);
const HOST = env.HOST || "127.0.0.1";
const DATABASE_URL = env.DATABASE_URL;
const KUBO_API_URL = (env.KUBO_API_URL || "http://127.0.0.1:5001").replace(/\/$/, "");
const GATEWAY_URL = (env.GATEWAY_URL || "https://db.lilnouns.wtf").replace(/\/$/, "");
const MAX_IMAGE_BYTES = Number(env.MAX_IMAGE_BYTES || 5 * 1024 * 1024);
const MAX_DAILY_UPLOADS = Number(env.MAX_DAILY_UPLOADS || 50);
const MAX_DAILY_BYTES = Number(env.MAX_DAILY_BYTES || 100 * 1024 * 1024);
const MAX_IMAGES_PER_MESSAGE = 20;
const MESSAGE_TTL_MS = Number(env.MESSAGE_TTL_MS || 10 * 60_000);
const MIN_VOTES = BigInt(env.MIN_VOTES || 1);
const ALLOWED_UPLOADERS = new Set(
  (env.ALLOWED_UPLOADERS || "").split(",").map((a) => a.trim().toLowerCase()).filter(Boolean),
);
const ALLOWED_ORIGINS = (env.ALLOWED_ORIGINS ||
  "https://lilnouns.wtf,https://www.lilnouns.wtf,/^https:\\/\\/[a-z0-9-]+\\.lilnouns\\.wtf$/,/^https:\\/\\/[a-z0-9-]+--[a-z0-9-]+\\.netlify\\.app$/,http://localhost:3000,http://localhost:5173")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean)
  .map((item) => (item.startsWith("/") && item.endsWith("/") ? new RegExp(item.slice(1, -1)) : item));

const TOKENS = {
  1: { chain: mainnet, token: env.TOKEN_ADDRESS_1 || "0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B" },
  11155111: { chain: sepolia, token: env.TOKEN_ADDRESS_11155111 || "0x1bCcE5eC2A785E7e9807766c4dbB72aB4a0014Cf" },
};
// Sepolia votes are cheap to get, so testnet uploads are off unless CHAINS opts in.
const CHAINS = new Map(
  (env.CHAINS || "1").split(",").map((id) => Number(id.trim())).filter((id) => TOKENS[id]).map((id) => {
    const rpc = env[`RPC_URL_${id}`] || (id === 1 ? env.RPC_URL : undefined);
    if (!rpc) {
      console.error(`RPC_URL_${id} is required for chain ${id}`);
      process.exit(1);
    }
    const client = createPublicClient({ chain: TOKENS[id].chain, transport: httpTransport(rpc, { timeout: 15_000 }) });
    return [id, { client, token: getAddress(TOKENS[id].token) }];
  }),
);

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const db = new pg.Pool({ connectionString: DATABASE_URL, max: 3 });

const VOTES_ABI = [
  {
    type: "function",
    name: "getCurrentVotes",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint96" }],
  },
];

// ---------------------------------------------------------------------------
// Signed message
//
// Must match uploadMessage() in apps/web/src/utils/localImages.ts.

const MESSAGE_PATTERN =
  /^Upload images to IPFS for a Lil Nouns proposal\n\nWallet: (0x[0-9a-fA-F]{40})\nChain: (\d+)\nIssued: (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\nImages:\n((?:[0-9a-f]{64}\n?)+)$/;

function parseMessage(message) {
  const match = MESSAGE_PATTERN.exec(message);
  if (!match) return null;
  const hashes = match[4].trim().split("\n");
  if (hashes.length > MAX_IMAGES_PER_MESSAGE) return null;
  return {
    wallet: getAddress(match[1]),
    chainId: Number(match[2]),
    issued: Date.parse(match[3]),
    hashes: new Set(hashes),
  };
}

// ---------------------------------------------------------------------------
// Image checks

function sniffImage(bytes) {
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length > 6 && /^GIF8[79]a$/.test(bytes.subarray(0, 6).toString("latin1"))) return "image/gif";
  if (bytes.length > 12 && bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  return null;
}

// ---------------------------------------------------------------------------
// Kubo

async function pin(bytes, mime) {
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mime }), "image");
  const res = await fetch(`${KUBO_API_URL}/api/v0/add?cid-version=1&raw-leaves=true&pin=true&quieter=true`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`kubo add HTTP ${res.status}: ${await res.text()}`);
  const { Hash } = await res.json();
  if (!Hash) throw new Error("kubo add returned no CID");
  return Hash;
}

// ---------------------------------------------------------------------------
// HTTP

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function corsOrigin(origin) {
  if (!origin) return null;
  return ALLOWED_ORIGINS.some((rule) => (typeof rule === "string" ? rule === origin : rule.test(origin))) ? origin : null;
}

function send(req, res, status, body) {
  const origin = corsOrigin(req.headers.origin);
  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    vary: "Origin",
    ...(origin && {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "600",
    }),
  });
  res.end(JSON.stringify(body));
}

async function readBody(req, limit) {
  const declared = Number(req.headers["content-length"] || 0);
  if (declared > limit) throw new HttpError(413, "Image is too large.");
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, "Image is too large.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function clientIp(req) {
  return String(req.headers["x-real-ip"] || req.socket.remoteAddress || "");
}

async function handleUpload(req) {
  const type = req.headers["content-type"] || "";
  if (!type.startsWith("multipart/form-data")) throw new HttpError(415, "Send the image as multipart/form-data.");
  const raw = await readBody(req, MAX_IMAGE_BYTES + 64 * 1024);
  const form = await new Response(raw, { headers: { "content-type": type } }).formData().catch(() => {
    throw new HttpError(400, "Could not read the upload.");
  });
  const file = form.get("file");
  // multipart/form-data turns \n into \r\n in text fields; the wallet signed \n.
  const message = typeof form.get("message") === "string" ? form.get("message").replace(/\r\n/g, "\n") : null;
  const signature = form.get("signature");
  if (!(file instanceof Blob) || typeof message !== "string" || typeof signature !== "string" || !/^0x[0-9a-fA-F]+$/.test(signature)) {
    throw new HttpError(400, "An upload needs file, message and signature.");
  }

  const signed = parseMessage(message);
  if (!signed) throw new HttpError(400, "The signed message is not an upload message.");
  const chain = CHAINS.get(signed.chainId);
  if (!chain) throw new HttpError(403, `Uploads for chain ${signed.chainId} are not enabled.`);
  if (!Number.isFinite(signed.issued) || Math.abs(Date.now() - signed.issued) > MESSAGE_TTL_MS) {
    throw new HttpError(401, "The signature has expired. Try again.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) throw new HttpError(413, "Images must be under 5 MB.");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (!signed.hashes.has(sha256)) throw new HttpError(401, "This image is not in the signed message.");
  const mime = sniffImage(bytes);
  if (!mime) throw new HttpError(415, "Only PNG, JPEG, GIF and WebP images can be uploaded.");

  const valid = await chain.client.verifyMessage({ address: signed.wallet, message, signature }).catch(() => false);
  if (!valid) throw new HttpError(401, "The signature does not match the wallet.");

  const wallet = signed.wallet.toLowerCase();
  if (!ALLOWED_UPLOADERS.has(wallet)) {
    const votes = await chain.client.readContract({
      address: chain.token,
      abi: VOTES_ABI,
      functionName: "getCurrentVotes",
      args: [signed.wallet],
    });
    if (votes < MIN_VOTES) throw new HttpError(403, "Only wallets with Lil Nouns votes can upload images.");
  }

  const { rows: [usage] } = await db.query(
    `SELECT count(*)::int AS uploads, coalesce(sum(i.size), 0)::bigint AS bytes
       FROM ipfs.upload u JOIN ipfs.image i USING (sha256)
      WHERE u.uploader = $1 AND u.created_at > now() - interval '1 day'`,
    [wallet],
  );
  if (usage.uploads >= MAX_DAILY_UPLOADS || Number(usage.bytes) + bytes.length > MAX_DAILY_BYTES) {
    throw new HttpError(429, "Daily image upload limit reached for this wallet.");
  }

  let { rows: [image] } = await db.query(`SELECT cid FROM ipfs.image WHERE sha256 = $1`, [sha256]);
  if (!image) {
    const cid = await pin(bytes, mime);
    ({ rows: [image] } = await db.query(
      `INSERT INTO ipfs.image (sha256, cid, mime, size, first_uploader)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (sha256) DO UPDATE SET sha256 = EXCLUDED.sha256
       RETURNING cid`,
      [sha256, cid, mime, bytes.length, wallet],
    ));
  }
  await db.query(
    `INSERT INTO ipfs.upload (sha256, uploader, chain_id, message, signature, ip) VALUES ($1, $2, $3, $4, $5, $6)`,
    [sha256, wallet, signed.chainId, message, signature, clientIp(req)],
  );

  console.log(`upload ${image.cid} sha256=${sha256} by ${wallet} (${bytes.length} bytes)`);
  return { cid: image.cid, sha256, url: `${GATEWAY_URL}/ipfs/${image.cid}` };
}

const server = http.createServer(async (req, res) => {
  const path = new URL(req.url || "/", "http://local").pathname;
  try {
    if (req.method === "OPTIONS") {
      send(req, res, 204, {});
      return;
    }
    if (path === "/health" && req.method === "GET") {
      await db.query("SELECT 1");
      const kubo = await fetch(`${KUBO_API_URL}/api/v0/id`, { method: "POST", signal: AbortSignal.timeout(5_000) });
      send(req, res, kubo.ok ? 200 : 503, { ok: kubo.ok });
      return;
    }
    if (path === "/upload" && req.method === "POST") {
      send(req, res, 200, await handleUpload(req));
      return;
    }
    send(req, res, 404, { error: "Not found" });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    if (status === 500) console.error("upload failed:", error);
    send(req, res, status, { error: status === 500 ? "Upload failed. Try again." : error.message });
  }
});

await db.query(readFileSync(new URL("../schema.sql", import.meta.url), "utf8"));
server.listen(PORT, HOST, () => {
  console.log(`ipfs-upload listening on ${HOST}:${PORT} (chains ${[...CHAINS.keys()].join(",")})`);
});

