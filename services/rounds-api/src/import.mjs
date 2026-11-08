#!/usr/bin/env node
/**
 * Imports the Lil Nouns rounds that ran before this service existed, so the
 * round history is in one place.
 *
 *   node src/import.mjs              both sources
 *   node src/import.mjs nouns-gg     only the nouns.gg rounds
 *   node src/import.mjs prop-house   only the Prop House rounds
 *   node src/import.mjs --dry-run    read and report, write nothing
 *
 * Sources
 *
 * nouns.gg publishes a JSON export of its rounds, proposals, votes, awards and
 * profiles in its repository, which covers every Lil Nouns round it has hosted.
 *
 * Prop House is gone: prop.house, prod.backend.prop.house and the Supabase
 * project behind them no longer resolve, and the hosted subgraph is retired, so
 * there is no live source for the ten Lil Nouns rounds of 2022. What survives
 * is in the Internet Archive, which snapshotted the rounds list for the Lil
 * Nouns community (all ten rounds, with their dates, prizes and winner counts)
 * and the proposals of rounds 9 and 10. The other eight rounds import with
 * their metadata and no proposals; nothing more is recoverable.
 *
 * Imported rounds are marked `source = 'nouns.gg' | 'prop-house'`, carry the
 * URL they came from, and are settled on arrival with an `archive` strategy, so
 * nobody can propose or vote on them here.
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const env = process.env;
const DATABASE_URL = env.DATABASE_URL;
const HOUSE_HANDLE = env.HOUSE_HANDLE || "lilnouns";
const DRY_RUN = process.argv.includes("--dry-run");
const SOURCES = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));
const WANTED = (name) => SOURCES.length === 0 || SOURCES.includes(name);

const NGG_REPO = env.NGG_REPO || "nouns-esports/nouns-gg";
const NGG_REF = env.NGG_REF || "master";
const NGG_DATA = `https://raw.githubusercontent.com/${NGG_REPO}/${NGG_REF}/data/public/v1`;
const NGG_TREE = `https://api.github.com/repos/${NGG_REPO}/git/trees/${NGG_REF}?recursive=1`;
// A Lil Nouns round that ran under another community's handle on nouns.gg.
const NGG_EXTRA_ROUNDS = (env.NGG_EXTRA_ROUNDS || "chompix/lilnouns-loud-posters")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const PH_COMMUNITY_URL =
  env.PH_COMMUNITY_URL ||
  "https://web.archive.org/web/20221018235231if_/https://prod.backend.prop.house/auctions/forCommunity/2";
// The only Lil Nouns rounds whose proposals the archive caught, as `id:timestamp`.
const PH_PROPOSAL_SNAPSHOTS = (env.PH_PROPOSAL_SNAPSHOTS || "60:20221018235308,70:20221018235258")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean)
  .map((item) => {
    const [id, timestamp] = item.split(":");
    return { id: Number(id), timestamp };
  });

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const db = new pg.Pool({ connectionString: DATABASE_URL, max: 3 });

async function getJson(url, { optional = false } = {}) {
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "lilnouns-rounds-importer",
      ...(env.GITHUB_TOKEN && url.startsWith("https://api.github.com")
        ? { authorization: `Bearer ${env.GITHUB_TOKEN}` }
        : {}),
    },
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    if (optional) return null;
    throw new Error(`GET ${url} -> HTTP ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Rich text
//
// Both sources store proposal bodies in their own editor's format. The proposal
// editor here reads markdown, so each is converted once on the way in.

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKE = 4;
const FORMAT_CODE = 16;

/** Lexical editor state (nouns.gg) to markdown. */
function lexicalToMarkdown(raw) {
  let state;
  try {
    state = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return typeof raw === "string" ? raw : "";
  }
  const root = state?.root ?? state;
  const blocks = [];

  const inline = (nodes = [], { plain = false } = {}) =>
    nodes
      .map((node) => {
        switch (node.type) {
          case "text": {
            let text = node.text ?? "";
            if (!text) return "";
            const format = Number(node.format ?? 0);
            if (plain) return text;
            if (format & FORMAT_CODE) return `\`${text}\``;
            if (format & FORMAT_STRIKE) text = `~~${text}~~`;
            if (format & FORMAT_ITALIC) text = `_${text}_`;
            if (format & FORMAT_BOLD) text = `**${text}**`;
            return text;
          }
          case "linebreak":
            return "\n";
          case "tab":
            return "  ";
          case "link":
          case "autolink": {
            const label = inline(node.children, { plain }) || node.url || "";
            return node.url ? `[${label}](${node.url})` : label;
          }
          case "image":
            return node.src ? `![${node.altText ?? ""}](${node.src})` : "";
          default:
            return inline(node.children, { plain });
        }
      })
      .join("");

  const block = (node, depth = 0) => {
    switch (node.type) {
      case "heading": {
        const level = Math.min(Number(String(node.tag ?? "h2").slice(1)) || 2, 6);
        blocks.push(`${"#".repeat(level)} ${inline(node.children, { plain: true })}`);
        break;
      }
      case "quote":
        blocks.push(
          inline(node.children)
            .split("\n")
            .map((line) => `> ${line}`)
            .join("\n"),
        );
        break;
      case "list": {
        const ordered = node.listType === "number";
        const items = (node.children ?? []).map((item, index) => {
          const marker = ordered ? `${index + 1}.` : "-";
          const nested = (item.children ?? []).filter((child) => child.type === "list");
          const text = inline((item.children ?? []).filter((child) => child.type !== "list"));
          const lines = [`${"  ".repeat(depth)}${marker} ${text}`];
          for (const child of nested) {
            const before = blocks.length;
            block(child, depth + 1);
            lines.push(...blocks.splice(before));
          }
          return lines.join("\n");
        });
        blocks.push(items.join("\n"));
        break;
      }
      case "image":
        if (node.src) blocks.push(`![${node.altText ?? ""}](${node.src})`);
        break;
      case "paragraph":
      default: {
        if (node.children?.some((child) => ["list", "heading", "quote"].includes(child.type))) {
          for (const child of node.children) block(child, depth);
          break;
        }
        const text = inline(node.children);
        if (text.trim()) blocks.push(text);
      }
    }
  };

  for (const node of root?.children ?? []) block(node);
  return blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

const ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " ", ndash: "-",
  mdash: "—", hellip: "…", rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"',
};

