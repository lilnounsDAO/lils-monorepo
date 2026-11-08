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

## Deploy (VPS, pm2)

```bash
scp -r package.json schema.sql ecosystem.config.cjs src ponder@<vps>:rounds-api/
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
