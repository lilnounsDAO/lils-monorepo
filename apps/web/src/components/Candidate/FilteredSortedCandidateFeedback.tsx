"use client";
import { useSearchContext } from "../Search";
import CandidateFeedbackItem from "./CandidateFeedbackItem";
import { useSortContext } from "../Sort";
import { useMemo } from "react";
import { FeedbackPost } from "@/data/goldsky/governance/ideaTypes";

export const FEEDBACK_SORT_ITEMS: { name: string; value: string }[] = [
  { name: "Most recent", value: "recent" },
  { name: "Vote weight", value: "weight" },
];

export default function FilteredSortedCandidateFeedback({
  feedbackPosts,
  candidateCanceled,
}: {
  feedbackPosts: FeedbackPost[];
  candidateCanceled: boolean;
}) {
  const { debouncedSearchValue } = useSearchContext();
  const { sortValue } = useSortContext();

  const filteredSortedFeedback = useMemo(() => {
    const filtered = [...feedbackPosts].filter((feedback) => {
      return (
        (feedback.reason ?? "")
          .toLowerCase()
          .includes(debouncedSearchValue.toLowerCase()) ||
        feedback.voterAddress
          .toLowerCase()
          .includes(debouncedSearchValue.toLowerCase())
      );
    });
    filtered.sort((a, b) =>
      sortValue == "weight"
        ? b.votes - a.votes
        : b.createdTimestamp - a.createdTimestamp
    );

    return filtered;
  }, [feedbackPosts, sortValue, debouncedSearchValue]);

  // Flatten feedback to include revotes as separate items
  const flattenedFeedback = useMemo(() => {
    const result: Array<{
      feedback: FeedbackPost;
      isRevote?: boolean;
      revoteOf?: FeedbackPost;
    }> = [];

    filteredSortedFeedback.forEach((feedback) => {
      // Add the main feedback item
      result.push({ feedback });

      // Add revotes as separate items (like second image)
      if (feedback.voteRevotes) {
        feedback.voteRevotes.forEach(({ revote }) => {
          if (revote) {
            result.push({
              feedback: {
                id: revote.id,
                voterAddress: revote.voter.id,
                support: feedback.support, // Revote uses same support as original
                reason: revote.reason || "",
                votes: feedback.votes,
                createdTimestamp: feedback.createdTimestamp,
              },
              isRevote: true,
              revoteOf: feedback,
            });
          }
        });
      }
    });

    return result;
  }, [filteredSortedFeedback]);

  return (
    <>
      {flattenedFeedback.length > 0 ? (
        flattenedFeedback.map((item, i) => (
          <CandidateFeedbackItem
            key={`${item.feedback.id}-${i}`}
            feedback={item.feedback}
            candidateCanceled={candidateCanceled}
            isRevote={item.isRevote}
          />
        ))
      ) : (
        <div className="flex h-[120px] w-full items-center justify-center rounded-[12px] border bg-gray-100 px-6 py-4 text-center">
          There is no feedback
          {debouncedSearchValue == "" ? " yet" : " matching the search filter"}.
        </div>
      )}
    </>
  );
}
