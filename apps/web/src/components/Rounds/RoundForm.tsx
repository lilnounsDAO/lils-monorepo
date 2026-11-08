"use client";
import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { parseUnits, zeroAddress } from "viem";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { CHAIN_CONFIG } from "@/config";
import { RoundAsset, RoundAwardInput, Round } from "@/data/rounds/types";
import { useCreateRound } from "@/hooks/rounds/useRoundWrites";
import ConnectPrompt from "./ConnectPrompt";
import { ordinal } from "./utils";

/** Assets a round can pay in. A round's prizes are fixed once it is signed. */
const ASSETS: Record<string, RoundAsset> = {
  eth: {
    name: "Ethereum",
    symbol: "ETH",
    image: null,
    decimals: 18,
    chainId: CHAIN_CONFIG.chain.id,
    address: zeroAddress,
    tokenId: null,
  },
  usdc: {
    name: "USD Coin",
    symbol: "USDC",
    image: null,
    decimals: 6,
    chainId: CHAIN_CONFIG.chain.id,
    address: CHAIN_CONFIG.addresses.usdc,
    tokenId: null,
  },
};

interface AwardDraft {
  /** As typed, in whole units of the asset. */
  amount: string;
  asset: keyof typeof ASSETS;
}

function toLocalInput(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function handleFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 61);
}

/**
 * Open a funded round. The creator signs the handle, name, description, the
 * body's hash, the awards' hash and the three timestamps, so the round the
 * service stores is exactly the one that was signed for.
 */
