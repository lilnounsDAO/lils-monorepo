"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { FeedbackPost } from "@/data/goldsky/governance/ideaTypes";

interface CandidateFeedbackContextInterface {
  replies: FeedbackPost[];
  revotes: FeedbackPost[];

  addReply: (reply: FeedbackPost) => void;
  removeReply: (reply: FeedbackPost) => void;
  addRevote: (revote: FeedbackPost) => void;
  removeRevote: (revote: FeedbackPost) => void;
  clearReplies: () => void;
  clearRevotes: () => void;
}

const CandidateFeedbackContext = createContext<CandidateFeedbackContextInterface | undefined>(
  undefined,
);

export function useCandidateFeedbackContext() {
  const context = useContext(CandidateFeedbackContext);
  if (!context) {
    throw new Error(
      "useCandidateFeedbackContext must be used within CandidateFeedbackProvider",
    );
  }

  return context;
}

export default function CandidateFeedbackProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [replies, setReplies] = useState<FeedbackPost[]>([]);
  const [revotes, setRevotes] = useState<FeedbackPost[]>([]);

  const addReply = useCallback(
    (reply: FeedbackPost) => {
      setReplies((replies) => {
        if (replies.some((r) => r.id === reply.id)) {
          return replies;
        }
        return [...replies, reply];
      });
    },
    [setReplies],
  );

  const removeReply = useCallback(
    (reply: FeedbackPost) => {
      setReplies((replies) => {
        return [...replies.filter((r) => r.id !== reply.id)];
      });
    },
    [setReplies],
  );

  const addRevote = useCallback(
    (revote: FeedbackPost) => {
      setRevotes((revotes) => {
        if (revotes.some((r) => r.id === revote.id)) {
          return revotes;
        }
        return [...revotes, revote];
      });
    },
    [setRevotes],
  );

  const removeRevote = useCallback(
    (revote: FeedbackPost) => {
      setRevotes((revotes) => {
        return [...revotes.filter((r) => r.id !== revote.id)];
      });
    },
    [setRevotes],
  );

  const clearReplies = useCallback(() => {
    setReplies([]);
  }, [setReplies]);

  const clearRevotes = useCallback(() => {
    setRevotes([]);
  }, [setRevotes]);

  return (
    <CandidateFeedbackContext.Provider
      value={{
        replies,
        revotes,
        addReply,
        removeReply,
        addRevote,
        removeRevote,
        clearReplies,
        clearRevotes,
      }}
    >
      {children}
    </CandidateFeedbackContext.Provider>
  );
}

