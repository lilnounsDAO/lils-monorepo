"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ConnectPrompt from "./ConnectPrompt";
import { Round, RoundProposal } from "@/data/rounds/types";
import { useSubmitRoundProposal } from "@/hooks/rounds/useRoundWrites";

/**
 * Add a proposal to a round, or edit your own while proposing is still open.
 * The body is markdown, the same flavour the proposal editor writes, and it is
 * committed to by hash in the signature — so editing after signing fails.
 */
export default function RoundProposalForm({
  round,
  proposal,
  onDone,
}: {
  round: Round;
  proposal?: RoundProposal;
  onDone: (id: number) => void;
}) {
  const { address } = useAccount();
  const [title, setTitle] = useState(proposal?.title ?? "");
  const [tldr, setTldr] = useState(proposal?.tldr ?? "");
  const [content, setContent] = useState(proposal?.content ?? "");
  const [preview, setPreview] = useState(false);
  const submit = useSubmitRoundProposal();

  const ready = title.trim().length > 0 && content.trim().length > 0;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready) return;
        submit.mutate(
          { handle: round.handle, title, tldr, content, proposalId: proposal?.id },
          { onSuccess: (result) => onDone(result.id) },
        );
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="round-proposal-title">Title</Label>
        <Input
          id="round-proposal-title"
          value={title}
          maxLength={300}
          placeholder="What are you proposing?"
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="round-proposal-tldr">TLDR</Label>
        <Input
          id="round-proposal-tldr"
          value={tldr}
          maxLength={1000}
          placeholder="One line voters will see in the list"
          onChange={(event) => setTldr(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="round-proposal-content">Proposal</Label>
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
            id="round-proposal-content"
            value={content}
            rows={14}
            placeholder="Markdown. What you will do, who you are, what it costs."
            className="rounded-xl border-2 border-border-primary p-3 text-base"
            onChange={(event) => setContent(event.target.value)}
          />
        )}
      </div>

      {submit.error && (
        <p className="text-sm text-semantic-negative">{submit.error.message}</p>
      )}

      {address ? (
        <Button type="submit" disabled={!ready || submit.isPending} className="self-start">
          {submit.isPending ? (
            <span className="flex items-center gap-2">
              <Spinner size="1rem" /> Signing
            </span>
          ) : proposal ? (
            "Save changes"
          ) : (
            "Submit proposal"
          )}
        </Button>
      ) : (
        <div className="self-start">
          <ConnectPrompt>Connect to propose</ConnectPrompt>
        </div>
      )}
    </form>
  );
}
