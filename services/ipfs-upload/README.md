# ipfs-upload

Image uploads for the proposal editor, pinned on a self-hosted IPFS node (Kubo)
on the VPS. Images dropped or pasted into a proposal stay in the browser
(IndexedDB) while drafting. When the author proposes, updates, saves/shares a
draft or adds a collaborator, the editor uploads them here and rewrites the
markdown to `![](https://db.lilnouns.wtf/ipfs/<cid>)`.

## Who can upload

Every upload is authorized by a wallet signature and logged against that wallet.

1. The browser signs one message per batch:

   ```
   Upload images to IPFS for a Lil Nouns proposal

   Wallet: 0x…
   Chain: 1
   Issued: 2026-11-08T12:00:00.000Z
   Images:
   <sha256 of image 1>
   <sha256 of image 2>
   ```

2. Each file is posted with that message and signature. The service rejects it unless:
   - the signature matches the wallet in the message (EOA, or ERC-1271 smart wallet),
   - `Issued` is within 10 minutes and the chain is enabled (`CHAINS`, mainnet only by default),
   - the file's sha256 is in the signed list, so a captured signature can't be reused for other files,
   - the wallet has at least `MIN_VOTES` Lil Nouns votes (`getCurrentVotes`), or is in `ALLOWED_UPLOADERS`,
   - the wallet is under `MAX_DAILY_UPLOADS` / `MAX_DAILY_BYTES` for the last 24h,
   - the bytes are a real PNG, JPEG, GIF or WebP (magic bytes) under 5 MB.

A replayed request can only re-upload the same image for the same wallet, which
returns the existing CID.

`ipfs.image` has one row per pinned image (sha256, CID, first uploader).
`ipfs.upload` has one row per accepted upload, with the signed message and signature
as proof of who uploaded what.

## API

`POST /upload` (multipart: `file`, `message`, `signature`) → `{ cid, sha256, url }`.
`GET /health` checks Postgres and Kubo.

## Deploy (VPS, pm2)

1. Kubo in Docker (the VPS can't reach GitHub release downloads), API and gateway
   on localhost only, and a gateway that serves only what this node pinned:

   ```bash
   docker run -d --name kubo --restart unless-stopped \
     -e IPFS_PROFILE=server,lowpower -e GOMEMLIMIT=200MiB --memory 320m \
     -p 127.0.0.1:5001:5001 -p 127.0.0.1:8080:8080 \
     -v /var/lib/kubo:/data/ipfs ipfs/kubo:v0.32.1
   docker exec kubo ipfs config --json Gateway.NoFetch true
   docker restart kubo
   ```

   Swarm port 4001 isn't published, so images are served only through
   `https://db.lilnouns.wtf/ipfs/<cid>`. Publish it to let public gateways fetch them too.

2. The service:

   ```bash
   scp -r package.json schema.sql ecosystem.config.cjs src ponder@<vps>:ipfs-upload/
   ssh ponder@<vps> 'cd ipfs-upload && npm i --omit=dev && pm2 start ecosystem.config.cjs && pm2 save'
   ```

   `.env` (not committed), see `.env.example`. It can share the digest indexer's
   `DATABASE_URL` and `RPC_URL`. The schema (`ipfs.*`) is applied on boot.

3. nginx: copy `nginx/ipfs.conf` to `/etc/nginx/conf.d/` and add `nginx/location.conf`
   inside the `db.lilnouns.wtf` server block before `location /api/`. That gives
   `POST /api/ipfs/upload` (rate limited, 6 MB body) and a cached read-only `/ipfs/<cid>` gateway.

The web app posts to `VITE_IPFS_UPLOAD_URL` (set in `netlify.toml`). In dev it
posts to `/api/ipfs/upload`, which Vite proxies to the VPS, or to
`IPFS_UPLOAD_PROXY_TARGET` (for example `http://127.0.0.1:3030/upload` for a local service).