export default function RoundForm({ onDone }: { onDone: (handle: string) => void }) {
  const { address } = useAccount();
  const create = useCreateRound();

  const now = new Date();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [preview, setPreview] = useState(false);
  const [startAt, setStartAt] = useState(toLocalInput(new Date(now.getTime() + 60 * 60_000)));
  const [votingStartAt, setVotingStartAt] = useState(
    toLocalInput(new Date(now.getTime() + 8 * 24 * 3_600_000)),
  );
  const [endAt, setEndAt] = useState(toLocalInput(new Date(now.getTime() + 13 * 24 * 3_600_000)));
  const [awards, setAwards] = useState<AwardDraft[]>([{ amount: "0.5", asset: "eth" }]);
  const [proposeStrategy, setProposeStrategy] = useState<"open" | "lil-nouns-votes">("open");
  const [voteStrategy, setVoteStrategy] = useState<"lil-nouns-votes" | "fixed">("lil-nouns-votes");

  const effectiveHandle = handle || handleFromName(name);

  const parsedAwards = useMemo<RoundAwardInput[] | null>(() => {
    try {
      const parsed = awards.map((award, index) => ({
        place: index + 1,
        value: parseUnits(award.amount || "0", ASSETS[award.asset].decimals).toString(),
        asset: ASSETS[award.asset],
      }));
      return parsed.every((award) => BigInt(award.value) > 0n) ? parsed : null;
    } catch {
      return null;
    }
  }, [awards]);

  const datesValid =
    new Date(startAt) < new Date(votingStartAt) && new Date(votingStartAt) < new Date(endAt);
  const ready =
    effectiveHandle.length >= 2 &&
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    content.trim().length > 0 &&
    parsedAwards !== null &&
    datesValid;

  const strategies = {
    proposeStrategy: (proposeStrategy === "open"
      ? { type: "open" }
      : { type: "lil-nouns-votes", min: "1" }) as Round["proposeStrategy"],
    voteStrategy: (voteStrategy === "fixed"
      ? { type: "fixed", votes: "1", min: "0" }
      : { type: "lil-nouns-votes", multiplier: 1 }) as Round["voteStrategy"],
  };

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready || !parsedAwards) return;
        create.mutate(
          {
            handle: effectiveHandle,
            name,
            description,
            content,
            image: image.trim() || null,
            startAt: new Date(startAt),
            votingStartAt: new Date(votingStartAt),
            endAt: new Date(endAt),
            awards: parsedAwards,
            ...strategies,
          },
          { onSuccess: (result) => onDone(result.handle) },
        );
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="round-name">Name</Label>
        <Input
          id="round-name"
          value={name}
          maxLength={200}
          placeholder="Lil Nouns goes to…"
          onChange={(event) => setName(event.target.value)}
        />
        <p className="text-sm text-content-secondary">
          Lives at <span className="font-mono">/rounds/{effectiveHandle || "…"}</span>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="round-handle">Handle</Label>
        <Input
          id="round-handle"
          value={handle}
          maxLength={61}
          placeholder={handleFromName(name) || "lil-nouns-round"}
          onChange={(event) => setHandle(handleFromName(event.target.value))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="round-description">Summary</Label>
        <Input
          id="round-description"
          value={description}
          maxLength={1000}
          placeholder="One line for the rounds list"
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="round-content">Details</Label>
          <Button
            type="button"
            variant="ghost"
            size="fit"
            className="text-sm underline"
            onClick={() => setPreview((value) => !value)}
          >
            {preview ? "Write" : "Preview"}
          </Button>
        </div>
        {preview ? (
          <div className="min-h-48 rounded-xl border-2 border-border-primary p-3">
            <MarkdownRenderer className="prose max-w-none">{content}</MarkdownRenderer>
          </div>
        ) : (
          <Textarea
            id="round-content"
            value={content}
            rows={12}
            placeholder="Markdown. What the round funds, what winners get, what you expect of them."
            className="rounded-xl border-2 border-border-primary p-3 text-base"
            onChange={(event) => setContent(event.target.value)}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="round-image">Image URL</Label>
        <Input
          id="round-image"
          value={image}
          placeholder="https://"
          onChange={(event) => setImage(event.target.value)}
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="pb-2 font-bold">Awards</legend>
        {awards.map((award, index) => (
          <div key={index} className="flex items-end gap-2">
            <span className="w-10 pb-3 text-sm text-content-secondary">{ordinal(index + 1)}</span>
            <Input
              aria-label={`${ordinal(index + 1)} place amount`}
              value={award.amount}
              inputMode="decimal"
              onChange={(event) =>
                setAwards((current) =>
                  current.map((item, position) =>
                    position === index ? { ...item, amount: event.target.value } : item,
                  ),
                )
              }
            />
            <Select
              value={award.asset}
              onValueChange={(value) =>
                setAwards((current) =>
                  current.map((item, position) =>
                    position === index ? { ...item, asset: value } : item,
                  ),
                )
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ASSETS).map(([key, asset]) => (
                  <SelectItem key={key} value={key}>
                    {asset.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove the ${ordinal(index + 1)} award`}
              disabled={awards.length === 1}
              onClick={() => setAwards((current) => current.filter((_, p) => p !== index))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          className="self-start"
          disabled={awards.length >= 50}
          onClick={() =>
            setAwards((current) => [...current, current[current.length - 1] ?? { amount: "0.5", asset: "eth" }])
          }
        >
          <Plus className="mr-1 size-4" /> Add an award
        </Button>
        <p className="text-sm text-content-secondary">
          One award per winner, highest votes first. Payouts happen onchain after the round, from
          the house treasury.
        </p>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-3">
        <legend className="pb-2 font-bold">Schedule</legend>
        <div className="flex flex-col gap-2">
          <Label htmlFor="round-start">Proposing opens</Label>
          <Input
            id="round-start"
            type="datetime-local"
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="round-voting">Voting opens</Label>
          <Input
            id="round-voting"
            type="datetime-local"
            value={votingStartAt}
            onChange={(event) => setVotingStartAt(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="round-end">Round ends</Label>
          <Input
            id="round-end"
            type="datetime-local"
            value={endAt}
            onChange={(event) => setEndAt(event.target.value)}
          />
        </div>
        {!datesValid && (
          <p className="text-sm text-semantic-negative md:col-span-3">
            Proposing must open before voting, and voting must close last.
          </p>
        )}
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="pb-2 font-bold">Rules</legend>
        <div className="flex flex-col gap-2">
          <Label htmlFor="round-propose-strategy">Who can propose</Label>
          <Select
            value={proposeStrategy}
            onValueChange={(value) => setProposeStrategy(value as typeof proposeStrategy)}
          >
            <SelectTrigger id="round-propose-strategy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Anyone</SelectItem>
              <SelectItem value="lil-nouns-votes">Lil Nouns voters only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="round-vote-strategy">How votes are weighted</Label>
          <Select
            value={voteStrategy}
            onValueChange={(value) => setVoteStrategy(value as typeof voteStrategy)}
          >
            <SelectTrigger id="round-vote-strategy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lil-nouns-votes">One vote per Lil Noun delegated</SelectItem>
              <SelectItem value="fixed">One vote per wallet</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-content-secondary md:col-span-2">
          Voting power is read at the block voting opens, so a Lil Noun bought mid-round carries no
          weight.
        </p>
      </fieldset>

      {create.error && <p className="text-sm text-semantic-negative">{create.error.message}</p>}

      {address ? (
        <Button type="submit" disabled={!ready || create.isPending} className="self-start">
          {create.isPending ? (
            <span className="flex items-center gap-2">
              <Spinner size="1rem" /> Signing
            </span>
          ) : (
            "Open round"
          )}
        </Button>
      ) : (
        <div className="self-start">
          <ConnectPrompt>Connect to open a round</ConnectPrompt>
        </div>
      )}
    </form>
  );
}
