import { useState } from 'react'
import { Button } from '@/components/ui/button'
import AutoresizingTextArea from '@/components/AutoresizingTextarea'
import { useCandidateFeedback } from '@/hooks/data-contract/useCandidateFeedback'
import { ProposalIdea } from '@/data/goldsky/governance/ideaTypes'
import { extractSlugFromId } from '@/data/goldsky/governance/getProposalIdeas'
import clsx from 'clsx'

interface CandidateCommentFormProps {
  candidate: ProposalIdea
  onSuccess?: () => void
}

export default function CandidateCommentForm({ candidate, onSuccess }: CandidateCommentFormProps) {
  const [comment, setComment] = useState('')
  const [support, setSupport] = useState<number | null>(null)
  const { sendFeedback, state, error } = useCandidateFeedback()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!comment.trim() || support === null) {
      return
    }

    try {
      const slug = extractSlugFromId(candidate.id)
      await sendFeedback(candidate.proposerAddress, slug, support, comment)
      setComment('')
      setSupport(null)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  const isSubmitting = state === 'pending-txn'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <AutoresizingTextArea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your thoughts on this candidate..."
        className="min-h-[100px] w-full resize-none rounded-[12px] border p-4"
        disabled={isSubmitting}
      />

      <div className="flex items-center gap-2">
        <span className="paragraph-sm text-content-secondary">Support:</span>
        <button
          type="button"
          onClick={() => setSupport(0)}
          className={clsx(
            "rounded-full px-4 py-2 text-sm transition-colors",
            support === 0
              ? "bg-red-100 text-red-700"
              : "bg-background-primary text-content-secondary hover:bg-background-secondary"
          )}
          disabled={isSubmitting}
        >
          Against
        </button>
        <button
          type="button"
          onClick={() => setSupport(1)}
          className={clsx(
            "rounded-full px-4 py-2 text-sm transition-colors",
            support === 1
              ? "bg-green-100 text-green-700"
              : "bg-background-primary text-content-secondary hover:bg-background-secondary"
          )}
          disabled={isSubmitting}
        >
          For
        </button>
        <button
          type="button"
          onClick={() => setSupport(2)}
          className={clsx(
            "rounded-full px-4 py-2 text-sm transition-colors",
            support === 2
              ? "bg-gray-100 text-gray-700"
              : "bg-background-primary text-content-secondary hover:bg-background-secondary"
          )}
          disabled={isSubmitting}
        >
          Abstain
        </button>
      </div>

      {error && (
        <div className="rounded-[12px] bg-red-50 p-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      <Button
        type="submit"
        disabled={!comment.trim() || support === null || isSubmitting}
        className="self-start"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </Button>
    </form>
  )
}

