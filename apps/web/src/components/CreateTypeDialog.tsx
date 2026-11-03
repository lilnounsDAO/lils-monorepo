import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils/shadcn'
import { FileText, Lightbulb, MessageSquare, Plus } from 'lucide-react'
import { useAccount, useSignMessage } from 'wagmi'
import {
  DrawerDialog,
  DrawerDialogContent,
  DrawerDialogContentInner,
  DrawerDialogTitle,
} from './ui/DrawerDialog'
import { isDaoVersion5 } from '@/utils/daoVersion'
import { formatEditorDraftTime, loadEditorDrafts, type EditorDraft } from '@/utils/editorDrafts'
import {
  listSavedProposals,
  openSavedProposalSession,
  readSavedProposalSession,
  sha256Hex,
  signableMessage,
  type SavedProposalSummary,
} from '@/data/savedProposals'

interface CreateTypeDialogProps {
  isOpen: boolean
  onClose: () => void
  daoType: 'lilnouns' | 'nouns'
}

interface CreateOption {
  type: 'candidate' | 'topic'
  title: string
  description: string
  icon: React.ReactNode
  route: string
}

function ScrollEdge({ side, visible }: { side: 'left' | 'right'; visible: boolean }) {
  if (!visible) return null
  const direction = side === 'left' ? 'to right' : 'to left'
  return (
    <div className={`pointer-events-none absolute inset-y-0 w-10 ${side === 'left' ? 'left-0' : 'right-0'}`} aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          maskImage: `linear-gradient(${direction}, black, transparent)`,
          WebkitMaskImage: `linear-gradient(${direction}, black, transparent)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(${direction}, white, transparent)` }}
      />
    </div>
  )
}

type ProposalCell = {
  id: string
  title: string
  detail: string
  route: string
  group: 'editing' | 'invited'
}

