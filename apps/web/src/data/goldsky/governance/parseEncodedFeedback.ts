/** Camp-style replies/revotes are encoded in reason text. Rehearsal Goldsky has no voteReplies on candidate/topic feedback. */

export type EncodedReplyVote = {
  id: string;
  voter: { id: string };
  support?: number | null;
  reason?: string | null;
};

export type EncodedReply = {
  id: string;
  reply: string;
  quotedReason?: string | null;
  replyVote: EncodedReplyVote;
};

export type EncodedFeedback = {
  id: string;
  voterAddress: string;
  support: number;
  reason: string;
  createdTimestamp: number;
  voteReplies?: EncodedReply[];
};

const FULL_MENTION =
  /\n\n@(0x[a-fA-F0-9]{40})\n\n([\s\S]*?)\n((?:>[^\n]*(?:\n|$))+)/g;
const SHORT_MENTION =
  /\n\n@(0x[a-fA-F0-9]{4})\.\.\.([a-fA-F0-9]{4})\n\n([\s\S]*?)\n((?:>[^\n]*(?:\n|$))+)/g;

function unquote(quoted: string): string {
  return quoted
    .split("\n")
    .map((line) => line.replace(/^> ?/, ""))
    .join("\n")
    .trim();
}

function addressMatches(voter: string, mention: string): boolean {
  const a = voter.toLowerCase();
  const m = mention.toLowerCase();
  if (m.startsWith("0x") && m.length === 42) return a === m;
  const parts = m.split("...");
  if (parts.length !== 2) return false;
  return a.startsWith(parts[0]) && a.endsWith(parts[1]);
}

function parseBlocks(reason: string): { leftover: string; replies: { mention: string; reply: string; quoted: string }[] } {
  const replies: { mention: string; reply: string; quoted: string }[] = [];
  let leftover = reason ?? "";

  leftover = leftover.replace(FULL_MENTION, (_all, addr, reply, quoted) => {
    replies.push({ mention: addr, reply: String(reply).trim(), quoted: unquote(quoted) });
    return "";
  });
  leftover = leftover.replace(SHORT_MENTION, (_all, prefix, suffix, reply, quoted) => {
    replies.push({
      mention: `${prefix}...${suffix}`,
      reply: String(reply).trim(),
      quoted: unquote(quoted),
    });
    return "";
  });

  return { leftover: leftover.replace(/^\n+|\n+$/g, ""), replies };
}

function findParent<T extends EncodedFeedback>(
  prior: T[],
  mention: string,
  quoted: string
): T | undefined {
  const matches = prior.filter((f) => addressMatches(f.voterAddress, mention));
  if (quoted) {
    const exact = [...matches].reverse().find((f) => (f.reason ?? "").trim() === quoted);
    if (exact) return exact;
  }
  return matches.at(-1);
}

export function attachEncodedReplies<T extends EncodedFeedback>(feedbacks: T[]): T[] {
  if (feedbacks.length === 0) return feedbacks;

  const chronological = [...feedbacks].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
  const byId = new Map<string, T>();
  for (const fb of chronological) {
    byId.set(fb.id, {
      ...fb,
      voteReplies: fb.voteReplies ? [...fb.voteReplies] : [],
    });
  }

  for (let i = 0; i < chronological.length; i++) {
    const raw = chronological[i];
    const current = byId.get(raw.id)!;
    const { leftover, replies } = parseBlocks(current.reason);
    if (replies.length === 0) continue;

    current.reason = leftover;
    const prior = chronological.slice(0, i).map((f) => byId.get(f.id)!);

    for (const block of replies) {
      const parent = findParent(prior, block.mention, block.quoted);
      if (!parent) continue;
      const already = parent.voteReplies?.some((vr) => vr.replyVote.id === current.id);
      if (already) continue;
      parent.voteReplies = parent.voteReplies ?? [];
      parent.voteReplies.push({
        id: `${current.id}-reply`,
        reply: block.reply,
        quotedReason: block.quoted,
        replyVote: {
          id: current.id,
          voter: { id: current.voterAddress },
          support: current.support,
          reason: leftover || current.reason,
        },
      });
    }
  }

  return feedbacks.map((fb) => byId.get(fb.id) ?? fb);
}
