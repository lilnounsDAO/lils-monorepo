# rounds-api

Funded rounds for Lil Nouns. Anyone can propose, Lil Nouns holders vote with
their delegated votes, and the round settles itself when voting closes. Feeds
`/rounds` in the web app, and holds the imported history of every Lil Nouns
round that ran on Prop House and nouns.gg.

## How a round runs

A round has three timestamps and runs itself from them:

| | |
| --- | --- |
| `start_at` → `voting_start_at` | **Proposing.** Anyone the round's propose strategy allows can add a proposal and edit their own. |
| `voting_start_at` → `end_at` | **Voting.** Voting power is pinned to the block voting opened at, so a Lil Noun bought mid-round carries no weight. |
| after `end_at` | **Ended.** Awards are assigned to the leading proposals, highest votes first, earliest proposal breaking a tie. |

The ticker (`TICK_MS`, 30s) does the state changes that have side effects:
pinning the snapshot block and settling. Reads derive the state from the clock
instead of trusting the column, so a stalled ticker can never show a closed
round as open.

## Signatures

Every write is an EIP-712 signature from the wallet doing it. There are no
accounts, sessions or API keys. The typed data is defined once in
[`src/eip712.mjs`](src/eip712.mjs) and mirrored in
`apps/web/src/data/rounds/eip712.ts`; the domain is
`{ name: "Lil Nouns Rounds", version: "1", chainId }`.

| Type | Signed by | Covers |
| --- | --- | --- |
| `Round` | the round's creator | handle, name, description, a hash of the body, a hash of the awards, the three timestamps |
| `Proposal` | the author | round handle, title, tldr, a hash of the body |
| `Vote` | the voter | round handle and the whole ballot as `proposalId:votes` pairs, sorted by id |

Long text is committed to by its keccak hash rather than inlined, so the wallet
prompt stays readable while the exact bytes are still pinned: changing a single
character of a proposal body after signing fails the check.

A write is stored only when all of this holds:

- the signature recovers to the signer in the payload — locally for an ordinary
  wallet, through ERC-1271 for a contract wallet, so the RPC is not on the path
  for the common case;
- `issued` is within `SIGNATURE_TTL_MS` (10 minutes) and the `nonce` has not
  been used before (`rounds.nonce`, kept for a day);
- the round is in the state the write needs;
- the signer's strategy allows it: `canPropose` for a proposal, enough unspent
  voting power for a ballot. One ballot per wallet per round is admitted at a
  time, under an advisory lock, so two tabs cannot spend the same votes twice.

## Strategies

Both strategies are stored on the round as JSONB when it is created, so its
rules never change under it.

**Proposing** — `{"type":"open"}` (default), `{"type":"lil-nouns-votes","min":"1"}`,
`{"type":"allowlist","entries":{"0x…":"1"}}`.

**Voting** — `{"type":"lil-nouns-votes","multiplier":1}` (default: one vote per
delegated Lil Noun at the snapshot block), `{"type":"fixed","votes":"1","min":"0"}`
(a flat number per wallet, optionally gated on holding Lil Nouns),
`{"type":"allowlist","entries":{"0x…":"5"}}`.

Imported rounds carry `{"type":"archive"}`, which gives nobody the right to
propose or vote: they are read-only history.

## API

Reads (cached 20s at nginx, `Cache-Control: max-age=10`):

```
GET /rounds?state=open|pending|proposing|voting|ended&house=&q=&limit=&cursor=
GET /rounds/:handle                    round, awards and proposals
GET /rounds/:handle/proposals
GET /rounds/:handle/activity?limit=    proposals, votes and lifecycle moments, newest first
GET /rounds/:handle/power/:address     voting power, votes used and what the wallet may do
GET /proposals/:id
GET /house                             the house and its totals
GET /health                            503 when the database is unreachable
```

Writes (never cached, each needs `signer`, `signature`, `issued`, `nonce`):

```
POST /rounds                           open a round
POST /rounds/:handle/proposals         propose
PUT  /proposals/:id                    edit your own proposal while proposing is open
POST /rounds/:handle/votes             cast a ballot
```

Opening a round needs a wallet with `MIN_CREATE_VOTES` Lil Nouns votes or a
place in `HOUSE_ADMINS`.

## Importing the history

```bash
node src/import.mjs              # both sources
node src/import.mjs nouns-gg
node src/import.mjs prop-house
node src/import.mjs --dry-run
```

Re-running is safe: rows are keyed on `(source, source_id)`, so a second run
updates what changed upstream and adds what is new. A handle already held by a
round opened here is never overwritten. Imported rounds arrive settled, with the
URL they came from, and their winners come from the source where it names them
and from vote order where it does not — which is how both platforms ranked.