export default function CreateTypeDialog({ isOpen, onClose, daoType }: CreateTypeDialogProps) {
  const navigate = useNavigate()
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const isVersion5 = isDaoVersion5()
  const nounsHasCandidates = daoType === 'nouns'
  const storeDrafts = daoType === 'lilnouns'
  const [localDrafts, setLocalDrafts] = useState<EditorDraft[]>([])
  const [shared, setShared] = useState<SavedProposalSummary[]>([])
  const [signingIn, setSigningIn] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [scrollEdges, setScrollEdges] = useState({ left: false, right: false })

  useEffect(() => {
    if (!isOpen || !storeDrafts) {
      setLocalDrafts([])
      setShared([])
      return
    }
    setLocalDrafts(loadEditorDrafts().filter((draft) => draft.contentType === 'proposal'))
    if (!address || !readSavedProposalSession(address)) {
      setShared([])
      return
    }
    let cancelled = false
    listSavedProposals(address)
      .then((result) => {
        if (!cancelled) setShared(result.proposals.filter((proposal) => proposal.contentType === 'proposal'))
      })
      .catch(() => {
        if (!cancelled) setShared([])
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, address, storeDrafts])

  const localIds = new Set(localDrafts.map((draft) => draft.id))
  const mine = address?.toLowerCase()
  const editing: ProposalCell[] = [
    ...localDrafts.map((draft) => ({
      id: draft.id,
      title: draft.title.trim() || 'Untitled proposal',
      detail: formatEditorDraftTime(draft.updatedAt),
      route: `/new/${draft.id}`,
      group: 'editing' as const,
    })),
    ...shared
      .filter((proposal) => proposal.authorAddress.toLowerCase() === mine && !localIds.has(proposal.id))
      .map((proposal) => ({
        id: proposal.id,
        title: proposal.title.trim() || 'Untitled proposal',
        detail: formatEditorDraftTime(proposal.updatedAt),
        route: `/draft/${proposal.id}`,
        group: 'editing' as const,
      })),
  ]
  const invited: ProposalCell[] = shared
    .filter((proposal) => proposal.authorAddress.toLowerCase() !== mine)
    .map((proposal) => ({
      id: proposal.id,
      title: proposal.title.trim() || 'Untitled proposal',
      detail: formatEditorDraftTime(proposal.updatedAt),
      route: `/draft/${proposal.id}`,
      group: 'invited' as const,
    }))

  const otherOptions: CreateOption[] = [
    {
      type: 'candidate',
      title: 'Create Candidate',
      description: 'Share a candidate proposal to gather feedback and support before submitting officially.',
      icon: <Lightbulb className="w-8 h-8" />,
      route: '/new/candidate',
    },
    {
      type: 'topic',
      title: 'Create Topic',
      description: 'Start a community discussion about governance, proposals, or general DAO matters.',
      icon: <MessageSquare className="w-8 h-8" />,
      route: '/new/topic',
    },
  ].filter((option) => {
    if (option.type === 'candidate') return isVersion5 || nounsHasCandidates
    if (option.type === 'topic') return isVersion5
    return false
  })

  const openRoute = (route: string) => {
    navigate(route)
    onClose()
  }

  const signIn = async () => {
    if (!address) return
    setSigningIn(true)
    try {
      const digest = await sha256Hex('read')
      const timestamp = Date.now()
      const signature = await signMessageAsync({
        message: signableMessage('read', '*', digest, timestamp),
      })
      await openSavedProposalSession({ digest, signature, address, timestamp })
      const result = await listSavedProposals(address)
      setShared(result.proposals.filter((proposal) => proposal.contentType === 'proposal'))
    } catch {
      setShared([])
    } finally {
      setSigningIn(false)
    }
  }

  const proposalCells = [...editing, ...invited]

  const updateScrollEdges = () => {
    const el = scrollerRef.current
    if (!el) return
    setScrollEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    })
  }

  useEffect(() => {
    updateScrollEdges()
  }, [isOpen, proposalCells.length])

  const renderCell = (cell: ProposalCell) => (
    <button
      key={`${cell.group}-${cell.id}`}
      type="button"
      onClick={() => openRoute(cell.route)}
      className="flex h-14 w-[132px] shrink-0 flex-col items-start justify-center gap-0.5 rounded-[12px] border border-gray-200 bg-white px-2.5 py-1.5 text-left hover:border-blue-400 hover:bg-blue-50/30"
    >
      <span className="flex w-full items-center justify-between gap-1 text-[11px] leading-4 text-gray-500">
        <span>{cell.group === 'editing' ? 'Editing' : 'Invited'}</span>
        <span className="shrink-0">{cell.detail}</span>
      </span>
      <span className="w-full truncate text-xs font-medium leading-4 text-gray-900">{cell.title}</span>
    </button>
  )

  return (
    <DrawerDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerDialogContent className="md:max-w-[600px]">
        <DrawerDialogTitle className="sr-only">
          What would you like to create?
        </DrawerDialogTitle>
        <DrawerDialogContentInner>
          <div className="w-full mb-6">
            <h2 className="heading-5">
              What would you like to create?
            </h2>
          </div>

          <div className="w-full flex flex-col gap-4">
            {storeDrafts ? (
              <div className="rounded-[16px] border-2 border-gray-200 p-6">
                <div className="mb-4 flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[12px] bg-gray-100 text-gray-600">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="heading-6">Create Proposal</h3>
                      <button
                        type="button"
                        onClick={() => openRoute('/new/proposal')}
                        className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4" />
                        new
                      </button>
                    </div>
                    <p className="text-sm text-content-secondary">
                      Submit an official proposal for DAO voting. Requires meeting threshold requirements.
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <div
                    ref={scrollerRef}
                    onScroll={updateScrollEdges}
                    className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {proposalCells.map(renderCell)}
                  </div>
                  <ScrollEdge side="left" visible={scrollEdges.left} />
                  <ScrollEdge side="right" visible={scrollEdges.right} />
                </div>
                {address && !readSavedProposalSession(address) && (
                  <button
                    type="button"
                    onClick={() => { void signIn() }}
                    disabled={signingIn}
                    className="mt-6 inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {signingIn ? 'Waiting for signature…' : 'Sign in to see proposals you were invited to'}
                  </button>
                )}
                {!address && (
                  <p className="mt-3 text-sm text-gray-500">Connect a wallet to see proposals you were invited to.</p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openRoute('/new/proposal?dao=nouns')}
                className={cn(
                  'flex items-start gap-4 p-6 rounded-[16px] border-2 border-gray-200',
                  'hover:border-blue-400 hover:bg-blue-50/30 transition-all',
                  'text-left cursor-pointer group'
                )}
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-[12px] bg-gray-100 group-hover:bg-blue-100 transition-colors shrink-0">
                  <div className="text-gray-600 group-hover:text-blue-600 transition-colors">
                    <FileText className="w-8 h-8" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="heading-6 mb-2">Create Proposal</h3>
                  <p className="text-sm text-content-secondary">
                    Submit an official proposal for DAO voting. Requires meeting threshold requirements.
                  </p>
                </div>
              </button>
            )}

            {otherOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => openRoute(option.route)}
                className={cn(
                  'flex items-start gap-4 p-6 rounded-[16px] border-2 border-gray-200',
                  'hover:border-blue-400 hover:bg-blue-50/30 transition-all',
                  'text-left cursor-pointer group'
                )}
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-[12px] bg-gray-100 group-hover:bg-blue-100 transition-colors shrink-0">
                  <div className="text-gray-600 group-hover:text-blue-600 transition-colors">
                    {option.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="heading-6 mb-2">{option.title}</h3>
                  <p className="text-sm text-content-secondary">
                    {option.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </DrawerDialogContentInner>
      </DrawerDialogContent>
    </DrawerDialog>
  )
}
