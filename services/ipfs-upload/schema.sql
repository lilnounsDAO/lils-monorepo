CREATE SCHEMA IF NOT EXISTS ipfs;

-- One row per distinct image pinned on the node.
CREATE TABLE IF NOT EXISTS ipfs.image (
  sha256         text PRIMARY KEY,
  cid            text NOT NULL,
  mime           text NOT NULL,
  size           integer NOT NULL,
  first_uploader text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Every accepted upload, with the signed message that authorized it.
CREATE TABLE IF NOT EXISTS ipfs.upload (
  id         bigserial PRIMARY KEY,
  sha256     text NOT NULL REFERENCES ipfs.image (sha256),
  uploader   text NOT NULL,
  chain_id   integer NOT NULL,
  message    text NOT NULL,
  signature  text NOT NULL,
  ip         text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS upload_uploader_created ON ipfs.upload (uploader, created_at);
CREATE INDEX IF NOT EXISTS image_cid ON ipfs.image (cid);