**nouns.gg** publishes a JSON export of its rounds, proposals, votes, awards and
profiles in its repository, so every Lil Nouns round it has hosted imports in
full: 8 rounds, 160 proposals and about 1,600 votes. Most nouns.gg profiles have
no wallet attached, so those rows keep a display name and a `nouns.gg:<id>` key
rather than an invented address. Proposal and round bodies are Lexical editor
state and are converted to markdown on the way in. nouns.gg is AGPL-3.0; only
its published data is read here, none of its code.

**Prop House is gone.** `prop.house`, `prod.backend.prop.house`, the IPFS
gateway and the Supabase project behind them no longer resolve, and the hosted
subgraph is retired, so there is no live source for the ten Lil Nouns rounds of
2022 (community 2, 100 ETH over 315 proposals). What survives is in the Internet
Archive, which caught the rounds list for the community — all ten rounds with
their dates, prizes and winner counts — and the proposals of rounds 9 and 10
only. So those two rounds import with their proposals and votes (32 proposals,
93 votes), and the other eight import as round metadata with a note on the page
saying how many proposals existed and why they are not here. Nothing more is
recoverable; if a database dump ever turns up, point `PH_COMMUNITY_URL` and
`PH_PROPOSAL_SNAPSHOTS` at it and re-run.

**Images.** Both platforms served their images from their own IPFS gateways,
which went down with them. The CIDs are still on the network, but no public
gateway is dependable enough to point the pages at: `ipfs.io` and `dweb.link`
rate limit, and Pinata's sends a `Cross-Origin-Resource-Policy` that stops a
browser embedding the image at all.

So we serve them. The importer rewrites every IPFS URL to `PUBLIC_URL/images/<cid>`,
and `GET /images/:cid` fetches that CID once from `IMAGE_GATEWAYS`, keeps the
bytes in `rounds.image`, and serves them from then on with
`Cache-Control: immutable` — content-addressed, so it never goes stale. A CID
nobody still hosts returns 404 and the page falls back to its placeholder.

After writing the rounds the importer asks the service for each image, which is
what fills the cache, so the first visitor is not the one waiting on a gateway.
It goes two at a time because the public gateways refuse a burst; whatever they
refuse stays cold, is fetched the next time someone opens that round, and is
picked up by the next import.

Two settings change this. `IPFS_GATEWAY` makes the importer write gateway URLs
directly instead, skipping the cache. `IPFS_API` additionally pins every CID to
a kubo node, which keeps our own copy on the network rather than only in this
service:

```bash
IPFS_API=http://127.0.0.1:5001 node src/import.mjs
```

Pinning fetches each image first, so it takes a few minutes and reports any CID
nobody still hosts. Avatars on hosts that are gone outright (cloudnouns'
generator answers 522) are dropped at import instead, so the ENS avatar and
placeholder take over. The web app renders all of these through `RoundImage`,
which removes an image whose load fails rather than leaving a broken-image icon
on the page.

**Artwork we supply.** Some rounds reach us with no usable picture: Prop House
never stored one, and a nouns.gg round only has artwork when it was run for an
event. `assets/` fills those gaps and goes through the same door as everything
else — each file is stored under its own CID and served from `/images/<cid>`,
so a round points at content rather than at a file in the web app, and
`IPFS_API` pins them onto our node with the rest.

```
assets/rounds/<handle>.<ext>    that round's picture, whatever it arrived with
assets/sources/<source>.<ext>   stands in for any round of that source with none
```

CIDs are computed the way `ipfs add --cid-version=1 --raw-leaves` computes them,
so a file here and the same file on a kubo node are the same CID. That only
holds below kubo's 256 KiB chunk size; a larger file is refused rather than
given an address the network would not resolve.

A round opened here uploads its image through
[ipfs-upload](../ipfs-upload) from the browser, wallet-signed, exactly as the
proposal editor uploads images — so every round image, imported or not, is
content-addressed.

## Deploy (VPS, pm2)

```bash
scp -r package.json schema.sql ecosystem.config.cjs src assets ponder@<vps>:rounds-api/
ssh ponder@<vps> 'cd rounds-api && npm i --omit=dev && pm2 start ecosystem.config.cjs && pm2 save'
ssh ponder@<vps> 'cd rounds-api && node --env-file=.env src/import.mjs'
```

`.env` (not committed) — see [`.env.example`](.env.example):

```
DATABASE_URL=postgresql://…/nouns_indexer
RPC_URL=https://edge.goldsky.com/standard/evm/1?secret=…
PORT=3040
HOUSE_TREASURY=0x…
HOUSE_ADMINS=0x…,0x…
```

The schema is applied on boot and by the importer, both idempotent. To rebuild,
run `DROP SCHEMA rounds CASCADE`, restart, and import again.

Public route: `https://db.lilnouns.wtf/api/funding`, via nginx with a 20s shared
cache on reads, 5 req/s per IP for reads and 1 req/s for writes, and CORS limited
to lilnouns.wtf and Netlify previews. The config lives in [`nginx/`](nginx).
`/health` stays local to the VPS.

The web app uses it when `VITE_ROUNDS_API_URL` is set; without it the rounds
pages say so rather than showing an empty list.
