-- Digest feed storage. Applied automatically on startup (idempotent).
CREATE SCHEMA IF NOT EXISTS digest;

CREATE TABLE IF NOT EXISTS digest.event (
  id          TEXT PRIMARY KEY,
  kind        TEXT NOT NULL,
  ts          BIGINT NOT NULL,
  -- `${nounId}-${ts}` for sale/mint/transfer rows, so a settlement hides the
  -- mint/transfer that happened in the same transaction.
  dedupe_key  TEXT,
  actor       TEXT,
  proposal_id TEXT,
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_ts_idx ON digest.event (ts DESC, id DESC);
CREATE INDEX IF NOT EXISTS event_kind_ts_idx ON digest.event (kind, ts DESC);
CREATE INDEX IF NOT EXISTS event_actor_idx ON digest.event (actor);
CREATE INDEX IF NOT EXISTS event_dedupe_idx ON digest.event (dedupe_key) WHERE dedupe_key IS NOT NULL;

-- One row per subgraph entity stream: the last timestamp fully ingested.
CREATE TABLE IF NOT EXISTS digest.cursor (
  stream     TEXT PRIMARY KEY,
  ts         BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS digest.head (
  id         INT PRIMARY KEY DEFAULT 1,
  block      BIGINT NOT NULL,
  ts         BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
