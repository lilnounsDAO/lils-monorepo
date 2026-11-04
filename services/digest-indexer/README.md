# digest-indexer

Feeds `/digest`. Tails the Lil Nouns Goldsky subgraph (votes, sales, transfers,
delegations, proposals, feedback, candidates, topics) and Goldsky Edge RPC
(mints), normalizes everything into `digest.event` in the VPS Postgres, and
serves a cached feed.

Derived events: voting started, closing soon (~24h before end), result
(passed/defeated via dynamic quorum), queued, executed, canceled, vetoed.
Vote reasons are parsed into revotes (`+1` + quote) and replies (text + quote),
linked to the vote they quote. On read, transfers/delegations/mints from one
account within 30 min are clustered, and delegations a transfer triggers are hidden.
Votes and proposals poll every 30s, everything else every 60s.

## API

`GET /digest?limit=50&filter=proposals|candidates|topics|market|delegates&actor=0x…&q=text&cursor=<nextCursor>`
returns `{ events, nextCursor, head }`. `GET /health` returns 503 when ingestion stalls.

Responses carry `Cache-Control: public, max-age=15, s-maxage=30, stale-while-revalidate=120`
and an in-process cache that invalidates when new rows land.

## Deploy (VPS, pm2)

```bash
scp -r package.json schema.sql ecosystem.config.cjs src ponder@<vps>:digest-indexer/
ssh ponder@<vps> 'cd digest-indexer && npm i --omit=dev && pm2 start ecosystem.config.cjs && pm2 save'
```

`.env` (not committed):

```
DATABASE_URL=postgresql://…/nouns_indexer
RPC_URL=https://edge.goldsky.com/standard/evm/1?secret=…
PORT=3020
POLL_MS=60000
```

Optional: `SUBGRAPH_URL`, `TOKEN_ADDRESS`, `TOKEN_START_BLOCK`, `PROTOCOL_ADDRESSES`,
`CLOSING_SOON_BLOCKS`, `RECENT_PROPOSAL_BLOCKS`.

Schema is applied on boot, and the cursors in `digest.cursor` make restarts resumable.
To rebuild, run `DROP SCHEMA digest CASCADE` and restart. A full backfill takes
about 1 minute for subgraph data and about 10 minutes for mints.

Public route: `https://db.lilnouns.wtf/api/digest`, via nginx with a 15s shared
cache, 5 req/s per IP (burst 20), GET only, and CORS limited to lilnouns.wtf
and Netlify previews. The config lives in `nginx/`. `/health` stays local to the VPS.

The web app uses it when `VITE_DIGEST_API_URL` is set. Otherwise it falls back
to querying the subgraph from the browser.
