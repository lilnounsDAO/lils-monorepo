import React, { useState, useEffect, useMemo, useContext, useRef, useCallback } from 'react'
import { Descendant, Node } from 'slate'
import RichTextEditor, { createEmptyParagraphElement } from './RichTextEditor'
import ActionDialog from './ActionDialog'
import SubmissionDialog from './SubmissionDialog'
import SimulateVotesDialog from './SimulateVotesDialog'
import { Button } from '@/components/ui/button'
import type { Action, PayerTopUpAction } from '@/types/proposal-editor'
import { cn } from '@/utils/shadcn'
import { Plus, ChevronDown, ChevronUp, Copy, ClipboardPaste, Save, Trash2, Vote } from 'lucide-react'
import { useAccount, useSignMessage } from 'wagmi'
import { useEnsResolution } from '@/hooks/useEnsResolution'
import { formatEther, formatUnits, getAddress, isAddress, parseEther, parseUnits } from 'viem'
import { getAddressOverrides } from '@/utils/addressOverrides'
import { getPayerStatus, payerFundingAvailable } from '@/data/payer/getPayerStatus'
import { applyTopUp, planTopUp } from '@/data/payer/payerTopUp'
import { useTenderlySimulation } from '@/hooks/useTenderlySimulation'
import { normalizeCalldata, resolveAction, transactionsToActions, type Transaction, usdcRequested } from '@/utils/transactions'
import { CHAIN_CONFIG } from '@/config'
import { useQuery } from '@tanstack/react-query'
import { getProposalIdea, normalizeIdeaId } from '@/data/goldsky/governance/getProposalIdeas'
import { useUpdateProposalCandidate } from '@/hooks/transactions/useUpdateProposalCandidate'
import { useUpdateProposal } from '@/hooks/transactions/useUpdateProposal'
import { getProposal } from '@/data/goldsky/governance/getProposal'
import { messageUtils } from '@/utils/message-utils'
import { ToastContext, ToastType } from '@/providers/toast'
import { useNavigate } from 'react-router-dom'
import { isDaoVersion5 } from '@/utils/daoVersion'
import { uploadLocalImages, type ImageUploadSigner } from '@/utils/localImages'
import { markdownToDescendants, parsePastedProposal } from '@/utils/parsePastedProposal'
import {
  formatEditorDraftTime,
  loadEditorDrafts,
  newEditorDraftId,
  removeEditorDraft,
  upsertEditorDraft,
  type EditorDraft,
} from '@/utils/editorDrafts'
import { DraftComposer, DraftThread } from './DraftDiscussion'
import {
  addSavedProposalCollaborator,
  addSavedProposalComment,
  commentCanonical,
  createSavedProposal,
  decideSavedProposalComment,
  decisionCanonical,
  deleteSavedProposal,
  getSavedProposal,
  inviteKey,
  listSavedProposals,
  openSavedProposalSession,
  personLabel,
  proposalCanonical,
  readSavedProposalSession,
  removeSavedProposalCollaborator,
  replyCanonical,
  replyToSavedProposalComment,
  sha256Hex,
  signableMessage,
  updateSavedProposal,
  type SavedProposal,
  type SavedProposalAccess,
  type SavedProposalComment,
  type SavedProposalSummary,
} from '@/data/savedProposals'

interface ProposalEditorProps {
  title: string
  body: Descendant[]
  actions: Action[]
  onTitleChange: (title: string) => void
  onBodyChange: (body: Descendant[]) => void
  onActionsChange: (actions: Action[]) => void
  onSubmit?: (submissionType?: 'proposal' | 'candidate' | 'topic') => void
  onDelete?: () => void
  disabled?: boolean
  submitLabel?: string
  isSubmitting?: boolean
  defaultSubmissionType?: 'proposal' | 'candidate' | 'topic'
  titlePlaceholder?: string
  contentType?: 'proposal' | 'candidate' | 'topic'
  hasHeader?: boolean // When true, removes top padding to account for external header

  // Edit mode props
  mode?: 'create' | 'edit'
  editData?: {
    candidateId?: string
    updateReason?: string
    onUpdateReasonChange?: (reason: string) => void
  }
  // Internal edit mode state (when used as a standalone component)
  candidateId?: string
  proposalId?: string
  openedShared?: SavedProposal | null
  initialDraftId?: string | null
  enableDrafts?: boolean
}

function blockExcerpt(block: Descendant | undefined) {
  return Node.string(block || { text: '' }).replace(/\s+/g, ' ').trim().slice(0, 180)
}