function decodeEntities(text) {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z#0-9]+);/g, (match, name) => {
    if (name.startsWith("#x") || name.startsWith("#X")) {
      return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
    }
    if (name.startsWith("#")) return String.fromCodePoint(Number(name.slice(1)));
    return ENTITIES[name] ?? match;
  });
}

/** The HTML Prop House's editor produced, to markdown. */
function htmlToMarkdown(html) {
  if (typeof html !== "string") return "";
  let text = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|blockquote|tr)>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<h1[^>]*>/gi, "\n\n# ")
    .replace(/<h2[^>]*>/gi, "\n\n## ")
    .replace(/<h3[^>]*>/gi, "\n\n### ")
    .replace(/<h[4-6][^>]*>/gi, "\n\n#### ")
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "_$2_")
    .replace(/<img[^>]*?src=["']([^"']+)["'][^>]*>/gi, "\n\n![]($1)\n\n")
    .replace(/<a[^>]*?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(text)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function firstSentence(markdown, limit = 240) {
  const plain = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= limit) return plain;
  return `${plain.slice(0, limit).replace(/\s\S*$/, "")}…`;
}

function slugify(text, fallback) {
  const slug = String(text ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 61);
  return slug.length >= 2 ? slug : fallback;
}

// ---------------------------------------------------------------------------
// Writing

const stats = {
  rounds: 0, roundsSkipped: 0, awards: 0, proposals: 0, votes: 0, winners: 0,
};

/**
 * One round, its awards, proposals and votes, in a transaction. Re-running is
 * safe: rows are keyed on (source, source_id), so a second import updates what
 * changed upstream and adds what is new.
 */
async function writeRound({ round, awards, proposals, votes }) {
  if (DRY_RUN) {
    stats.rounds += 1;
    stats.awards += awards.length;
    stats.proposals += proposals.length;
    stats.votes += votes.length;
    console.log(
      `would import ${round.source}/${round.handle}: ${proposals.length} proposals, ` +
        `${votes.length} votes, ${awards.length} awards`,
    );
    return;
  }

  const connection = await db.connect();
  try {
    await connection.query("BEGIN");
    const { rows: [existing] } = await connection.query(
      `SELECT id, handle, source FROM rounds.round WHERE handle = $1`,
      [round.handle],
    );
    if (existing && existing.source !== round.source) {
      // A round opened here owns the handle; never overwrite it.
      await connection.query("ROLLBACK");
      console.warn(`skipped ${round.source}/${round.handle}: that handle is taken by a native round`);
      stats.roundsSkipped += 1;
      return;
    }

    const { rows: [saved] } = await connection.query(
      `INSERT INTO rounds.round
         (handle, house, name, description, content, image, creator, creator_name, creator_image,
          start_at, voting_start_at, end_at, state, settled_at, propose_strategy, vote_strategy,
          source, source_id, source_url, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ended', now(), $13, $13, $14, $15, $16, false)
       ON CONFLICT (source, source_id) DO UPDATE
         SET name = EXCLUDED.name, description = EXCLUDED.description, content = EXCLUDED.content,
             image = EXCLUDED.image, start_at = EXCLUDED.start_at,
             voting_start_at = EXCLUDED.voting_start_at, end_at = EXCLUDED.end_at,
             source_url = EXCLUDED.source_url, updated_at = now()
       RETURNING id`,
      [
        round.handle,
        HOUSE_HANDLE,
        round.name,
        round.description,
        round.content,
        round.image,
        round.creator,
        round.creatorName,
        round.creatorImage,
        round.startAt,
        round.votingStartAt,
        round.endAt,
        { type: "archive", platform: round.platform },
        round.source,
        round.sourceId,
        round.sourceUrl,
      ],
    );
    stats.rounds += 1;

    const proposalIds = new Map();
    for (const proposal of proposals) {
      const { rows: [row] } = await connection.query(
        `INSERT INTO rounds.proposal
           (round_id, author, author_name, author_image, title, tldr, content, vote_count, source, source_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10)
         ON CONFLICT (source, source_id) DO UPDATE
           SET title = EXCLUDED.title, tldr = EXCLUDED.tldr, content = EXCLUDED.content,
               author_name = EXCLUDED.author_name, author_image = EXCLUDED.author_image,
               updated_at = now()
         RETURNING id`,
        [
          saved.id,
          proposal.author,
          proposal.authorName,
          proposal.authorImage,
          proposal.title,
          proposal.tldr,
          proposal.content,
          round.source,
          proposal.sourceId,
          proposal.createdAt,
        ],
      );
      proposalIds.set(proposal.sourceId, Number(row.id));
      stats.proposals += 1;
    }

    for (const vote of votes) {
      const proposalId = proposalIds.get(vote.proposalSourceId);
      if (!proposalId || !(BigInt(vote.weight) > 0n)) continue;
      const { rowCount } = await connection.query(
        `INSERT INTO rounds.vote
           (round_id, proposal_id, voter, voter_name, voter_image, weight, source, source_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (source, source_id) DO NOTHING`,
        [
          saved.id,
          proposalId,
          vote.voter,
          vote.voterName,
          vote.voterImage,
          String(vote.weight),
          round.source,
          vote.sourceId,
          vote.createdAt,
        ],
      );
      if (rowCount > 0) stats.votes += 1;
    }

    // Rebuild the cached totals from the votes that are actually stored.
    await connection.query(
      `UPDATE rounds.proposal p
          SET vote_count = coalesce(
                (SELECT sum(v.weight) FROM rounds.vote v WHERE v.proposal_id = p.id), 0)
        WHERE p.round_id = $1`,
      [saved.id],
    );

    for (const award of awards) {
      // The source tells us who won, so the ranking is theirs, not ours.
      const winner = award.winnerSourceId ? proposalIds.get(award.winnerSourceId) ?? null : null;
      if (winner) stats.winners += 1;
      await connection.query(
        `INSERT INTO rounds.award (round_id, place, asset, value, winner_proposal_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (round_id, place) DO UPDATE
           SET asset = EXCLUDED.asset, value = EXCLUDED.value,
               winner_proposal_id = coalesce(EXCLUDED.winner_proposal_id, rounds.award.winner_proposal_id)`,
        [saved.id, award.place, award.asset, String(award.value), winner],
      );
      stats.awards += 1;
    }

    // Both platforms awarded in vote order, so any award the source did not name
    // a winner for goes to the next-highest proposal that has not won already.
    const { rowCount: filled } = await connection.query(
      `WITH taken AS (
         SELECT winner_proposal_id AS id FROM rounds.award
          WHERE round_id = $1 AND winner_proposal_id IS NOT NULL
       ), ranked AS (
         SELECT p.id, row_number() OVER (ORDER BY p.vote_count DESC, p.created_at) AS rn
           FROM rounds.proposal p
          WHERE p.round_id = $1 AND p.visible AND p.vote_count > 0
            AND p.id NOT IN (SELECT id FROM taken)
       ), vacant AS (
         SELECT id, row_number() OVER (ORDER BY place) AS rn
           FROM rounds.award WHERE round_id = $1 AND winner_proposal_id IS NULL
       )
       UPDATE rounds.award a
          SET winner_proposal_id = ranked.id
         FROM vacant JOIN ranked USING (rn)
        WHERE a.id = vacant.id`,
      [saved.id],
    );
    stats.winners += filled;

    await connection.query("COMMIT");
    console.log(
      `imported ${round.source}/${round.handle}: ${proposals.length} proposals, ` +
        `${votes.length} votes, ${awards.length} awards`,
    );
  } catch (error) {
    await connection.query("ROLLBACK").catch(() => {});
    console.error(`could not import ${round.source}/${round.handle}:`, error.message);
  } finally {
    connection.release();
  }
}

// ---------------------------------------------------------------------------
// nouns.gg

const ETH = {
  name: "Ethereum",
  symbol: "ETH",
  image: null,
  decimals: 18,
  chainId: 1,
  address: "0x0000000000000000000000000000000000000000",
  tokenId: null,
};

function isLilNounsRound(round, path) {
  const haystack = `${round.community?.handle ?? ""} ${round.handle ?? ""} ${round.name ?? ""} ${path}`
    .toLowerCase();
  return /lilnouns|lil-nouns|lil nouns/.test(haystack);
}

/** Every `rounds/<community>/<handle>.json` in the export, from the git tree. */
async function nggRoundPaths() {
  const tree = await getJson(NGG_TREE, { optional: true });
  const paths = (tree?.tree ?? [])
    .map((entry) => entry.path)
    .filter((path) => /^data\/public\/v1\/rounds\/[^/]+\/[^/]+\.json$/.test(path))
    .map((path) => path.replace("data/public/v1/rounds/", "").replace(/\.json$/, ""));
  if (paths.length > 0) return paths;

  // No tree (rate limit, most likely): fall back to the community we know about.
  console.warn("could not list the nouns.gg tree; falling back to the known round list");
  return NGG_EXTRA_ROUNDS;
}

async function importNounsGg() {
  console.log("reading the nouns.gg export…");
  const paths = [...new Set([...(await nggRoundPaths()), ...NGG_EXTRA_ROUNDS])];

  const [allProposals, allAwards, profileIndex] = await Promise.all([
    getJson(`${NGG_DATA}/activity/proposals.json`),
    getJson(`${NGG_DATA}/activity/awards.json`),
    getJson(`${NGG_DATA}/profiles/index.json`, { optional: true }),
  ]);

  // Most profiles have no wallet, so imported rows keep a display name and an
  // `nouns.gg:<id>` key instead of inventing an address.
  const profiles = new Map();
  for (const profile of profileIndex ?? []) {
    const wallet = (profile.wallets ?? []).find(
      (entry) => entry.chain === "ethereum" && typeof entry.address === "string",
    );
    profiles.set(profile.id, {
      key: wallet ? wallet.address.toLowerCase() : `nouns.gg:${profile.id}`,
      name: profile.name ?? null,
      image: profile.image ?? null,
    });
  }
  const identity = (userId) =>
    profiles.get(userId) ?? { key: `nouns.gg:${userId}`, name: null, image: null };

  const proposalsByRound = new Map();
  for (const proposal of allProposals) {
    if (!proposalsByRound.has(proposal.roundId)) proposalsByRound.set(proposal.roundId, []);
    proposalsByRound.get(proposal.roundId).push(proposal);
  }
  const awardsByRound = new Map();
  for (const award of allAwards) {
    if (!awardsByRound.has(award.roundId)) awardsByRound.set(award.roundId, []);
    awardsByRound.get(award.roundId).push(award);
  }

  for (const path of paths) {
    const round = await getJson(`${NGG_DATA}/rounds/${path}.json`, { optional: true });
    if (!round || !isLilNounsRound(round, path)) continue;

    const [community] = path.split("/");
    const content = lexicalToMarkdown(round.content);
    const proposals = (proposalsByRound.get(round.id) ?? []).map((proposal) => {
      const author = identity(proposal.userId);
      const body = lexicalToMarkdown(proposal.content);
      const media = [
        proposal.image ? `![](${proposal.image})` : "",
        proposal.video ? `[Video](${proposal.video})` : "",
        proposal.url ? `[Link](${proposal.url})` : "",
      ].filter(Boolean);
      return {
        sourceId: proposal.id,
        author: author.key,
        authorName: author.name,
        authorImage: author.image,
        title: proposal.title ?? "Untitled",
        tldr: firstSentence(body),
        content: [body, ...media].filter(Boolean).join("\n\n") || proposal.title || "",
        createdAt: proposal.createdAt,
        winner: proposal.winner == null ? null : Number(proposal.winner),
      };
    });

    const winnerByPlace = new Map();
    for (const proposal of proposals) {
      if (proposal.winner && !winnerByPlace.has(proposal.winner)) {
        winnerByPlace.set(proposal.winner, proposal.sourceId);
      }
    }

    const roundVotes =
      (await getJson(`${NGG_DATA}/activity/votes/round-${community}-${round.handle}.json`, {
        optional: true,
      })) ?? [];
    const votes = roundVotes.map((vote) => {
      const voter = identity(vote.userId);
      return {
        sourceId: vote.id,
        proposalSourceId: vote.proposalId,
        voter: voter.key,
        voterName: voter.name,
        voterImage: voter.image,
        weight: BigInt(vote.count ?? 1),
        createdAt: vote.timestamp,
      };
    });

    const awards = (awardsByRound.get(round.id) ?? []).map((award) => ({
      place: Number(award.place),
      value: BigInt(award.value),
      asset: {
        name: award.asset?.name ?? "Ethereum",
        symbol: award.asset?.symbol ?? null,
        image: award.asset?.image ?? null,
        decimals: Number(award.asset?.decimals ?? 18),
        chainId: Number(award.asset?.chainId ?? 1),
        address: String(award.asset?.address ?? ETH.address).toLowerCase(),
        tokenId: award.asset?.tokenId == null ? null : String(award.asset.tokenId),
      },
      winnerSourceId: winnerByPlace.get(Number(award.place)) ?? null,
    }));

    await writeRound({
      round: {
        handle: slugify(round.handle, slugify(round.name, `nouns-gg-${round.id}`)),
        name: round.name ?? "Untitled round",
        description: round.description || firstSentence(content),
        content,
        image: round.image ?? null,
        creator: `nouns.gg:${community}`,
        creatorName: round.community?.name ?? "nouns.gg",
        creatorImage: round.community?.image ?? null,
        startAt: round.start,
        votingStartAt: round.votingStart,
        endAt: round.end,
        source: "nouns.gg",
        sourceId: round.id,
        sourceUrl: `https://nouns.gg/c/${community}/rounds/${round.handle}`,
        platform: "nouns.gg",
      },
      awards,
      proposals,
      votes,
    });
  }
}

