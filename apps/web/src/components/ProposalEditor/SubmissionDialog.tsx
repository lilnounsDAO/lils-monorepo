import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useAccount } from 'wagmi'
import { CHAIN_CONFIG } from '@/config'
import { nounsDaoLogicConfig, nounsNftTokenConfig } from '@/data/generated/wagmi'
import {
  DrawerDialog,
  DrawerDialogContent,
  DrawerDialogContentInner,
  DrawerDialogTitle,
} from "../ui/DrawerDialog"
import { cn } from '@/utils/shadcn'
import { FileText, Lightbulb, MessageSquare } from 'lucide-react'
import { isDaoVersion5 } from '@/utils/daoVersion'

interface SubmissionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (submissionType: 'proposal' | 'candidate' | 'topic') => void
  defaultSubmissionType?: 'proposal' | 'candidate' | 'topic'
  contentType?: 'proposal' | 'candidate' | 'topic'
}

type SubmissionType = 'proposal' | 'candidate' | 'topic'

interface SubmissionOption {
  type: SubmissionType
  title: string
  description: string
  icon: React.ReactNode
}

const SubmissionDialog: React.FC<SubmissionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultSubmissionType = 'proposal',
  contentType = 'proposal',
}) => {
  const { address } = useAccount()
  const isVersion5 = isDaoVersion5()
  const [submissionType, setSubmissionType] = useState<SubmissionType>(defaultSubmissionType)
  const [currentVotes, setCurrentVotes] = useState<number>(0)
  const [proposalThreshold, setProposalThreshold] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasInsufficientVotes, setHasInsufficientVotes] = useState(false)

  // Define available submission options based on content type and DAO version
  const allSubmissionOptions: SubmissionOption[] = contentType === 'topic'
    ? [
        {
          type: 'topic',
          title: 'Submit Topic',
          description: 'Post this as a community discussion topic. No proposal actions required.',
          icon: <MessageSquare className="w-8 h-8" />,
        },
      ]
    : [
        {
          type: 'proposal',
          title: 'Submit as Proposal',
          description: 'Submit directly to the DAO for voting. Requires meeting the proposal threshold.',
          icon: <FileText className="w-8 h-8" />,
        },
        {
          type: 'candidate',
          title: 'Submit as Candidate',
          description: 'Share as a proposal candidate to gather feedback and support before official submission.',
          icon: <Lightbulb className="w-8 h-8" />,
        },
      ]

  // Filter options based on DAO version - only show candidate if version 5
  const submissionOptions: SubmissionOption[] = isVersion5
    ? allSubmissionOptions
    : allSubmissionOptions.filter(option => option.type !== 'candidate' && option.type !== 'topic')

  const checkVotingPower = useCallback(async () => {
    if (!address) return
    
    setIsLoading(true)
    try {
      const [currentVotesResult, proposalThresholdResult] = await CHAIN_CONFIG.publicClient.multicall({
        contracts: [
          {
            address: CHAIN_CONFIG.addresses.nounsToken,
            abi: nounsNftTokenConfig.abi,
            functionName: "getCurrentVotes",
            args: [address],
          },
          {
            address: CHAIN_CONFIG.addresses.nounsDaoProxy,
            abi: nounsDaoLogicConfig.abi,
            functionName: "proposalThreshold",
            args: [],
          },
        ],
        allowFailure: false,
      })

      const votes = Number(currentVotesResult)
      const threshold = Number(proposalThresholdResult)
      
      setCurrentVotes(votes)
      setProposalThreshold(threshold)
      setHasInsufficientVotes(votes < threshold)
      
      // Auto-suggest candidate if insufficient votes and not explicitly set for candidates
      if (votes < threshold && defaultSubmissionType === 'proposal') {
        setSubmissionType('candidate')
      }
    } catch (error) {
      console.error('Failed to check voting power:', error)
    } finally {
      setIsLoading(false)
    }
  }, [address, defaultSubmissionType])

  // Reset submission type when dialog opens or defaultSubmissionType changes
  useEffect(() => {
    if (isOpen) {
      setSubmissionType(defaultSubmissionType)
      if (address) {
        checkVotingPower()
      }
    }
  }, [isOpen, address, defaultSubmissionType, checkVotingPower])

  const handleSubmit = () => {
    // Prevent submission of candidate or topic if not version 5
    if (!isVersion5 && (submissionType === 'candidate' || submissionType === 'topic')) {
      return
    }
    onSubmit(submissionType)
    onClose()
  }

  const handleCandidateLinkClick = () => {
    setSubmissionType('candidate')
  }

  return (
    <DrawerDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerDialogContent className="md:max-w-[600px]">
        <DrawerDialogTitle className="sr-only">
          Choose submission type
        </DrawerDialogTitle>
        <DrawerDialogContentInner>
          {/* Header */}
          <div className="w-full mb-6">
            <h2 className="heading-5">
              Choose how to submit
            </h2>
          </div>

          {/* Warning Message for Insufficient Votes */}
          {hasInsufficientVotes && submissionType === 'proposal' && contentType !== 'topic' && (
            <div className="w-full bg-blue-50 border border-blue-200 rounded-[16px] p-4 mb-4">
              <p className="text-sm text-blue-800">
                Your voting power ({currentVotes}) does not meet the required proposal threshold ({proposalThreshold}).{' '}
                <button
                  onClick={handleCandidateLinkClick}
                  className="text-blue-600 underline hover:text-blue-800 font-medium"
                >
                  Consider submitting a candidate instead
                </button>
                .
              </p>
            </div>
          )}

          {/* Submission Options as Cards */}
          <div className="w-full flex flex-col gap-4">
            {submissionOptions.map((option) => {
              const isDisabled = !isVersion5 && (option.type === 'candidate' || option.type === 'topic')
              
              return (
                <button
                  key={option.type}
                  onClick={() => !isDisabled && setSubmissionType(option.type)}
                  disabled={isDisabled}
                  className={cn(
                    'flex items-start gap-4 p-6 rounded-[16px] border-2 transition-all',
                    'text-left group',
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed border-gray-200'
                      : submissionType === option.type
                      ? 'border-blue-400 bg-blue-50/30 cursor-pointer'
                      : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer'
                  )}
                >
                {/* Icon */}
                <div className={cn(
                  'flex items-center justify-center w-16 h-16 rounded-[12px] transition-colors shrink-0',
                  submissionType === option.type
                    ? 'bg-blue-100'
                    : 'bg-gray-100 group-hover:bg-blue-100'
                )}>
                  <div className={cn(
                    'transition-colors',
                    submissionType === option.type
                      ? 'text-blue-600'
                      : 'text-gray-600 group-hover:text-blue-600'
                  )}>
                    {option.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="heading-6 mb-2">{option.title}</h3>
                  <p className="text-sm text-content-secondary">
                    {option.description}
                  </p>
                </div>
              </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="w-full flex justify-end gap-3 mt-8">
            <Button
              variant="secondary"
              onClick={onClose}
              size="default"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || (!isVersion5 && (submissionType === 'candidate' || submissionType === 'topic'))}
              variant="primary"
              size="default"
            >
              {isLoading ? 'Checking...' : 'Continue'}
            </Button>
          </div>
        </DrawerDialogContentInner>
      </DrawerDialogContent>
    </DrawerDialog>
  )
}

export default SubmissionDialog
