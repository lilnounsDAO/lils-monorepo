import React, { useState, useEffect, useContext } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { Descendant } from 'slate'
import ProposalEditor from './ProposalEditor'
import { createEmptyParagraphElement } from './RichTextEditor'
import { useAccount } from 'wagmi'
import type { Action } from '@/types/proposal-editor'
import { useCreateProposal } from '@/hooks/transactions/useCreateProposal'
import { useCreateProposalCandidate } from '@/hooks/transactions/useCreateProposalCandidate'
import { useCreateTopic } from '@/hooks/transactions/useCreateTopic'
import { messageUtils } from '@/utils/message-utils'
import { ToastContext, ToastType } from '@/providers/toast'

const ProposalEditorScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const { address } = useAccount()
  const { addToast } = useContext(ToastContext)

  // Determine mode from route
  const isCandidateUpdate = location.pathname.startsWith('/update/candidate')
  const isProposalUpdate = location.pathname.startsWith('/update/proposal')
  const isTopicCreate = location.pathname.startsWith('/new/topic')
  const mode = (isCandidateUpdate || isProposalUpdate) ? 'edit' : 'create'
  const editType = isCandidateUpdate ? 'candidate' : isProposalUpdate ? 'proposal' : null
  const contentType = isTopicCreate ? 'topic' : 'proposal'

  // Local state for proposal data (only used in create mode)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState<Descendant[]>([createEmptyParagraphElement()])
  const [actions, setActions] = useState<Action[]>([])

  // Proposal creation hook (only used in create mode for proposals)
  const { createProposal, state: proposalState, receipt: proposalReceipt } = useCreateProposal()
  
  // Candidate creation hook (only used in create mode for candidates)
  const { createCandidate, state: candidateState, receipt: candidateReceipt } = useCreateProposalCandidate()
  
  // Topic creation hook (only used in create mode for topics)
  const { createTopic, state: topicState, receipt: topicReceipt } = useCreateTopic()

  // Track the last submission type to determine which state/receipt to use
  const [lastSubmissionType, setLastSubmissionType] = useState<'proposal' | 'candidate' | 'topic'>('candidate')
  
  // Use appropriate state based on last submission type
  const getState = () => {
    if (lastSubmissionType === 'topic') return topicState
    if (lastSubmissionType === 'candidate') return candidateState
    return proposalState
  }
  
  const getReceipt = () => {
    if (lastSubmissionType === 'topic') return topicReceipt
    if (lastSubmissionType === 'candidate') return candidateReceipt
    return proposalReceipt
  }
  
  const state = getState()
  const receipt = getReceipt()
  
  // Check if any transaction is pending (for disabling submit button)
  const isAnyPending = proposalState === 'pending-txn' || candidateState === 'pending-txn' || topicState === 'pending-txn'

  // Handle submission (only used in create mode)
  const handleSubmit = async (submissionType: 'proposal' | 'candidate' | 'topic' = 'candidate') => {
    if (!address) return

    // Track submission type for state management
    setLastSubmissionType(submissionType)

    try {
      // Convert body (Descendant[]) to markdown string
      const bodyMarkdown = messageUtils.descendantsToMarkdown(body as any)

      if (submissionType === 'topic') {
        // Create topic (no actions needed)
        await createTopic(
          title || 'Untitled Topic',
          bodyMarkdown
        )
      } else if (submissionType === 'candidate') {
        // Create candidate
        await createCandidate(
          title || 'Untitled Candidate',
          bodyMarkdown,
          actions
        )
      } else {
        // Create proposal
        await createProposal(
          title || 'Untitled Proposal',
          bodyMarkdown,
          actions
        )
      }
    } catch (error) {
      console.error(`Failed to create ${submissionType}:`, error)
      addToast?.({
        content: `Failed to create ${submissionType}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: ToastType.Failure,
      })
    }
  }

  // Handle successful creation
  useEffect(() => {
    if (state === 'success' && receipt) {
      const successMessage = 
        lastSubmissionType === 'topic' ? 'Topic created successfully!'
        : lastSubmissionType === 'candidate' ? 'Candidate created successfully!'
        : 'Proposal created successfully!'
      
      addToast?.({
        content: successMessage,
        type: ToastType.Success,
      })
      // Navigate to the created proposal/candidate/topic
      // This would need to be implemented based on the receipt
    }
  }, [state, receipt, addToast, lastSubmissionType])

  if (mode === 'edit') {
    // In edit mode, ProposalEditor manages its own state
    return (
      <ProposalEditor
        mode="edit"
        candidateId={editType === 'candidate' ? id : undefined}
        proposalId={editType === 'proposal' ? id : undefined}
        title=""
        body={[createEmptyParagraphElement()]}
        actions={[]}
        onTitleChange={() => {}}
        onBodyChange={() => {}}
        onActionsChange={() => {}}
        onSubmit={() => {}}
        submitLabel={editType === 'candidate' ? "Update Candidate" : "Update Proposal"}
        defaultSubmissionType={editType || 'candidate'}
        titlePlaceholder={editType === 'candidate' ? "Untitled candidate" : "Untitled proposal"}
        contentType={contentType === 'topic' ? 'topic' : contentType === 'proposal' ? 'proposal' : 'candidate'}
        hasHeader={true}
      />
    )
  }

  // In create mode, use local state
  return (
      <ProposalEditor
      mode="create"
        title={title}
        body={body}
        actions={actions}
        onTitleChange={setTitle}
        onBodyChange={setBody}
        onActionsChange={setActions}
        onSubmit={handleSubmit}
      submitLabel={contentType === 'topic' ? 'Create Topic' : 'Create Proposal'}
      disabled={isAnyPending}
      isSubmitting={isAnyPending}
      defaultSubmissionType={contentType === 'topic' ? 'topic' : 'candidate'}
      titlePlaceholder={contentType === 'topic' ? 'Untitled topic' : contentType === 'proposal' ? 'Untitled proposal' : 'Untitled candidate'}
      contentType={contentType === 'topic' ? 'topic' : contentType === 'proposal' ? 'proposal' : 'candidate'}
    />
  )
}

export default ProposalEditorScreen