// ---------------------------------------------------------------------------
// Prop House

/** Prop House base64-encoded the signed payload; the body is inside it. */
function decodeSignedMessage(signedData) {
  try {
    return JSON.parse(Buffer.from(signedData.message, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

async function importPropHouse() {
  console.log("reading the Prop House rounds out of the Internet Archive…");
  const auctions = await getJson(PH_COMMUNITY_URL, { optional: true });
  if (!auctions) {
    console.error(
      "could not read the archived Prop House rounds list; prop.house itself is offline, so " +
        "there is no other source. Set PH_COMMUNITY_URL to a different snapshot and retry.",
    );
    return;
  }

  const snapshots = new Map(PH_PROPOSAL_SNAPSHOTS.map(({ id, timestamp }) => [id, timestamp]));

  for (const auction of auctions) {
    // The only honest link is the snapshot the data itself came from.
    const timestamp = snapshots.get(auction.id);
    const sourceUrl = timestamp
      ? `https://web.archive.org/web/${timestamp}/https://prod.backend.prop.house/auctions/${auction.id}/proposals`
      : PH_COMMUNITY_URL;
    const content = htmlToMarkdown(auction.description ?? "");

    const proposals = [];
    const votes = [];
    if (timestamp) {
      const archived = await getJson(
        `https://web.archive.org/web/${timestamp}if_/https://prod.backend.prop.house/auctions/${auction.id}/proposals`,
        { optional: true },
      );
      for (const proposal of archived ?? []) {
        if (proposal.visible === false) continue;
        const signed = decodeSignedMessage(proposal.signedData ?? {});
        const body = htmlToMarkdown(signed?.what ?? proposal.what ?? "");
        proposals.push({
          sourceId: `proposal-${proposal.id}`,
          author: String(proposal.address).toLowerCase(),
          authorName: null,
          authorImage: null,
          title: proposal.title ?? signed?.title ?? "Untitled",
          tldr: proposal.tldr ?? signed?.tldr ?? firstSentence(body),
          content: body || proposal.tldr || "",
          createdAt: proposal.createdDate,
          winner: null,
        });
        for (const vote of proposal.votes ?? []) {
          votes.push({
            sourceId: `vote-${vote.id}`,
            proposalSourceId: `proposal-${proposal.id}`,
            voter: String(vote.address).toLowerCase(),
            voterName: null,
            voterImage: null,
            weight: BigInt(Math.max(0, Math.round(Number(vote.weight ?? 1)))),
            createdAt: vote.createdDate,
          });
        }
      }
    } else {
      console.warn(
        `round "${auction.title}" imports without its ${auction.numProposals} proposals: ` +
          "the archive has no snapshot of them",
      );
    }

    const winnerByPlace = new Map(
      proposals.filter((proposal) => proposal.winner).map((proposal) => [proposal.winner, proposal.sourceId]),
    );
    // One prize per winner, all the same size — how Prop House rounds paid out.
    const value = BigInt(Math.round(Number(auction.fundingAmount ?? 0) * 1e18));
    const awards = Array.from({ length: Number(auction.numWinners ?? 0) }, (_, index) => ({
      place: index + 1,
      value,
      asset: { ...ETH, name: auction.currencyType === "ETH" ? "Ethereum" : auction.currencyType ?? "Ethereum" },
      winnerSourceId: winnerByPlace.get(index + 1) ?? null,
    })).filter((award) => award.value > 0n);

    await writeRound({
      round: {
        handle: slugify(`prop-house-${auction.title}`, `prop-house-${auction.id}`),
        name: `${auction.title} (Prop House)`,
        description:
          firstSentence(content) ||
          `A ${auction.fundingAmount} ${auction.currencyType} Lil Nouns Prop House round with ${auction.numWinners} winners.`,
        content: [
          content,
          timestamp
            ? null
            : `_Imported from the Lil Nouns Prop House. This round had ${auction.numProposals} ` +
              "proposals; Prop House is offline and the Internet Archive has no snapshot of them, " +
              "so only the round itself could be recovered._",
        ]
          .filter(Boolean)
          .join("\n\n"),
        image: null,
        creator: "prop-house:lil-nouns",
        creatorName: "Lil Nouns Prop House",
        creatorImage: null,
        startAt: auction.startTime,
        votingStartAt: auction.proposalEndTime,
        endAt: auction.votingEndTime,
        source: "prop-house",
        sourceId: `auction-${auction.id}`,
        sourceUrl,
        platform: "Prop House",
      },
      awards,
      proposals,
      votes,
    });
  }
}

// ---------------------------------------------------------------------------

if (!DRY_RUN) {
  // The importer can run before the service has ever booted.
  await db.query(readFileSync(new URL("../schema.sql", import.meta.url), "utf8"));
  await db.query(
    `INSERT INTO rounds.house (handle, name, description) VALUES ($1, $2, $3)
     ON CONFLICT (handle) DO NOTHING`,
    [
      HOUSE_HANDLE,
      env.HOUSE_NAME || "Lil Nouns",
      env.HOUSE_DESCRIPTION ||
        "A Lil Nouns DAO funded house for open rounds. Anyone can propose, and every Lil Noun votes.",
    ],
  );
}

if (WANTED("nouns-gg")) await importNounsGg();
if (WANTED("prop-house")) await importPropHouse();

console.log(
  `${DRY_RUN ? "would import" : "imported"}: ${stats.rounds} rounds, ${stats.proposals} proposals, ` +
    `${stats.votes} votes, ${stats.awards} awards (${stats.winners} with a winner)` +
    (stats.roundsSkipped ? `, ${stats.roundsSkipped} skipped` : ""),
);
await db.end();
