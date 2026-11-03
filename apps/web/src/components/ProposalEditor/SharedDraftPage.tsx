import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Descendant } from 'slate'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useSignMessage } from 'wagmi'
import ProposalEditor from './ProposalEditor'
import { markdownToDescendants } from '@/utils/parsePastedProposal'
import type { Action } from '@/types/proposal-editor'
import {
  getSavedProposal,
  openSavedProposalSession,
  readSavedProposalSession,
  sha256Hex,
  signableMessage,
  type SavedProposal,
} from '@/data/savedProposals'

const validDraftId = (id: string) => /^[A-Za-z0-9-]{8,80}$/.test(id)

const SharedDraftPage: React.FC = () => {
  const { draftId = '' } = useParams()
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [phase, setPhase] = useState<'locked' | 'opening' | 'ready' | 'denied'>('locked')
  const [proposal, setProposal] = useState<SavedProposal | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState<Descendant[]>([{ type: 'paragraph', children: [{ text: '' }] } as Descendant])
  const [actions, setActions] = useState<Action[]>([])

  const signIn = async () => {
    if (!address || !validDraftId(draftId)) return
    setPhase('opening')
    try {
      if (!readSavedProposalSession(address)) {
        const digest = await sha256Hex('read')
        const timestamp = Date.now()
        const signature = await signMessageAsync({
          message: signableMessage('read', '*', digest, timestamp),
        })
        await openSavedProposalSession({ digest, signature, address, timestamp })
      }
      const { proposal: opened } = await getSavedProposal(draftId, address)
      setProposal(opened)
      setTitle(opened.title)
      setBody(markdownToDescendants(opened.bodyMarkdown))
      setActions(opened.actions)
      setPhase('ready')
    } catch {
      setProposal(null)
      setPhase('denied')
    }
  }

  if (!validDraftId(draftId)) {
    return (
      <div className="flex w-full justify-center px-5 pt-24">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-6 py-8">
          <h1 className="mb-2 text-lg text-gray-900">Shared draft</h1>
          <p className="text-sm text-gray-600">This link is not a draft.</p>
        </div>
      </div>
    )
  }

  if (phase === 'ready' && proposal) {
    return (
      <ProposalEditor
        mode="create"
        title={title}
        body={body}
        actions={actions}
        onTitleChange={setTitle}
        onBodyChange={setBody}
        onActionsChange={setActions}
        contentType={proposal.contentType}
        openedShared={proposal}
        titlePlaceholder="Untitled proposal"
      />
    )
  }

  return (
    <div className="flex w-full justify-center px-5 pt-24">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-6 py-8">
        <h1 className="mb-2 text-lg text-gray-900">Shared draft</h1>
        {phase === 'denied' ? (
          <>
            <p className="mb-4 text-sm text-gray-600">You don&apos;t have access to this draft.</p>
            <button
              type="button"
              onClick={() => setPhase('locked')}
              className="rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Try another wallet
            </button>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-600">This draft is private.</p>
            {!address ? (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    type="button"
                    onClick={openConnectModal}
                    className="rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Sign in to see
                  </button>
                )}
              </ConnectButton.Custom>
            ) : (
              <button
                type="button"
                onClick={() => { void signIn() }}
                disabled={phase === 'opening'}
                className="rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {phase === 'opening' ? 'Waiting for signature…' : 'Sign in to see'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SharedDraftPage
