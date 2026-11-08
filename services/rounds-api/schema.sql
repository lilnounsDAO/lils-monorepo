-- Funded rounds storage. Applied automatically on startup (idempotent).
CREATE SCHEMA IF NOT EXISTS rounds;

-- A house owns rounds and pays them out. Lil Nouns is seeded on boot.
CREATE TABLE IF NOT EXISTS rounds.house (
  handle      TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  image       TEXT,
  -- Where the funding comes from, shown on the round page.
  treasury    TEXT,
  -- Lowercase addresses that may open and edit rounds regardless of votes.
  admins      TEXT[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rounds.round (
  id              BIGSERIAL PRIMARY KEY,
  handle          TEXT NOT NULL UNIQUE,
  house           TEXT NOT NULL REFERENCES rounds.house (handle),
  name            TEXT NOT NULL,
  description     TEXT,
  -- Markdown, same flavour the proposal editor writes.
  content         TEXT,
  image           TEXT,
  -- A lowercase address for rounds opened here. Imported rounds whose creator
  -- had no wallet on the old platform carry `<source>:<id>` and a display name.
  creator         TEXT NOT NULL,
  creator_name    TEXT,
  creator_image   TEXT,

  -- Lifecycle. The ticker moves `state` from these three timestamps, so a round
  -- opens, closes proposing and settles without anyone pressing a button.
  start_at        TIMESTAMPTZ NOT NULL,
  voting_start_at TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ NOT NULL,
  state           TEXT NOT NULL DEFAULT 'pending',
  -- Mainnet block whose checkpoints decide voting power, pinned when voting opens.
  snapshot_block  BIGINT,
  settled_at      TIMESTAMPTZ,

  propose_strategy JSONB NOT NULL,
  vote_strategy    JSONB NOT NULL,

  -- Provenance: 'lilnouns' for rounds opened here, 'prop-house' / 'nouns.gg'
  -- for imported history.
  source      TEXT NOT NULL DEFAULT 'lilnouns',
  source_id   TEXT,
  source_url  TEXT,
  signed_data JSONB,

  visible    BOOLEAN NOT NULL DEFAULT true,
  featured   BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, source_id)
);

CREATE INDEX IF NOT EXISTS round_state_idx ON rounds.round (state, end_at DESC);
CREATE INDEX IF NOT EXISTS round_house_idx ON rounds.round (house, end_at DESC);

CREATE TABLE IF NOT EXISTS rounds.proposal (
  id          BIGSERIAL PRIMARY KEY,
  round_id    BIGINT NOT NULL REFERENCES rounds.round (id) ON DELETE CASCADE,
  author      TEXT NOT NULL,
  author_name TEXT,
  author_image TEXT,
  title       TEXT NOT NULL,
  tldr        TEXT,
  content     TEXT NOT NULL,
  signed_data JSONB,
  -- Running total of `vote.weight`, kept in step inside the vote transaction.
  vote_count  NUMERIC(78, 0) NOT NULL DEFAULT 0,
  visible     BOOLEAN NOT NULL DEFAULT true,
  source      TEXT NOT NULL DEFAULT 'lilnouns',
  source_id   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, source_id)
);

CREATE INDEX IF NOT EXISTS proposal_round_idx ON rounds.proposal (round_id, vote_count DESC, created_at);
CREATE INDEX IF NOT EXISTS proposal_author_idx ON rounds.proposal (author);

-- One row per prize. `value` is in the asset's base units.
CREATE TABLE IF NOT EXISTS rounds.award (
  id                 BIGSERIAL PRIMARY KEY,
  round_id           BIGINT NOT NULL REFERENCES rounds.round (id) ON DELETE CASCADE,
  place              INT NOT NULL,
  asset              JSONB NOT NULL,
  value              NUMERIC(78, 0) NOT NULL,
  winner_proposal_id BIGINT REFERENCES rounds.proposal (id) ON DELETE SET NULL,
  payout_tx          TEXT,
  UNIQUE (round_id, place)
);

-- Append-only: one row per cast, so the activity feed and the signature behind
-- every vote survive. A voter may spread their power over several proposals.
CREATE TABLE IF NOT EXISTS rounds.vote (
  id          BIGSERIAL PRIMARY KEY,
  round_id    BIGINT NOT NULL REFERENCES rounds.round (id) ON DELETE CASCADE,
  proposal_id BIGINT NOT NULL REFERENCES rounds.proposal (id) ON DELETE CASCADE,
  voter       TEXT NOT NULL,
  voter_name  TEXT,
  voter_image TEXT,
  weight      NUMERIC(78, 0) NOT NULL CHECK (weight > 0),
  signed_data JSONB,
  source      TEXT NOT NULL DEFAULT 'lilnouns',
  source_id   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, source_id)
);

CREATE INDEX IF NOT EXISTS vote_round_idx ON rounds.vote (round_id, created_at DESC);
CREATE INDEX IF NOT EXISTS vote_voter_idx ON rounds.vote (round_id, voter);
CREATE INDEX IF NOT EXISTS vote_proposal_idx ON rounds.vote (proposal_id);

-- Every accepted signature burns its nonce, so a captured payload can't be replayed.
CREATE TABLE IF NOT EXISTS rounds.nonce (
  nonce      TEXT PRIMARY KEY,
  signer     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nonce_created_idx ON rounds.nonce (created_at);

-- Voting power is read once per (round, voter) and cached, so a reload or a
-- second cast doesn't hit the RPC again.
CREATE TABLE IF NOT EXISTS rounds.voting_power (
  round_id   BIGINT NOT NULL REFERENCES rounds.round (id) ON DELETE CASCADE,
  voter      TEXT NOT NULL,
  power      NUMERIC(78, 0) NOT NULL,
  block      BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (round_id, voter)
);

-- Imported images. The gateways both platforms served them from are gone and
-- the public ones rate limit or refuse to be embedded cross-origin, so the
-- first request for a CID fetches it once and this table keeps the bytes: the
-- archive stops depending on anyone else's gateway staying up.
CREATE TABLE IF NOT EXISTS rounds.image (
  cid        TEXT PRIMARY KEY,
  mime       TEXT NOT NULL,
  bytes      BYTEA NOT NULL,
  size       INTEGER NOT NULL,
  source     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