const ProposalEditor: React.FC<ProposalEditorProps> = ({
  title,
  body,
  actions,
  onTitleChange,
  onBodyChange,
  onActionsChange,
  onSubmit,
  onDelete,
  disabled = false,
  submitLabel = 'Continue to submission',
  isSubmitting = false,
  defaultSubmissionType = 'proposal',
  titlePlaceholder = 'Untitled proposal',
  contentType = 'proposal',
  hasHeader = false,
  mode = 'create',
  editData,
  candidateId,
  proposalId,
  openedShared = null,
  initialDraftId = null,
  enableDrafts = true,
}) => {
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const imageSigner: ImageUploadSigner | null = address
    ? { address, chainId: CHAIN_CONFIG.chain.id, signMessage: (message) => signMessageAsync({ message }) }
    : null
  const { addToast } = useContext(ToastContext)
  const navigate = useNavigate()
  const isVersion5 = isDaoVersion5()

  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false)
  const [isSimulateVotesOpen, setIsSimulateVotesOpen] = useState(false)
  // The payer top-up last added or resized to fund a USDC ask. Matched by object
  // identity, so the highlight drops once that action is edited or replaced.
  const [fundedTopUp, setFundedTopUp] = useState<{ action: PayerTopUpAction; previous?: string } | null>(null)
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null)
  const { resolveEnsAddress } = useEnsResolution()
  const [resolvedAddresses, setResolvedAddresses] = useState<Record<string, string>>({})
  const [expandedActions, setExpandedActions] = useState<Set<number>>(new Set())
  const [copiedActions, setCopiedActions] = useState(false)
  const [pastedProposal, setPastedProposal] = useState(false)
  const [drafts, setDrafts] = useState<EditorDraft[]>(() => loadEditorDrafts())
  const [activeDraftId, setActiveDraftId] = useState<string | null>(initialDraftId)
  const [draftJustSaved, setDraftJustSaved] = useState(false)
  const [sharedProposals, setSharedProposals] = useState<SavedProposalSummary[]>([])
  const [sharedReady, setSharedReady] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [activeShared, setActiveShared] = useState<SavedProposal | null>(null)
  const [sharing, setSharing] = useState(false)
  const [awaitingWallet, setAwaitingWallet] = useState(false)
  const [proposalComment, setProposalComment] = useState('')
  const [inlineComment, setInlineComment] = useState('')
  const [inlineTarget, setInlineTarget] = useState<{
    target: 'block' | 'ask'
    blockIndex: number | null
    actionIndex: number | null
    excerpt: string
  } | null>(null)
  const [attached, setAttached] = useState<{ owner: 'proposal' | 'inline', action: Action } | null>(null)
  const [requestDialog, setRequestDialog] = useState<
    | { mode: 'attach', owner: 'proposal' | 'inline' }
    | { mode: 'update', commentId: string, action: Action }
    | null
  >(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [discussionBusy, setDiscussionBusy] = useState<string | null>(null)
  const [personInput, setPersonInput] = useState('')
  const [personRole, setPersonRole] = useState<SavedProposalAccess>('comment')
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [formatSlot, setFormatSlot] = useState<HTMLDivElement | null>(null)

  // Edit mode state
  const [updateReason, setUpdateReason] = useState(editData?.updateReason || '')

  // Internal state for edit mode (when used as standalone component)
  const [internalTitle, setInternalTitle] = useState(title)
  const [internalBody, setInternalBody] = useState(body)
  const [internalActions, setInternalActions] = useState(actions)

  // Use internal state in edit mode, external state in create mode
  const currentTitle = mode === 'edit' ? internalTitle : title
  const currentBody = mode === 'edit' ? internalBody : body
  const currentActions = mode === 'edit' ? internalActions : actions

  // Internal edit mode data loading (when used as standalone component)
  const actualCandidateId = editData?.candidateId || candidateId
  const actualProposalId = proposalId
  const { data: candidate } = useQuery({
    queryKey: ['candidate', actualCandidateId],
    queryFn: () => actualCandidateId ? getProposalIdea(normalizeIdeaId(actualCandidateId)) : null,
    enabled: !!actualCandidateId && mode === 'edit' && !actualProposalId,
  })

  const { data: proposal } = useQuery({
    queryKey: ['proposal', actualProposalId, 'lilnouns'],
    queryFn: () => actualProposalId ? getProposal(actualProposalId, 'lilnouns') : null,
    enabled: !!actualProposalId && mode === 'edit',
  })

  // Update hooks
  const { updateCandidate, state: updateCandidateState, error: updateCandidateError, receipt: updateCandidateReceipt } = useUpdateProposalCandidate()
  const { updateProposal, state: updateProposalState, error: updateProposalError, receipt: updateProposalReceipt } = useUpdateProposal()
  
  // Use appropriate state based on edit type
  const updateState = actualProposalId ? updateProposalState : updateCandidateState
  const updateError = actualProposalId ? updateProposalError : updateCandidateError
  const updateReceipt = actualProposalId ? updateProposalReceipt : updateCandidateReceipt

  // Tenderly simulation hook
  const {
    data: simulationResults,
    isLoading: isSimulating,
    error: simulationError
  } = useTenderlySimulation(contentType !== 'topic' ? currentActions : [])

  // Load candidate data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && candidate && address && !actualProposalId) {
      // Verify user is the proposer
      if (address.toLowerCase() !== candidate.proposerAddress.toLowerCase()) {
        addToast?.({
          content: 'Only the proposer can edit this candidate.',
          type: ToastType.Failure,
        })
        navigate(`/candidates/${actualCandidateId}`)
        return
      }

      // Set title (extract from description)
      const content = candidate.latestVersion.content
      const newTitle = content.title || ''
      setInternalTitle(newTitle)

      // Convert description to rich text
      // Remove title from description if present
      let description = content.description
      if (description.startsWith(`# ${content.title}\n\n`)) {
        description = description.substring(`# ${content.title}\n\n`.length)
      } else if (description.startsWith(`# ${content.title}\n`)) {
        description = description.substring(`# ${content.title}\n`.length)
      }

      // Convert markdown to rich text (simplified - just create paragraph nodes)
      const paragraphs = description.split('\n\n').filter(p => p.trim())
      const newBody: Descendant[] = paragraphs.length > 0
        ? paragraphs.map(p => ({
            type: 'paragraph',
            children: [{ text: p.trim() }]
          } as unknown as Descendant))
        : [{ type: 'paragraph', children: [{ text: '' }] }] as unknown as Descendant[]
      setInternalBody(newBody)

      // Convert transactions to actions using the reverse-engineering function
      const transactions: Transaction[] = []
      for (let i = 0; i < content.targets.length; i++) {
        transactions.push({
          target: content.targets[i],
          value: content.values[i] || '0',
          signature: content.signatures[i] || '',
          calldata: content.calldatas[i] || '0x',
        })
      }

      // Use the transactionsToActions function to properly decode and detect action types
      const newActions = transactionsToActions(transactions, CHAIN_CONFIG.chain.id)
      setInternalActions(newActions)
    }
  }, [mode, candidate, address, actualCandidateId, actualProposalId, addToast, navigate])

  // Load proposal data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && proposal && address && actualProposalId) {
      // Verify user is the proposer
      if (address.toLowerCase() !== proposal.proposerAddress.toLowerCase()) {
        addToast?.({
          content: 'Only the proposer can edit this proposal.',
          type: ToastType.Failure,
        })
        navigate(`/vote/${actualProposalId}`)
        return
      }

      // Verify proposal is updatable
      if (proposal.state !== 'updatable') {
        addToast?.({
          content: 'This proposal is no longer in the updatable period.',
          type: ToastType.Failure,
        })
        navigate(`/vote/${actualProposalId}`)
        return
      }

      // Set title - use proposal.title first, then extract from description if needed
      let description = proposal.description || ''
      let newTitle = proposal.title || ''
      
      // Remove title from description if present (description format: "# Title\n\nDescription")
      if (newTitle && description.startsWith(`# ${newTitle}\n\n`)) {
        description = description.substring(`# ${newTitle}\n\n`.length)
      } else if (newTitle && description.startsWith(`# ${newTitle}\n`)) {
        description = description.substring(`# ${newTitle}\n`.length)
      } else if (!newTitle && description.startsWith('# ')) {
        // Extract title from description if proposal.title is empty
        const firstLineEnd = description.indexOf('\n')
        if (firstLineEnd > 0) {
          newTitle = description.substring(2, firstLineEnd).trim()
          description = description.substring(firstLineEnd + 1).trim()
        }
      }
      
      setInternalTitle(newTitle)

      // Convert markdown to rich text
      const paragraphs = description.split('\n\n').filter(p => p.trim())
      const newBody: Descendant[] = paragraphs.length > 0
        ? paragraphs.map(p => ({
            type: 'paragraph',
            children: [{ text: p.trim() }]
          } as unknown as Descendant))
        : [{ type: 'paragraph', children: [{ text: '' }] }] as unknown as Descendant[]
      setInternalBody(newBody)

      // Convert transactions to actions
      const transactions: Transaction[] = proposal.transactions.map(tx => ({
        target: tx.to,
        value: tx.value.toString(),
        signature: tx.signature,
        calldata: tx.calldata,
      }))

      const newActions = transactionsToActions(transactions, CHAIN_CONFIG.chain.id)
      setInternalActions(newActions)
    }
  }, [mode, proposal, address, actualProposalId, addToast, navigate])

  // Log simulation errors for debugging
  useEffect(() => {
    if (simulationError) {
      console.error('[ProposalEditor] Simulation error:', simulationError)
    }
  }, [simulationError])

  // Handle title change - use direct handlers to avoid instability
  const handleTitleChange = useCallback((newValue: string) => {
    if (mode === 'edit') {
      setInternalTitle(newValue)
    } else {
      onTitleChange(newValue)
    }
  }, [mode, onTitleChange])

  // Auto-resize title textarea when content changes
  useEffect(() => {
    const textarea = titleTextareaRef.current
    if (textarea) {
      // Use requestAnimationFrame to defer resize until after React's render cycle
      const rafId = requestAnimationFrame(() => {
        if (textarea) {
          textarea.style.height = 'auto'
          textarea.style.height = `${textarea.scrollHeight}px`
        }
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [currentTitle])

  // Handle body change - use direct handlers to avoid instability
  const handleBodyChange = useCallback((newValue: Descendant[]) => {
    if (mode === 'edit') {
      setInternalBody(newValue)
    } else {
      onBodyChange(newValue)
    }
  }, [mode, onBodyChange])

  // Handle actions change - use direct handlers to avoid instability
  const handleActionsChange = useCallback((newActions: Action[]) => {
    if (mode === 'edit') {
      setInternalActions(newActions)
    } else {
      onActionsChange(newActions)
    }
  }, [mode, onActionsChange])

  const currentMarkdown = messageUtils.descendantsToMarkdown(currentBody as any)

  // Block comments follow their block's text, so moving, adding or removing blocks
  // keeps them on the right block. The stored index is the fallback once the text changes.
  const blockCommentIndex = useMemo(() => {
    const placed = new Map<string, number>()
    if (!activeShared) return placed
    const excerpts = currentBody.map((block) => blockExcerpt(block))
    const closest = (stored: number, matches: (excerpt: string) => boolean) => {
      let best = -1
      excerpts.forEach((excerpt, index) => {
        if (!matches(excerpt)) return
        if (best < 0 || Math.abs(index - stored) < Math.abs(best - stored)) best = index
      })
      return best
    }
    for (const comment of activeShared.comments) {
      if (comment.target !== 'block') continue
      const stored = comment.blockIndex ?? -1
      const want = comment.blockExcerpt.trim()
      let index = want ? closest(stored, (excerpt) => excerpt === want) : -1
      if (index < 0 && want.length >= 24) {
        const head = want.slice(0, 24)
        index = closest(stored, (excerpt) => excerpt.startsWith(head))
      }
      if (index < 0 && stored >= 0 && stored < excerpts.length) index = stored
      if (index >= 0) placed.set(comment.id, index)
    }
    return placed
  }, [activeShared, currentBody])
  const visibleDrafts = drafts.filter((draft) => draft.contentType === contentType)
  const visibleShared = sharedProposals.filter((proposal) => proposal.contentType === contentType)
  const activeDraft = visibleDrafts.find((draft) => draft.id === activeDraftId) ?? null
  const draftSignature = JSON.stringify({
    title: currentTitle,
    bodyMarkdown: currentMarkdown,
    actions: currentActions,
  })
  const activeDraftSignature = activeDraft
    ? JSON.stringify({
        title: activeDraft.title,
        bodyMarkdown: activeDraft.bodyMarkdown,
        actions: activeDraft.actions,
      })
    : null
  const draftDirty = activeDraft ? draftSignature !== activeDraftSignature : false
  const editorHasWork = currentTitle.trim().length > 0 || currentMarkdown.trim().length > 0 || currentActions.length > 0
  const [savedBaseline, setSavedBaseline] = useState<string | null>(null)
  const allowLeaveRef = useRef(false)
  const matchesSavedDraft = activeDraftSignature !== null && activeDraftSignature === draftSignature
  const matchesOpenedDraft = savedBaseline !== null && savedBaseline === draftSignature
  const unsavedChanges = editorHasWork && savedBaseline !== null && !matchesSavedDraft && !matchesOpenedDraft

  useEffect(() => {
    if (!enableDrafts) return
    const match = loadEditorDrafts().find((draft) => {
      if (draft.contentType !== contentType) return false
      return JSON.stringify({
        title: draft.title,
        bodyMarkdown: draft.bodyMarkdown,
        actions: draft.actions,
      }) === draftSignature
    })
    if (match) setActiveDraftId(match.id)
    // Match the editor contents once, when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!openedShared) return
    setActiveShared(openedShared)
    setActiveDraftId(openedShared.id)
    setSharedReady(true)
    handleTitleChange(openedShared.title)
    handleBodyChange(markdownToDescendants(openedShared.bodyMarkdown))
    handleActionsChange(openedShared.actions)
    // Apply the signed-in draft once. Later edits stay in the editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedShared?.id])

  useEffect(() => {
    if (!draftJustSaved) return
    const timeout = window.setTimeout(() => setDraftJustSaved(false), 1500)
    return () => window.clearTimeout(timeout)
  }, [draftJustSaved])

  useEffect(() => {
    if (savedBaseline !== null) return
    if (mode === 'edit') {
      const loaded = actualProposalId ? Boolean(proposal) : Boolean(candidate)
      if (!loaded || !editorHasWork) return
    }
    setSavedBaseline(draftSignature)
  }, [savedBaseline, mode, draftSignature, actualProposalId, proposal, candidate, editorHasWork])

  useEffect(() => {
    if (!unsavedChanges) return
    const leaveMessage = 'Leave this page? Save the proposal first if you want to keep what you wrote.'
    const mark = { ...(window.history.state || {}), lilnounsDraftGuard: true }
    window.history.pushState(mark, '', window.location.href)

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowLeaveRef.current) return
      event.preventDefault()
      event.returnValue = leaveMessage
    }
    const onPopState = () => {
      if (allowLeaveRef.current) return
      if (window.confirm(leaveMessage)) {
        allowLeaveRef.current = true
        window.history.back()
        return
      }
      window.history.pushState(mark, '', window.location.href)
    }
    const onClick = (event: MouseEvent) => {
      if (allowLeaveRef.current || event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest('a')
      if (!anchor || anchor.getAttribute('target') === '_blank') return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return
      let url: URL
      try {
        url = new URL(anchor.href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      const path = url.pathname
      if (path === window.location.pathname || path.startsWith('/new') || path.startsWith('/update/')) return
      if (window.confirm(leaveMessage)) {
        allowLeaveRef.current = true
        return
      }
      event.preventDefault()
      event.stopPropagation()
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('popstate', onPopState)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('popstate', onPopState)
      document.removeEventListener('click', onClick, true)
    }
  }, [unsavedChanges])

  useEffect(() => {
    if (!enableDrafts || !address || !readSavedProposalSession(address)) {
      setSharedProposals([])
      setSharedReady(false)
      setActiveShared(null)
      return
    }
    let cancelled = false
    listSavedProposals(address)
      .then((result) => {
        if (cancelled) return
        setSharedProposals(result.proposals)
        setSharedReady(true)
      })
      .catch(() => {
        if (cancelled) return
        setSharedProposals([])
        setSharedReady(false)
      })
    return () => {
      cancelled = true
    }
  }, [address, enableDrafts])

  useEffect(() => {
    if (!address || !sharedReady || !activeDraftId || activeShared?.id === activeDraftId) return
    if (!sharedProposals.some((item) => item.id === activeDraftId)) return
    let cancelled = false
    getSavedProposal(activeDraftId, address)
      .then(({ proposal }) => {
        if (!cancelled) setActiveShared(proposal)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [address, sharedReady, activeDraftId, activeShared?.id, sharedProposals])

  const unlockShared = async () => {
    if (!address) return
    setUnlocking(true)
    try {
      const digest = await sha256Hex('read')
      const timestamp = Date.now()
      const signature = await signMessageAsync({
        message: signableMessage('read', '*', digest, timestamp),
      })
      await openSavedProposalSession({ digest, signature, address, timestamp })
      const list = await listSavedProposals(address)
      setSharedProposals(list.proposals)
      setSharedReady(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not open shared proposals.'
      const declined = /reject|denied|cancel/i.test(message)
      addToast?.({
        content: declined ? 'The wallet declined the signature.' : message,
        type: ToastType.Failure,
      })
    } finally {
      setUnlocking(false)
    }
  }

  const publishDraft = async (draft: EditorDraft): Promise<SavedProposal | null> => {
    if (!address) {
      addToast?.({
        content: 'Saved on this browser. Connect a wallet to share it.',
        type: ToastType.Success,
      })
      return null
    }
    const sharedRole = activeShared && activeShared.id === draft.id
      ? activeShared.authorAddress.toLowerCase() === address.toLowerCase()
        ? 'author'
        : (activeShared.collaborators || []).find((person) => person.address.toLowerCase() === address.toLowerCase())?.role === 'edit'
          ? 'edit'
          : 'comment'
      : null
    if (sharedRole === 'comment') {
      addToast?.({
        content: 'Saved on this browser. You can view and comment on this draft. You cannot edit it.',
        type: ToastType.Failure,
      })
      return null
    }
    setSharing(true)
    setAwaitingWallet(true)
    try {
      // Shared drafts carry IPFS links, never images that only exist in this browser.
      draft = { ...draft, bodyMarkdown: await uploadLocalImages(draft.bodyMarkdown, imageSigner) }
      const digest = await sha256Hex(proposalCanonical(draft))
      const exists = sharedProposals.some((item) => item.id === draft.id) || activeShared?.id === draft.id
      const send = async (action: 'create' | 'update') => {
        const timestamp = Date.now()
        const signature = await new Promise<string>((resolve, reject) => {
          const timer = window.setTimeout(() => reject(new Error('The wallet did not respond. Try Save again.')), 20000)
          signMessageAsync({
            message: signableMessage(action, draft.id, digest, timestamp),
          }).then(
            (value) => {
              window.clearTimeout(timer)
              resolve(value)
            },
            (error) => {
              window.clearTimeout(timer)
              reject(error)
            },
          )
        })
        setAwaitingWallet(false)
        const payload = { ...draft, digest, signature, address, timestamp }
        return action === 'create'
          ? (await createSavedProposal(payload)).proposal
          : (await updateSavedProposal(draft.id, payload)).proposal
      }
      let proposal: SavedProposal
      try {
        proposal = await send(exists ? 'update' : 'create')
      } catch (error) {
        if (!exists && error instanceof Error && error.message.includes('already exists')) {
          proposal = await send('update')
        } else {
          throw error
        }
      }
      setActiveShared(proposal)
      const list = await listSavedProposals(address)
      setSharedProposals(list.proposals)
      setSharedReady(true)
      addToast?.({
        content: `Shared as ${personLabel(proposal.updatedByEns, proposal.updatedByAddress)}. Add people in the sidebar.`,
        type: ToastType.Success,
      })
      return proposal
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not share this proposal.'
      const declined = /reject|denied|cancel/i.test(message)
      addToast?.({
        content: declined
          ? 'Saved on this browser. The wallet declined the signature.'
          : `Saved on this browser. ${message}`,
        type: ToastType.Failure,
      })
      return null
    } finally {
      setAwaitingWallet(false)
      setSharing(false)
    }
  }

  const persistDraft = (id: string, createdAt: number) => {
    if (!enableDrafts) return
    if (!editorHasWork) {
      addToast?.({
        content: 'Add a title, description, or action before saving.',
        type: ToastType.Failure,
      })
      return
    }
    const now = Date.now()
    const draft: EditorDraft = {
      id,
      title: currentTitle,
      bodyMarkdown: currentMarkdown,
      actions: currentActions,
      contentType,
      createdAt,
      updatedAt: now,
    }
    try {
      setDrafts(upsertEditorDraft(draft))
      setActiveDraftId(id)
      setDraftJustSaved(true)
    } catch {
      addToast?.({
        content: 'Could not save on this browser. This browser’s storage is full.',
        type: ToastType.Failure,
      })
    }
    void publishDraft(draft)
  }

  const saveDraft = () => {
    if (activeDraft) {
      persistDraft(activeDraft.id, activeDraft.createdAt)
      return
    }
    if (activeShared) {
      persistDraft(activeShared.id, activeShared.createdAt)
      return
    }
    persistDraft(newEditorDraftId(), Date.now())
  }

  const saveDraftAsNew = () => {
    persistDraft(newEditorDraftId(), Date.now())
  }

  const openDraft = (draft: EditorDraft) => {
    if (draft.id === activeDraftId && !draftDirty) return
    const openingDifferentWork = activeDraft
      ? draftDirty
      : editorHasWork && draftSignature !== JSON.stringify({
          title: draft.title,
          bodyMarkdown: draft.bodyMarkdown,
          actions: draft.actions,
        })
    if (openingDifferentWork && !window.confirm('Open this saved proposal and replace what is in the editor?')) {
      return
    }
    handleTitleChange(draft.title)
    handleBodyChange(markdownToDescendants(draft.bodyMarkdown))
    handleActionsChange(draft.actions)
    setActiveDraftId(draft.id)
    setActiveShared(null)
  }

  const startNewDraft = () => {
    if (!editorHasWork && !activeDraft && !activeShared) return
    if (unsavedChanges && !window.confirm('Start a new proposal? Save this one first if you want to keep what you wrote.')) {
      return
    }
    const emptyBody = [createEmptyParagraphElement()] as Descendant[]
    handleTitleChange('')
    handleBodyChange(emptyBody)
    handleActionsChange([])
    setActiveDraftId(null)
    setActiveShared(null)
    setInlineTarget(null)
    setAttached(null)
    setProposalComment('')
    setSavedBaseline(JSON.stringify({
      title: '',
      bodyMarkdown: messageUtils.descendantsToMarkdown(emptyBody as any),
      actions: [],
    }))
  }

  const openSharedProposal = async (id: string) => {
    if (activeShared?.id === id && !draftDirty) return
    const openingDifferentWork = editorHasWork && activeShared?.id !== id
    if (openingDifferentWork && !window.confirm('Open this shared proposal and replace what is in the editor?')) {
      return
    }
    if (!address) {
      addToast?.({
        content: 'Connect a wallet and sign in to open a shared proposal.',
        type: ToastType.Failure,
      })
      return
    }
    try {
      const { proposal } = await getSavedProposal(id, address)
      handleTitleChange(proposal.title)
      handleBodyChange(markdownToDescendants(proposal.bodyMarkdown))
      handleActionsChange(proposal.actions)
      setActiveDraftId(proposal.id)
      setActiveShared(proposal)
      setInlineTarget(null)
      setAttached(null)
      setDrafts(upsertEditorDraft({
        id: proposal.id,
        title: proposal.title,
        bodyMarkdown: proposal.bodyMarkdown,
        actions: proposal.actions,
        contentType: proposal.contentType,
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt,
      }))
    } catch (error) {
      addToast?.({
        content: error instanceof Error ? error.message : 'Could not open that proposal.',
        type: ToastType.Failure,
      })
    }
  }

  const showDiscussionError = (error: unknown, fallback: string) => {
    const message = error instanceof Error ? error.message : fallback
    const declined = /reject|denied|cancel/i.test(message)
    addToast?.({
      content: declined ? 'The wallet declined the signature.' : message,
      type: ToastType.Failure,
    })
  }

  const rememberShared = async (proposal: SavedProposal, syncActions = false) => {
    setActiveShared(proposal)
    if (syncActions) handleActionsChange(proposal.actions)
    if (!address) return
    const list = await listSavedProposals(address)
    setSharedProposals(list.proposals)
    setSharedReady(true)
  }

  const submitComment = async (owner: 'proposal' | 'inline') => {
    if (!activeShared || !address) {
      addToast?.({ content: 'Connect a wallet to comment.', type: ToastType.Failure })
      return
    }
    const text = (owner === 'proposal' ? proposalComment : inlineComment).trim()
    const requested = attached?.owner === owner ? attached.action : null
    const target = owner === 'proposal' ? 'proposal' : inlineTarget?.target
    if (!target || (!text && !requested)) return
    const fields = {
      text,
      target,
      blockIndex: owner === 'inline' && target === 'block' ? inlineTarget?.blockIndex ?? null : null,
      blockExcerpt: owner === 'inline' ? (inlineTarget?.excerpt || '').slice(0, 180) : '',
      actionIndex: owner === 'inline' && target === 'ask' ? inlineTarget?.actionIndex ?? null : null,
      action: requested,
    }
    setDiscussionBusy(owner)
    try {
      const digest = await sha256Hex(commentCanonical(fields))
      const timestamp = Date.now()
      const signature = await signMessageAsync({
        message: signableMessage('comment', activeShared.id, digest, timestamp),
      })
      const { proposal } = await addSavedProposalComment(activeShared.id, {
        ...fields,
        digest,
        signature,
        address,
        timestamp,
      })
      await rememberShared(proposal)
      if (owner === 'proposal') setProposalComment('')
      else setInlineComment('')
      if (attached?.owner === owner) setAttached(null)
    } catch (error) {
      showDiscussionError(error, 'Could not post that comment.')
    } finally {
      setDiscussionBusy(null)
    }
  }

  const replyToComment = async (comment: SavedProposalComment) => {
    if (!activeShared || !address) return
    const text = (replyDrafts[comment.id] || '').trim()
    if (!text) return
    setDiscussionBusy(comment.id)
    try {
      const digest = await sha256Hex(replyCanonical(comment.id, text))
      const timestamp = Date.now()
      const signature = await signMessageAsync({
        message: signableMessage('reply', activeShared.id, digest, timestamp),
      })
      const { proposal } = await replyToSavedProposalComment(activeShared.id, comment.id, {
        text,
        digest,
        signature,
        address,
        timestamp,
      })
      await rememberShared(proposal)
      setReplyDrafts((current) => ({ ...current, [comment.id]: '' }))
    } catch (error) {
      showDiscussionError(error, 'Could not post that reply.')
    } finally {
      setDiscussionBusy(null)
    }
  }

  const decideComment = async (
    comment: SavedProposalComment,
    decision: 'add' | 'update' | 'reject',
    action: Action | null,
  ) => {
    if (!activeShared || !address) return
    const fields = { commentId: comment.id, decision, action, note: '' }
    setDiscussionBusy(comment.id)
    try {
      const digest = await sha256Hex(decisionCanonical(fields))
      const timestamp = Date.now()
      const signature = await signMessageAsync({
        message: signableMessage('decide', activeShared.id, digest, timestamp),
      })
      const { proposal } = await decideSavedProposalComment(activeShared.id, comment.id, {
        ...fields,
        digest,
        signature,
        address,
        timestamp,
      })
      await rememberShared(proposal, true)
    } catch (error) {
      showDiscussionError(error, 'Could not update that request.')
    } finally {
      setDiscussionBusy(null)
    }
  }

  const copySharedLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/draft/${id}`)
      addToast?.({ content: 'Link copied.', type: ToastType.Success })
    } catch {
      addToast?.({ content: 'Could not copy the link.', type: ToastType.Failure })
    }
  }

  const grantPerson = async (person: string, role: SavedProposalAccess) => {
    const who = person.trim()
    if (!address || !who) return
    setDiscussionBusy('invite')
    try {
      let shared = activeShared && (!activeDraft || activeShared.id === activeDraft.id) ? activeShared : null
      if (!shared) {
        if (!editorHasWork) {
          addToast?.({
            content: 'Add a title, description, or action before sharing.',
            type: ToastType.Failure,
          })
          return
        }
        const draft: EditorDraft = {
          id: activeDraft?.id || newEditorDraftId(),
          title: currentTitle,
          bodyMarkdown: currentMarkdown,
          actions: currentActions,
          contentType,
          createdAt: activeDraft?.createdAt || Date.now(),
          updatedAt: Date.now(),
        }
        setDrafts(upsertEditorDraft(draft))
        setActiveDraftId(draft.id)
        shared = await publishDraft(draft)
        if (!shared) return
      }
      if (shared.authorAddress.toLowerCase() !== address.toLowerCase()) {
        addToast?.({
          content: 'Only the author can change who has access.',
          type: ToastType.Failure,
        })
        return
      }
      const digest = await sha256Hex(inviteKey(who))
      const timestamp = Date.now()
      const signature = await signMessageAsync({
        message: signableMessage('invite', shared.id, digest, timestamp),
      })
      const { proposal } = await addSavedProposalCollaborator(shared.id, {
        person: who,
        role,
        digest,
        signature,
        address,
        timestamp,
      })
      await rememberShared(proposal)
      if (who.toLowerCase() === personInput.trim().toLowerCase()) setPersonInput('')
    } catch (error) {
      showDiscussionError(error, 'Could not update that person.')
    } finally {
      setDiscussionBusy(null)
    }
  }

  const uninvitePerson = async (personAddress: string) => {
    if (!activeShared || !address) return
    setDiscussionBusy(personAddress)
    try {
      const digest = await sha256Hex(inviteKey(personAddress))
      const timestamp = Date.now()
      const signature = await signMessageAsync({
        message: signableMessage('uninvite', activeShared.id, digest, timestamp),
      })
      const { proposal } = await removeSavedProposalCollaborator(activeShared.id, {
        person: personAddress,
        digest,
        signature,
        address,
        timestamp,
      })
      await rememberShared(proposal)
    } catch (error) {
      showDiscussionError(error, 'Could not remove that person.')
    } finally {
      setDiscussionBusy(null)
    }
  }

  const viewerAccess: 'author' | 'edit' | 'comment' | 'none' = !activeShared || !address
    ? 'author'
    : activeShared.authorAddress.toLowerCase() === address.toLowerCase()
      ? 'author'
      : (activeShared.collaborators || []).some((person) => person.address.toLowerCase() === address.toLowerCase() && person.role === 'edit')
        ? 'edit'
        : (activeShared.collaborators || []).some((person) => person.address.toLowerCase() === address.toLowerCase())
          ? 'comment'
          : 'none'
  const canChangeDraft = viewerAccess === 'author' || viewerAccess === 'edit'
  const canManagePeople = viewerAccess === 'author'
  const editorDisabled = disabled || !canChangeDraft

  const threadProps = {
    isEditor: canChangeDraft,
    replyDrafts,
    onReplyDraft: (id: string, text: string) => setReplyDrafts((current) => ({ ...current, [id]: text })),
    onReply: (comment: SavedProposalComment) => { void replyToComment(comment) },
    onAdd: (comment: SavedProposalComment) => { void decideComment(comment, 'add', comment.action) },
    onReject: (comment: SavedProposalComment) => { void decideComment(comment, 'reject', null) },
    onUpdate: (comment: SavedProposalComment) => {
      if (!comment.action) return
      setRequestDialog({ mode: 'update', commentId: comment.id, action: comment.action })
    },
    busyId: discussionBusy,
  }

  const removeSharedProposal = async (proposal: SavedProposalSummary) => {
    if (!address || address.toLowerCase() !== proposal.authorAddress.toLowerCase()) return
    const label = proposal.title.trim() || 'Untitled proposal'
    if (!window.confirm(`Remove “${label}” for everyone?`)) return
    try {
      const digest = await sha256Hex(proposal.id)
      const timestamp = Date.now()
      const signature = await signMessageAsync({
        message: signableMessage('delete', proposal.id, digest, timestamp),
      })
      await deleteSavedProposal(proposal.id, { digest, signature, address, timestamp })
      setSharedProposals((current) => current.filter((item) => item.id !== proposal.id))
      if (activeShared?.id === proposal.id) setActiveShared(null)
    } catch (error) {
      addToast?.({
        content: error instanceof Error ? error.message : 'Could not remove that proposal.',
        type: ToastType.Failure,
      })
    }
  }

  const deleteDraft = (draft: EditorDraft) => {
    const label = draft.title.trim() || 'Untitled proposal'
    if (!window.confirm(`Remove “${label}” from this browser?`)) return
    try {
      setDrafts(removeEditorDraft(draft.id))
      if (activeDraftId === draft.id) setActiveDraftId(null)
    } catch {
      addToast?.({
        content: 'Could not remove that saved proposal.',
        type: ToastType.Failure,
      })
    }
  }

  // Map action index to transaction indices
  // This is needed because one action can create multiple transactions (e.g., streaming payments)
  const actionToTransactionMap = useMemo(() => {
    const map: number[][] = []
    let transactionIndex = 0
    
    for (let i = 0; i < currentActions.length; i++) {
      const action = currentActions[i]
      if (!action) {
        map[i] = []
        continue
      }
      
      // Resolve ENS names in action before calling resolveAction
      const resolvedAction = withResolvedTargets(action)
      if (!resolvedAction) {
        // Skip if ENS name not resolved yet - will retry when resolved
        map[i] = []
        continue
      }
      
      try {
        const transactions = resolveAction(resolvedAction)
        map[i] = []
        for (let j = 0; j < transactions.length; j++) {
          map[i].push(transactionIndex++)
        }
      } catch (error) {
        console.error(`Error resolving action ${i}:`, error, resolvedAction)
        // Skip this action if resolution fails
        map[i] = []
      }
    }
    
    return map
  }, [currentActions, resolvedAddresses])

  /** The action with ENS targets swapped for their addresses, or null while a name is still resolving. */
  function withResolvedTargets(action: Action): Action | null {
    if (action.type === 'one-time-payment' || action.type === 'streaming-payment' || action.type === 'treasury-noun-transfer') {
      const target = action.target
      if (!target || isAddress(target)) return action
      return resolvedAddresses[target] ? { ...action, target: resolvedAddresses[target] as `0x${string}` } : null
    }
    if (action.type === 'custom-transaction') {
      const target = action.contractCallTarget
      if (!target || isAddress(target)) return action
      return resolvedAddresses[target] ? { ...action, contractCallTarget: resolvedAddresses[target] as `0x${string}` } : null
    }
    return action
  }

  /** An address with its known name, e.g. "Lil Nouns Payer (0xF623…)". */
  function addressOverrideLabel(address: string): string {
    const name = isAddress(address) ? getAddressOverrides(getAddress(address))?.name : undefined
    return name ? `${name} (${address})` : address
  }

  /**
   * The exact calls an action submits, as the executor will run them, or null
   * while an ENS target is still resolving (or the action is incomplete).
   */
  function submittedTransactions(action: Action): Transaction[] | null {
    const resolved = withResolvedTargets(action)
    if (!resolved) return null
    try {
      return resolveAction(resolved).map((tx) => ({ ...tx, calldata: normalizeCalldata(tx.signature, tx.calldata) }))
    } catch {
      return null
    }
  }

  // Helper to get simulation status for an action
  const getSimulationStatus = (actionIndex: number): 'idle' | 'simulating' | 'success' | 'error' => {
    if (!simulationResults || isSimulating) {
      return 'simulating'
    }

    const transactionIndices = actionToTransactionMap[actionIndex]
    if (!transactionIndices || transactionIndices.length === 0) {
      return 'idle'
    }

    // Check if all transactions for this action succeeded
    const allResults = transactionIndices.map(idx => simulationResults[idx])
    if (allResults.every(r => r && r.success)) {
      return 'success'
    }
    if (allResults.some(r => r && !r.success)) {
      return 'error'
    }

    return 'idle'
  }

  // Helper to get error message for an action
  const getSimulationError = (actionIndex: number): string | undefined => {
    if (!simulationResults) return undefined

    const transactionIndices = actionToTransactionMap[actionIndex]
    if (!transactionIndices) return undefined

    // Find first failed transaction
    for (const idx of transactionIndices) {
      const result = simulationResults[idx]
      if (result && !result.success && result.error) {
        return result.error
      }
    }

    return undefined
  }

  // Resolve ENS names for all action targets
  useEffect(() => {
    const resolveAllAddresses = async () => {
      const newResolvedAddresses: Record<string, string> = {}
      
      for (const action of currentActions) {
        let targetAddress: string | undefined
        
        switch (action.type) {
          case 'one-time-payment':
          case 'streaming-payment':
          case 'treasury-noun-transfer':
            targetAddress = action.target
            break
          case 'custom-transaction':
            targetAddress = action.contractCallTarget
            break
        }
        
        if (targetAddress && !isAddress(targetAddress)) {
          try {
            const resolved = await resolveEnsAddress(targetAddress)
            newResolvedAddresses[targetAddress] = resolved
          } catch (error) {
            console.warn(`Failed to resolve ENS name: ${targetAddress}`, error)
          }
        }
      }
      
      setResolvedAddresses(newResolvedAddresses)
    }
    
    if (currentActions.length > 0) {
      resolveAllAddresses()
    }
  }, [currentActions, resolveEnsAddress])

  const handleAddAction = () => {
    setEditingActionIndex(null)
    setIsActionDialogOpen(true)
  }

  const handleEditAction = (index: number) => {
    setEditingActionIndex(index)
    setIsActionDialogOpen(true)
  }

  const handleActionSubmit = (action: Action, topUp?: { action: PayerTopUpAction; replaces?: PayerTopUpAction }) => {
    const newActions = [...currentActions]
    if (editingActionIndex !== null) {
      // Update existing action
      newActions[editingActionIndex] = action
    } else {
      // Add new action
      newActions.push(action)
    }
    // A USDC ask the Payer can't cover comes with the top-up that funds it:
    // the proposal's existing top-up is resized, or a new one goes last
    if (topUp) {
      // The dialog names the exact top-up object to resize, so the right one changes
      const existing = topUp.replaces ? newActions.indexOf(topUp.replaces) : -1
      if (existing >= 0) {
        newActions[existing] = topUp.action
        setFundedTopUp({ action: topUp.action, previous: describeTopUp(topUp.replaces!) })
      } else {
        newActions.push(topUp.action)
        setFundedTopUp({ action: topUp.action })
      }
    }
    handleActionsChange(newActions)
    setIsActionDialogOpen(false)
    setEditingActionIndex(null)
  }

  const formatUsdc = (amount: bigint) =>
    Number(formatUnits(amount, 6)).toLocaleString(undefined, { maximumFractionDigits: 2 })

  const describeTopUp = (topUp: PayerTopUpAction) => `${topUp.amount} ${topUp.currency === 'eth' ? 'ETH' : 'stETH'}`

  // The whole proposal's USDC against the Payer, whichever way actions arrived
  // (added, imported, pasted or loaded): if it creates debt nothing funds, offer
  // the top-up that does
  const proposalUsdc = usdcRequested(currentActions)
  const { data: proposalPayerStatus } = useQuery({
    queryKey: ['payer-status', proposalUsdc.toString()],
    queryFn: () => getPayerStatus(proposalUsdc, 500n),
    enabled: proposalUsdc > 0n && payerFundingAvailable(),
    staleTime: 30_000,
  })
  const proposalTopUpPlan = proposalPayerStatus ? planTopUp(proposalPayerStatus, currentActions) : undefined

  const applyProposalTopUp = () => {
    if (proposalTopUpPlan?.kind !== 'add') return
    handleActionsChange(applyTopUp(currentActions, proposalTopUpPlan))
    setFundedTopUp({
      action: proposalTopUpPlan.topUp,
      previous: proposalTopUpPlan.previous ? describeTopUp(proposalTopUpPlan.previous) : undefined,
    })
  }

  const handleBulkActionSubmit = (importedActions: Action[]) => {
    // Add all imported actions to existing actions
    handleActionsChange([...currentActions, ...importedActions])
    setIsActionDialogOpen(false)
    setEditingActionIndex(null)
  }

  const handleActionDelete = () => {
    if (editingActionIndex !== null) {
      const newActions = currentActions.filter((_, i) => i !== editingActionIndex)
      handleActionsChange(newActions)
      setEditingActionIndex(null)
    }
  }

  const handleSubmissionDialogSubmit = (submissionType: 'proposal' | 'candidate' | 'topic') => {
    if (mode === 'edit') {
      // Handle edit mode submission
      handleEditSubmit()
    } else {
      // Handle create mode submission
    onSubmit?.(submissionType)
  }
  }

  const handleEditSubmit = async () => {
    if (!address) return

    if (!updateReason.trim()) {
      addToast?.({
        content: 'Please provide a reason for the update.',
        type: ToastType.Failure,
      })
      return
    }

    try {
      // Convert body (Descendant[]) to markdown string
      const bodyMarkdown = await uploadLocalImages(messageUtils.descendantsToMarkdown(currentBody as any), imageSigner)

      if (actualProposalId && proposal) {
        // Update proposal
        const finalTitle = currentTitle || proposal.title
        await updateProposal(
          proposal,
          finalTitle,
          bodyMarkdown,
          currentActions,
          updateReason,
        )
      } else if (candidate) {
      // Update candidate
        const finalTitle = currentTitle || candidate.latestVersion.content.title
      await updateCandidate(
        candidate,
        finalTitle,
        bodyMarkdown,
        currentActions,
        updateReason,
      )
      }
    } catch (error) {
      console.error('Failed to update:', error)
      addToast?.({
        content: `Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: ToastType.Failure,
      })
    }
  }

  // Handle successful update
  useEffect(() => {
    if (mode === 'edit' && updateState === 'success' && updateReceipt) {
      if (actualProposalId && proposal) {
        addToast?.({
          content: 'Proposal updated successfully!',
          type: ToastType.Success,
        })
        allowLeaveRef.current = true
        navigate(`/vote/${actualProposalId}`)
      } else if (candidate) {
      addToast?.({
        content: 'Candidate updated successfully!',
        type: ToastType.Success,
      })
      allowLeaveRef.current = true
      navigate(`/candidates/${actualCandidateId}`)
    }
    }
  }, [mode, updateState, updateReceipt, candidate, proposal, actualCandidateId, actualProposalId, addToast, navigate])

  const toggleActionExpanded = (index: number) => {
    const newExpanded = new Set(expandedActions)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedActions(newExpanded)
  }

  const getActionSummary = (action: Action): string => {
    try {
      switch (action.type) {
        case 'one-time-payment':
          if (!action.target || !action.amount) return 'Invalid payment action'
          // USDC is paid by the Payer: sent now if it holds enough, otherwise registered as debt
          if (action.currency === 'usdc') {
            return `Pay ${action.amount} USDC to ${action.target.slice(0, 6)}...${action.target.slice(-4)} through the Payer (sendOrRegisterDebt)`
          }
          return `Transfer ${action.amount} ${action.currency?.toUpperCase() || 'ETH'} to ${action.target.slice(0, 6)}...${action.target.slice(-4)}`
        case 'streaming-payment':
          if (!action.target || !action.amount) return 'Invalid streaming payment action'
          return `Stream ${action.amount} ${action.currency?.toUpperCase() || 'ETH'} to ${action.target.slice(0, 6)}...${action.target.slice(-4)}`
        case 'custom-transaction':
          if (!action.contractCallTarget || !action.contractCallSignature) return 'Invalid custom transaction'
          return `Call ${action.contractCallSignature} on ${action.contractCallTarget.slice(0, 6)}...${action.contractCallTarget.slice(-4)}`
        case 'treasury-noun-transfer':
          if (!action.target || !action.nounId) return 'Invalid noun transfer action'
          return `Transfer Noun #${action.nounId} to ${action.target.slice(0, 6)}...${action.target.slice(-4)}`
        case 'payer-top-up':
          if (!action.amount) return 'Invalid payer top-up'
          return `Top up the Payer: send ${action.amount} ${action.currency === 'eth' ? 'ETH' : 'stETH'} to the TokenBuyer`
        default:
          return 'Unknown action'
      }
    } catch (error) {
      console.error('Error generating action summary:', error, action)
      return 'Error displaying action'
    }
  }

  const getActionDetails = (action: Action): { target?: string; value?: string; originalTarget?: string } => {
    try {
      switch (action.type) {
        case 'one-time-payment':
          if (!action.target || !action.amount) {
            return { target: action.target || '', originalTarget: action.target || '', value: '0' }
          }
          if (action.currency === 'usdc') {
            const payer = CHAIN_CONFIG.addresses.lilNounsPayer
            return {
              target: payer,
              originalTarget: payer,
              value: `0 // sendOrRegisterDebt(${action.target}, ${parseUnits(action.amount, 6).toString()}) = ${action.amount} USDC`,
            }
          }
          try {
            // Parse decimal amount to wei/smallest unit
            const parsedValue = action.currency === 'eth'
              ? parseEther(action.amount)
              : parseUnits(action.amount, 18) // WETH, stETH, rETH and OETH have 18 decimals
            return {
              target: action.target,
              originalTarget: action.target,
              value: `${parsedValue.toString()} // ${action.amount} ${action.currency?.toUpperCase() || 'ETH'}`,
            }
          } catch (error) {
            // Fallback if parsing fails
            return {
              target: action.target,
              originalTarget: action.target,
              value: `0 // ${action.amount} ${action.currency?.toUpperCase() || 'ETH'} (parse error)`,
            }
          }
        case 'streaming-payment':
          if (!action.target || !action.amount) {
            return { target: action.target || '', originalTarget: action.target || '', value: '0' }
          }
          try {
            // Parse decimal amount to wei/smallest unit
            const parsedValue = action.currency === 'usdc'
              ? parseUnits(action.amount, 6) // USDC has 6 decimals
              : parseUnits(action.amount, 18) // WETH and others have 18 decimals
            return {
              target: action.target,
              originalTarget: action.target,
              value: `${parsedValue.toString()} // ${action.amount} ${action.currency?.toUpperCase() || 'WETH'}`,
            }
          } catch (error) {
            // Fallback if parsing fails
            return {
              target: action.target,
              originalTarget: action.target,
              value: `0 // ${action.amount} ${action.currency?.toUpperCase() || 'WETH'} (parse error)`,
            }
          }
        case 'custom-transaction':
          return {
            target: action.contractCallTarget || '',
            originalTarget: action.contractCallTarget || '',
            value: action.contractCallValue || '0',
          }
        case 'treasury-noun-transfer':
          return {
            target: action.target || '',
            originalTarget: action.target || '',
            value: '0',
          }
        case 'payer-top-up': {
          const tokenBuyer = CHAIN_CONFIG.addresses.lilNounsTokenBuyer
          const amount = action.amount ? parseEther(action.amount).toString() : '0'
          // stETH goes by a transfer on the stETH contract; ETH is sent straight to the TokenBuyer
          return action.currency === 'eth'
            ? { target: tokenBuyer, originalTarget: tokenBuyer, value: `${amount} // ${action.amount} ETH` }
            : { target: tokenBuyer, originalTarget: tokenBuyer, value: `0 // ${action.amount} stETH by stETH transfer` }
        }
        default:
          return {}
      }
    } catch (error) {
      console.error('Error getting action details:', error, action)
      return { target: '', value: '0' }
    }
  }

  const pasteProposalFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const result = parsePastedProposal(text)
      if (!result.success) {
        addToast?.({
          content: result.errors.join(' '),
          type: ToastType.Failure,
        })
        return
      }
      if (result.proposal.title) handleTitleChange(result.proposal.title)
      if (result.proposal.body) handleBodyChange(result.proposal.body)
      if (result.proposal.actions) handleActionsChange(result.proposal.actions)
      setPastedProposal(true)
      setTimeout(() => setPastedProposal(false), 2000)
      addToast?.({
        content: 'Pasted the proposal into the editor.',
        type: ToastType.Success,
      })
    } catch (err) {
      console.error('Failed to paste proposal from clipboard:', err)
      addToast?.({
        content: 'Could not read the clipboard. Allow clipboard access and try again.',
        type: ToastType.Failure,
      })
    }
  }

  const copyActionsToClipboard = async () => {
    try {
      const actionsJson = JSON.stringify(currentActions, null, 2)
      await navigator.clipboard.writeText(actionsJson)
      setCopiedActions(true)
      setTimeout(() => {
        setCopiedActions(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy actions to clipboard:', err)
      alert('Failed to copy to clipboard. Please try again.')
    }
  }

  // Check if body has content
  const bodyHasContent = currentBody.some((node: any) => {
    if (node?.type === 'image' && node.url) return true
    const text = Node.string(node)
    return text.trim().length > 0
  })

  // Check if any simulations failed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hasFailedSimulations = useMemo(() => {
    if (!simulationResults) return false
    return simulationResults.some(r => !r.success)
  }, [simulationResults])

  // Check if form is valid for submission
  // Topics don't require actions, proposals and candidates do
  // NOTE: Simulation checks temporarily disabled - submission allowed even if simulations fail
  const isFormValid = contentType === 'topic'
    ? currentTitle.trim().length > 0 && bodyHasContent
    : currentTitle.trim().length > 0 &&
      bodyHasContent && 
      currentActions.length >= 1
      // Temporarily removed: !hasFailedSimulations && !isSimulating

  // Render edit mode header
  const editHeader = mode === 'edit' ? (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <h1 className="heading-2">
          {actualProposalId ? 'Edit Proposal' : 'Edit Candidate'}
        </h1>
        <Button 
          variant="secondary" 
          onClick={() => {
            if (unsavedChanges && !window.confirm('Leave this page? Save the proposal first if you want to keep what you wrote.')) {
              return
            }
            allowLeaveRef.current = true
            if (actualProposalId) {
              navigate(`/vote/${actualProposalId}`)
            } else if (actualCandidateId) {
              navigate(`/candidates/${actualCandidateId}`)
            }
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  ) : null

  // Render sidebar content
  const sidebarContent = (
    <div className="py-5">
        {/* Actions List - Nouns Camp Style */}
        {/* Hide actions section for topics */}
        {contentType !== 'topic' && currentActions.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="uppercase text-sm font-semibold text-gray-500">
              Actions
            </h2>
              <button
                onClick={copyActionsToClipboard}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                title="Copy actions to clipboard"
                disabled={copiedActions}
              >
                <Copy className="w-3 h-3" />
                {copiedActions ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <ol className="p-0 m-0 pl-6 list-decimal">
              {currentActions.map((action, index) => {
                if (!action) {
                  console.error('Invalid action at index', index)
                  return null
                }
                
                const details = getActionDetails(action)
                const isExpanded = expandedActions.has(index)

                const funded = fundedTopUp?.action === action

                return (
                  <li
                    key={index}
                    className={cn(
                      index > 0 && 'mt-6',
                      funded && '-ml-2 rounded-lg border border-amber-300 bg-amber-50 py-2 pl-2 pr-2',
                    )}
                  >
                    {/* Action Summary */}
                    <div className="text-gray-500 text-sm font-normal">
                      {getActionSummary(action)}
                    </div>
                    {funded && (
                      <div className="mt-1 text-xs font-medium text-amber-900">
                        {fundedTopUp.previous
                          ? `Changed from ${fundedTopUp.previous} to fund the proposal's USDC ask.`
                          : "Added to fund the proposal's USDC ask, which the Payer can't cover yet."}
                      </div>
                    )}

                    {/* Action Controls */}
                    <div className="mt-1.5 flex gap-2">
                      <Button
                        variant="secondary"
                        size="fit"
                        onClick={() => handleEditAction(index)}
                        disabled={editorDisabled}
                        className="h-auto px-2 py-0.5 text-xs bg-white/50 border border-gray-200 text-gray-700"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="fit"
                        onClick={() => toggleActionExpanded(index)}
                        className="h-auto px-2 py-0.5 text-xs bg-white/50 border border-gray-200 text-gray-700"
                      >
                        {isExpanded ? 'Hide' : 'Show'} transaction
                        {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                      </Button>
                      {activeShared && (
                        <button
                          type="button"
                          className="h-auto px-2 py-0.5 text-xs text-gray-500 hover:text-gray-800"
                          onClick={() => {
                            setInlineTarget({
                              target: 'ask',
                              blockIndex: null,
                              actionIndex: index,
                              excerpt: getActionSummary(action),
                            })
                            setInlineComment('')
                          }}
                        >
                          Comment
                        </button>
                      )}
                    </div>
                    {activeShared && (
                      <DraftThread
                        {...threadProps}
                        comments={activeShared.comments.filter((comment) => comment.target === 'ask' && comment.actionIndex === index)}
                      />
                    )}
                    {activeShared && inlineTarget?.target === 'ask' && inlineTarget.actionIndex === index && (
                      <DraftComposer
                        label="Commenting on this action"
                        text={inlineComment}
                        onText={setInlineComment}
                        attached={attached?.owner === 'inline' ? attached.action : null}
                        onAttach={() => setRequestDialog({ mode: 'attach', owner: 'inline' })}
                        onClearAttached={() => setAttached(null)}
                        onSubmit={() => { void submitComment('inline') }}
                        busy={discussionBusy === 'inline'}
                      />
                    )}

                    {/* Expanded Transaction Details */}
                    {isExpanded && details.target && (
                      <div className="mt-3">
                        <div className="list-none pl-6 relative">
                          <div className="absolute -left-4 h-7 w-3 border-l border-b border-gray-200 rounded-bl-sm" />
                          <div className="bg-gray-50 p-3 rounded-lg font-mono text-xs relative">
                            {(() => {
                              // The exact calls this action submits, so what's shown is what executes
                              const txs = submittedTransactions(action)
                              if (!txs) {
                                return (
                                  <>
                                    <div className="flex items-start mb-2">
                                      <span className="text-gray-500 mr-2 flex-shrink-0">target:</span>
                                      <span className="break-all flex-1">{details.target || details.originalTarget || 'N/A'}</span>
                                    </div>
                                    <div className="text-gray-500 font-sans">
                                      {withResolvedTargets(action)
                                        ? 'This action is incomplete, so its exact call can’t be built yet.'
                                        : 'Resolving the ENS name to build the exact call…'}
                                    </div>
                                  </>
                                )
                              }
                              return txs.map((tx, t) => (
                                <div key={t} className={t > 0 ? 'mt-3 border-t border-gray-200 pt-3' : ''}>
                                  {[
                                    ['target', addressOverrideLabel(tx.target)],
                                    ['value', BigInt(tx.value) > 0n ? `${tx.value} (${formatEther(BigInt(tx.value))} ETH)` : '0'],
                                    ['signature', tx.signature || '(none — plain ETH send)'],
                                    ['calldata', tx.calldata],
                                  ].map(([label, text]) => (
                                    <div key={label} className="flex items-start mb-1 last:mb-0">
                                      <span className="text-gray-500 mr-2 flex-shrink-0">{label}:</span>
                                      <span className="break-all flex-1">{text}</span>
                                    </div>
                                  ))}
                                </div>
                              ))
                            })()}
                            
                            {/* Simulation Status Indicator */}
                            {(() => {
                              const status = getSimulationStatus(index)
                              
                              if (status === 'simulating') {
                                return (
                                  <div className="absolute top-2 right-2 w-4 h-4 text-gray-400 animate-spin">
                                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                                      <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        strokeDasharray="32"
                                        strokeDashoffset="8"
                                      />
                                    </svg>
                                  </div>
                                )
                              }
                              
                              if (status === 'success') {
                                return (
                                  <div className="absolute top-2 right-2 w-4 h-4 text-green-500">
                                    <svg fill="currentColor" viewBox="0 0 20 20">
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                )
                              }
                              
                              if (status === 'error') {
                                return (
                                  <div className="absolute top-2 right-2 w-4 h-4 text-red-500">
                                    <svg fill="currentColor" viewBox="0 0 20 20">
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                )
                              }
                              
                              return null
                            })()}
                          </div>
                          
                          {/* Simulation Error Message */}
                          {(() => {
                            const error = getSimulationError(index)
                            if (error) {
                              return (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                  <strong>Simulation failed:</strong> {error}
                                </div>
                              )
                            }
                            return null
                          })()}
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
            {proposalTopUpPlan?.kind === 'add' && (
              <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                This proposal asks the Payer for {formatUsdc(proposalUsdc)} USDC, which leaves{' '}
                {formatUsdc(proposalPayerStatus!.askShortfall)} USDC as debt that nothing in it funds yet.{' '}
                {proposalTopUpPlan.previous
                  ? `Raising its Payer top-up from ${describeTopUp(proposalTopUpPlan.previous)} to ${describeTopUp(proposalTopUpPlan.topUp)} would.`
                  : `A Payer top-up of ${describeTopUp(proposalTopUpPlan.topUp)} would.`}
                <div className="mt-2">
                  <Button
                    variant="secondary"
                    size="fit"
                    onClick={applyProposalTopUp}
                    disabled={editorDisabled}
                    className="h-auto px-3 py-1 text-xs"
                  >
                    {proposalTopUpPlan.previous ? 'Raise the top-up' : 'Add the top-up'}
                  </Button>
                </div>
              </div>
            )}
            {proposalTopUpPlan?.kind === 'unpriced' && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                This proposal&apos;s USDC leaves debt the Payer can&apos;t pay, and the TokenBuyer&apos;s price feeds
                can&apos;t be read right now to size the top-up that funds it.
              </div>
            )}

            {/* Add Action Button (in actions list) */}
            <div className="mt-7 pl-6">
              <button
                onClick={handleAddAction}
                disabled={editorDisabled}
                className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded text-sm text-gray-700 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add action
              </button>
            </div>
            {activeShared && (
              <div className="mt-4">
                <button
                  type="button"
                  className="text-xs text-gray-500 hover:text-gray-800"
                  onClick={() => {
                    setInlineTarget({ target: 'ask', blockIndex: null, actionIndex: null, excerpt: 'The ask' })
                    setInlineComment('')
                  }}
                >
                  Comment on the ask
                </button>
                <DraftThread
                  {...threadProps}
                  comments={activeShared.comments.filter((comment) => comment.target === 'ask' && comment.actionIndex === null)}
                />
                {inlineTarget?.target === 'ask' && inlineTarget.actionIndex === null && (
                  <DraftComposer
                    label="Commenting on the ask"
                    text={inlineComment}
                    onText={setInlineComment}
                    attached={attached?.owner === 'inline' ? attached.action : null}
                    onAttach={() => setRequestDialog({ mode: 'attach', owner: 'inline' })}
                    onClearAttached={() => setAttached(null)}
                    onSubmit={() => { void submitComment('inline') }}
                    busy={discussionBusy === 'inline'}
                  />
                )}
              </div>
            )}

          </>
        )}

        {/* Large "Add a proposal action" button when no actions */}
        {/* Hide for topics since they don't need actions */}
        {contentType !== 'topic' && !currentActions.length && (
          <div className="mt-16">
            <button
              onClick={handleAddAction}
              disabled={editorDisabled}
              className="w-full h-24 bg-transparent border-2 border-gray-200 rounded-xl text-lg font-medium text-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add a proposal action
            </button>
          </div>
        )}

    </div>
  )

  // Render sticky footer with submit button
  const stickyFooter = (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
      {mode === 'edit' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Update Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={updateReason}
            onChange={(e) => setUpdateReason(e.target.value)}
            placeholder="Describe the changes you made..."
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-white text-gray-900"
            rows={3}
            disabled={disabled || isSubmitting}
          />
        </div>
      )}

      {contentType !== 'topic' && (
        <button
          type="button"
          onClick={() => setIsSimulateVotesOpen(true)}
          className="mb-2 flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Vote size={16} />
          Simulate votes
        </button>
      )}

      {onSubmit && (
        <button
          onClick={() => {
            if (mode === 'edit') {
              handleEditSubmit()
            } else if (contentType === 'topic') {
              // For topics, directly submit without showing dialog (only if version 5)
              if (isVersion5) {
                onSubmit('topic')
              }
            } else {
              setIsSubmissionDialogOpen(true)
            }
          }}
          disabled={
            editorDisabled || 
            !isFormValid || 
            isSubmitting || 
            (mode === 'edit' && !updateReason.trim()) ||
            (!isVersion5 && (contentType === 'topic' || contentType === 'candidate'))
          }
          className={`w-full px-4 py-4 border-none rounded text-base font-medium transition-all duration-200 ${
            editorDisabled || 
            !isFormValid || 
            isSubmitting || 
            (mode === 'edit' && !updateReason.trim()) ||
            (!isVersion5 && (contentType === 'topic' || contentType === 'candidate'))
              ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
              : 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
          }`}
          title={
            !isVersion5 && (contentType === 'topic' || contentType === 'candidate')
              ? 'This feature is only available in DAO version 5'
              : !isFormValid 
              ? contentType === 'topic'
                ? 'Please add a title and description to continue'
                : 'Please add a title, description, and at least one action to continue'
              : isSubmitting 
              ? contentType === 'topic' ? 'Creating topic...' : 'Submitting proposal...'
              : mode === 'edit' && !updateReason.trim()
              ? 'Please provide an update reason'
              : undefined
          }
        >
          {isSubmitting ? 'Submitting...' : submitLabel}
        </button>
      )}
    </div>
  )

  const accessSelectClass = 'w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700'

  const draftSidebar = (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={saveDraft}
            disabled={editorDisabled || sharing}
            className="flex w-full items-center justify-center gap-1.5 rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            title={address ? 'Save here and share it from your wallet' : 'Save on this browser. Connect a wallet to share it.'}
          >
            <Save className="w-4 h-4" />
            {awaitingWallet ? 'Waiting for wallet…' : sharing ? 'Sharing…' : draftJustSaved ? 'Saved' : activeDraft && draftDirty ? 'Save changes' : 'Save'}
          </button>
          {activeDraft && (
            <button
              type="button"
              onClick={saveDraftAsNew}
              disabled={editorDisabled}
              className="w-full rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              title="Keep the current saved proposal and store this as another one"
            >
              Save as new
            </button>
          )}
          <button
            type="button"
            onClick={pasteProposalFromClipboard}
            disabled={editorDisabled || pastedProposal}
            className="flex w-full items-center justify-center gap-1.5 rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            title="Paste a proposal from the clipboard into the title, description, and actions"
          >
            <ClipboardPaste className="w-4 h-4" />
            {pastedProposal ? 'Pasted' : 'Paste from clipboard'}
          </button>
        </div>
        <div ref={setFormatSlot} className={editorDisabled ? 'hidden' : undefined} />
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            People
          </div>
          <div className="px-3 py-3">
            {!address ? (
              <p className="text-sm text-gray-500">Connect a wallet to choose who can open this draft.</p>
            ) : (
              <>
                {activeShared && canManagePeople && (
                  <button
                    type="button"
                    onClick={() => { void copySharedLink(activeShared.id) }}
                    className="mb-3 rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Copy link
                  </button>
                )}
                <p className="mb-2 text-xs text-gray-500">
                  {activeShared
                    ? canManagePeople
                      ? 'You choose who can edit, and who can only view and comment.'
                      : viewerAccess === 'edit'
                        ? 'You can edit this draft.'
                        : 'You can view this draft and comment.'
                    : 'Add someone to share this draft. It is saved first.'}
                </p>
                {(activeShared?.collaborators || []).length === 0 ? (
                  <p className="mb-2 text-sm text-gray-400">No one else added yet.</p>
                ) : (
                  <ul className="mb-3 flex flex-col gap-2">
                    {(activeShared?.collaborators || []).map((person) => (
                      <li key={person.address} className="flex flex-col gap-1">
                        <span className="truncate text-sm text-gray-800">{personLabel(person.ensName, person.address)}</span>
                        <div className="flex items-center gap-2">
                          {canManagePeople ? (
                            <select
                              value={person.role === 'edit' ? 'edit' : 'comment'}
                              disabled={discussionBusy === 'invite'}
                              onChange={(event) => { void grantPerson(person.address, event.target.value === 'edit' ? 'edit' : 'comment') }}
                              className={accessSelectClass}
                            >
                              <option value="comment">View and comment</option>
                              <option value="edit">Can edit</option>
                            </select>
                          ) : (
                            <span className="text-xs text-gray-500">{person.role === 'edit' ? 'Can edit' : 'View and comment'}</span>
                          )}
                          {canManagePeople && (
                            <button
                              type="button"
                              className="shrink-0 text-xs text-gray-500 hover:text-red-600"
                              disabled={discussionBusy === person.address}
                              onClick={() => { void uninvitePerson(person.address) }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {canManagePeople && (
                  <div className="flex flex-col gap-2">
                    <input
                      value={personInput}
                      onChange={(event) => setPersonInput(event.target.value)}
                      placeholder="Address or ENS"
                      disabled={discussionBusy === 'invite'}
                      className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-gray-400"
                    />
                    <select
                      value={personRole}
                      onChange={(event) => setPersonRole(event.target.value === 'edit' ? 'edit' : 'comment')}
                      disabled={discussionBusy === 'invite'}
                      className={accessSelectClass}
                    >
                      <option value="comment">View and comment</option>
                      <option value="edit">Can edit</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => { void grantPerson(personInput, personRole) }}
                      disabled={discussionBusy === 'invite' || !personInput.trim()}
                      className="rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {discussionBusy === 'invite' ? 'Saving…' : 'Add'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="mb-6 rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Saved
            </div>
            <ul className="max-h-64 overflow-y-auto">
              <li className={!editorHasWork && !activeDraft && !activeShared ? 'bg-green-50' : undefined}>
                <button
                  type="button"
                  onClick={startNewDraft}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 shrink-0 text-gray-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-gray-900">New</span>
                    <span className="block text-xs text-gray-500">Blank proposal</span>
                  </span>
                </button>
              </li>
              {visibleDrafts.map((draft) => {
                const selected = draft.id === activeDraftId
                const label = draft.title.trim() || 'Untitled proposal'
                return (
                  <li key={draft.id} className={selected ? 'bg-green-50' : undefined}>
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => openDraft(draft)}
                        className="min-w-0 flex-1 rounded px-2 py-1 text-left hover:bg-gray-50"
                      >
                        <span className="block truncate text-sm text-gray-900">{label}</span>
                        <span className="block text-xs text-gray-500">
                          {selected ? 'Open in the editor' : 'Open'} · {formatEditorDraftTime(draft.updatedAt)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDraft(draft)}
                        className="rounded p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${label}`}
                        title="Remove from this browser"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Shared proposals
          </div>
          {!address ? (
            <p className="px-3 py-3 text-sm text-gray-500">
              Connect a wallet to see shared proposals.
            </p>
          ) : !sharedReady ? (
            <div className="px-3 py-3">
              <p className="mb-2 text-sm text-gray-500">
                Shared proposals are not public. Sign with your wallet to view them.
              </p>
              <button
                type="button"
                onClick={() => { void unlockShared() }}
                disabled={unlocking}
                className="rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {unlocking ? 'Waiting for signature…' : 'Sign in to view'}
              </button>
            </div>
          ) : visibleShared.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-500">
              No shared proposals yet. Save with your wallet to put one on the server.
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {visibleShared.map((proposal) => {
                const selected = proposal.id === activeShared?.id
                const label = proposal.title.trim() || 'Untitled proposal'
                const mine = address?.toLowerCase() === proposal.authorAddress.toLowerCase()
                return (
                  <li key={proposal.id} className={selected ? 'bg-green-50' : undefined}>
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => { void openSharedProposal(proposal.id) }}
                        className="min-w-0 flex-1 rounded px-2 py-1 text-left hover:bg-gray-50"
                      >
                        <span className="block truncate text-sm text-gray-900">{label}</span>
                        <span className="block text-xs text-gray-500">
                          {mine ? personLabel(proposal.authorEns, proposal.authorAddress) : `Shared with you by ${personLabel(proposal.authorEns, proposal.authorAddress)}`}
                          {' · '}
                          {proposal.commentCount} {proposal.commentCount === 1 ? 'comment' : 'comments'}
                          {' · '}
                          {formatEditorDraftTime(proposal.updatedAt)}
                        </span>
                      </button>
                      {mine && (
                        <button
                          type="button"
                          onClick={() => { void copySharedLink(proposal.id) }}
                          className="rounded p-2 text-gray-500 hover:bg-gray-100"
                          aria-label={`Copy link for ${label}`}
                          title="Copy link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                      {mine && (
                        <button
                          type="button"
                          onClick={() => { void removeSharedProposal(proposal) }}
                          className="rounded p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${label} for everyone`}
                          title="Remove for everyone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          {activeShared && (
            <div className="border-t border-gray-100 px-3 py-3">
              <DraftThread
                {...threadProps}
                comments={activeShared.comments.filter((comment) => comment.target === 'proposal' || !comment.target)}
              />
              <DraftComposer
                label="Comment on the whole draft"
                text={proposalComment}
                onText={setProposalComment}
                attached={attached?.owner === 'proposal' ? attached.action : null}
                onAttach={() => setRequestDialog({ mode: 'attach', owner: 'proposal' })}
                onClearAttached={() => setAttached(null)}
                onSubmit={() => { void submitComment('proposal') }}
                busy={discussionBusy === 'proposal'}
              />
            </div>
          )}
        </div>
    </div>
  )

  // Render main content
  const mainContent = (
    <div className="relative w-full max-w-4xl">
      <div className={`flex flex-col xl:pb-64 w-full overflow-hidden ${hasHeader ? 'pt-0' : 'pt-0 sm:pt-24 xl:pt-24'}`}>

        {/* Title */}
        <textarea
          ref={titleTextareaRef}
          placeholder={titlePlaceholder}
          value={currentTitle || ''}
          onChange={(e) => handleTitleChange(e.target.value)}
          disabled={editorDisabled}
          rows={1}
          className="w-full bg-transparent border-none outline-none mb-1 placeholder-gray-400 font-londrina text-6xl md:text-7xl font-normal leading-tight text-gray-900 caret-gray-900 break-words min-w-0 resize-none"
          style={{ 
            wordWrap: 'break-word', 
            overflowWrap: 'break-word',
            overflow: 'hidden'
          }}
        />

        {/* Subtitle */}
        <div className="mb-6 text-base text-gray-500">
          By {address ? (
            <span className="text-gray-500">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          ) : '0x...'}
        </div>


        {/* Body Editor */}
        <div className="w-full max-w-4xl break-words">
          <RichTextEditor
            value={currentBody}
            onChange={handleBodyChange}
            placeholder='Click a block to edit its markdown. A blank line splits it into two blocks.'
            readOnly={editorDisabled}
            toolbarSlot={enableDrafts ? formatSlot : null}
            renderBlockFooter={activeShared ? (index) => {
              const excerpt = blockExcerpt(currentBody[index]) || 'This block'
              const comments = activeShared.comments.filter((comment) => comment.target === 'block' && blockCommentIndex.get(comment.id) === index)
              const open = inlineTarget?.target === 'block' && inlineTarget.blockIndex === index
              return (
                <div className="px-1 pb-2">
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-gray-800"
                    onClick={() => {
                      setInlineTarget({ target: 'block', blockIndex: index, actionIndex: null, excerpt })
                      setInlineComment('')
                    }}
                  >
                    {comments.length ? `Comment (${comments.length})` : 'Comment'}
                  </button>
                  <DraftThread {...threadProps} comments={comments} />
                  {open && (
                    <DraftComposer
                      label="Commenting on this block"
                      text={inlineComment}
                      onText={setInlineComment}
                      attached={attached?.owner === 'inline' ? attached.action : null}
                      onAttach={() => setRequestDialog({ mode: 'attach', owner: 'inline' })}
                      onClearAttached={() => setAttached(null)}
                      onSubmit={() => { void submitComment('inline') }}
                      busy={discussionBusy === 'inline'}
                    />
                  )}
                </div>
              )
            } : undefined}
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-full">
      {/* Edit mode header */}
      {editHeader}

      {/* Unified Layout */}
      <div className={`lg:grid ${enableDrafts ? 'lg:grid-cols-[240px_minmax(0,1fr)_320px] xl:grid-cols-[260px_minmax(0,1fr)_400px]' : 'lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_400px]'} lg:items-start lg:gap-8 lg:p-8 lg:px-8 xl:px-12 lg:w-full`}>
        {enableDrafts && (
        <aside className={`min-w-0 px-5 lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto lg:px-0 ${hasHeader ? 'pt-4' : 'pt-6 sm:pt-24'}`}>
          {draftSidebar}
        </aside>
        )}

        {/* Main Content Column - Always rendered here */}
        <div className="min-w-0 w-full overflow-hidden break-words px-5 lg:px-0">
          {mainContent}
          
          {/* Mobile bottom spacer to prevent content being hidden behind fixed sidebar */}
          <div className="lg:hidden h-32"></div>
          
          {/* Desktop bottom spacer to ensure consistent spacing between content and footer */}
          <div className="hidden lg:block h-64"></div>
        </div>

        {/* Sidebar Column */}
        {/* Mobile: Fixed bottom drawer */}
        {/* Desktop: Grid column 2, sticky */}
        <div className={`
          fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 
          lg:border-none lg:bg-transparent lg:z-auto
          lg:sticky lg:top-0 lg:max-h-screen lg:overflow-auto lg:self-start
        `}
        style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }} // Reset padding for desktop, mobile needs override or padding in inner container
        >
          <div className="p-4 lg:p-0 lg:py-5">
            {sidebarContent}
             {/* Show footer here for both layouts now */}
            {stickyFooter}
          </div>
        </div>
        
      </div>

      {/* Action Dialog */}
      <ActionDialog
        isOpen={isActionDialogOpen}
        onClose={() => {
          setIsActionDialogOpen(false)
          setEditingActionIndex(null)
        }}
        onSubmit={handleActionSubmit}
        onBulkSubmit={handleBulkActionSubmit}
        onDelete={editingActionIndex !== null ? handleActionDelete : undefined}
        action={editingActionIndex !== null ? currentActions[editingActionIndex] : undefined}
        title={editingActionIndex !== null ? 'Edit Action' : 'Add action'}
        pendingUsdc={usdcRequested(currentActions.filter((_, i) => i !== editingActionIndex))}
        fundUsdcWithTopUp
        otherActions={currentActions.filter((_, i) => i !== editingActionIndex)}
      />

      <ActionDialog
        isOpen={requestDialog !== null}
        onClose={() => setRequestDialog(null)}
        title={requestDialog?.mode === 'update' ? 'Update requested action' : 'Attach an action'}
        action={
          requestDialog?.mode === 'update'
            ? requestDialog.action
            : requestDialog?.mode === 'attach' && attached?.owner === requestDialog.owner
              ? attached.action
              : undefined
        }
        onSubmit={(action) => {
          if (requestDialog?.mode === 'update') {
            const comment = activeShared?.comments.find((item) => item.id === requestDialog.commentId)
            if (comment) void decideComment(comment, 'update', action)
          } else if (requestDialog?.mode === 'attach') {
            setAttached({ owner: requestDialog.owner, action })
          }
        }}
      />

      {/* Submission Dialog */}
      <SimulateVotesDialog
        isOpen={isSimulateVotesOpen}
        onClose={() => setIsSimulateVotesOpen(false)}
        title={currentTitle}
      />

      <SubmissionDialog
        isOpen={isSubmissionDialogOpen}
        onClose={() => setIsSubmissionDialogOpen(false)}
        onSubmit={handleSubmissionDialogSubmit}
        defaultSubmissionType={mode === 'edit' ? 'candidate' : defaultSubmissionType}
        contentType={contentType}
      />

      {/* Error message for edit mode */}
      {mode === 'edit' && updateError && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 max-w-2xl w-full mx-4 z-30">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {updateError.message}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProposalEditor
