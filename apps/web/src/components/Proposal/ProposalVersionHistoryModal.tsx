import React, { useState, useEffect } from 'react'
import { DrawerDialog, DrawerDialogContent, DrawerDialogTitle } from '@/components/ui/DrawerDialog'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProposalVersion } from '@/hooks/useProposalVersions'
import { ProposalTransaction } from '@/data/goldsky/governance/common'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import ProposalTransactionSummary from '@/components/Proposal/ProposalTransactionSummary'
import { formatDistanceToNow } from 'date-fns'

interface ProposalVersionHistoryModalProps {
  versions: ProposalVersion[]
  isOpen: boolean
  onClose: () => void
}

// Helper function to compare transactions (handles BigInt serialization)
function transactionsEqual(
  a: ProposalTransaction[],
  b: ProposalTransaction[]
): boolean {
  if (a.length !== b.length) return false
  
  return a.every((txA, i) => {
    const txB = b[i]
    return (
      txA.to.toLowerCase() === txB.to.toLowerCase() &&
      txA.signature === txB.signature &&
      txA.value === txB.value &&
      txA.calldata === txB.calldata
    )
  })
}

function VersionDiff({
  currentVersion,
  previousVersion,
}: {
  currentVersion: ProposalVersion
  previousVersion?: ProposalVersion
}) {
  const hasTitleChange = previousVersion && currentVersion.title !== previousVersion.title
  const hasDescriptionChange =
    previousVersion && currentVersion.description !== previousVersion.description
  const hasTransactionChange =
    previousVersion &&
    !transactionsEqual(currentVersion.details, previousVersion.details)

  if (!previousVersion) {
    return (
      <div className="rounded-[12px] border border-content-tertiary bg-background-secondary p-4">
        <p className="text-sm text-content-secondary">Initial version</p>
      </div>
    )
  }

  if (!hasTitleChange && !hasDescriptionChange && !hasTransactionChange) {
    return (
      <div className="rounded-[12px] border border-content-tertiary bg-background-secondary p-4">
        <p className="text-sm text-content-secondary">
          No changes detected from previous version
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {hasTitleChange && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-content-primary">Title Changed</h3>
          <div className="flex flex-col gap-3 rounded-[12px] border border-content-tertiary bg-background-secondary p-4">
            <div>
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-red-600">Previous</span>
              <p className="text-sm text-content-secondary line-through">
                {previousVersion.title}
              </p>
            </div>
            <div className="border-t border-content-tertiary pt-3">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-green-600">Current</span>
              <p className="text-sm text-content-primary">{currentVersion.title}</p>
            </div>
          </div>
        </div>
      )}

      {hasDescriptionChange && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-content-primary">Description Changed</h3>
          <div className="flex flex-col gap-4 rounded-[12px] border border-content-tertiary bg-background-secondary p-4">
            <div>
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-red-600">Previous</span>
              <div className="prose prose-sm max-w-none text-sm text-content-secondary [&_*]:line-through">
                <MarkdownRenderer>{previousVersion.description}</MarkdownRenderer>
              </div>
            </div>
            <div className="border-t border-content-tertiary pt-4">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-green-600">Current</span>
              <div className="prose prose-sm max-w-none text-sm text-content-primary">
                <MarkdownRenderer>{currentVersion.description}</MarkdownRenderer>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasTransactionChange && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-content-primary">Proposal Actions Changed</h3>
          <div className="flex flex-col gap-4 rounded-[12px] border border-content-tertiary bg-background-secondary p-4">
            <div>
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-red-600">Previous</span>
              <ProposalTransactionSummary
                transactions={previousVersion.details}
                proposalState="executed"
              />
            </div>
            <div className="border-t border-content-tertiary pt-4">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-green-600">Current</span>
              <ProposalTransactionSummary
                transactions={currentVersion.details}
                proposalState="executed"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VersionCard({ version, previousVersion, index, total }: {
  version: ProposalVersion
  previousVersion?: ProposalVersion
  index: number
  total: number
}) {
  const createdAt = new Date(parseInt(version.createdAt) * 1000)
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true })

  // Remove title from description if present (description format: "# Title\n\nDescription" or "## Title\n\nDescription")
  let description = version.description
  const title = version.title
  if (title && description) {
    // Check for h1 (# Title)
    if (description.startsWith(`# ${title}\n\n`)) {
      description = description.substring(`# ${title}\n\n`.length)
    } else if (description.startsWith(`# ${title}\n`)) {
      description = description.substring(`# ${title}\n`.length)
    }
    // Check for h2 (## Title)
    else if (description.startsWith(`## ${title}\n\n`)) {
      description = description.substring(`## ${title}\n\n`.length)
    } else if (description.startsWith(`## ${title}\n`)) {
      description = description.substring(`## ${title}\n`.length)
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto max-h-[calc(90vh-180px)]">
      <div className="mx-auto w-full max-w-2xl px-8 py-6">
        {/* Version Header */}
        <div className="mb-6 flex items-start justify-between border-b border-content-tertiary pb-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-background-secondary px-3 py-1 text-sm font-medium text-content-secondary">
                Version {version.versionNumber} of {total}
              </span>
              {index === total - 1 && (
                <span className="rounded-lg bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  Current
                </span>
              )}
            </div>
            <p className="text-sm text-content-secondary">
              Created {timeAgo} • {createdAt.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </p>
          </div>
        </div>

        {/* Update Message */}
        {version.updateMessage && (
          <div className="mb-6 rounded-[12px] border border-content-tertiary bg-background-secondary p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-secondary">Update Message</h4>
            <p className="text-sm leading-relaxed text-content-primary">{version.updateMessage}</p>
          </div>
        )}

        {/* Version Content - styled like a mini proposal */}
        <div className="flex flex-col gap-8">
          {/* Title */}
          <div className="flex flex-col gap-3">
            <h1 className="heading-3 text-content-primary">{version.title}</h1>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-3">
            <div className="prose prose-sm max-w-none text-content-primary">
              <MarkdownRenderer>{description}</MarkdownRenderer>
            </div>
          </div>

          {/* Proposal Actions */}
          {version.details.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="heading-6 text-content-primary">Proposal Actions</h2>
              <ProposalTransactionSummary
                transactions={version.details}
                proposalState="executed"
              />
            </div>
          )}

          {/* Changes from Previous Version */}
          {index > 0 && (
            <div className="flex flex-col gap-4 border-t border-content-tertiary pt-6">
              <h2 className="heading-6 text-content-primary">
                Changes from Version {version.versionNumber - 1}
              </h2>
              <VersionDiff currentVersion={version} previousVersion={previousVersion} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CarouselNavigation({ api }: { api: CarouselApi | null }) {
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!api) return

    const updateScrollState = () => {
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
      setSelectedIndex(api.selectedScrollSnap())
    }

    updateScrollState()
    api.on('select', updateScrollState)
    api.on('reInit', updateScrollState)

    return () => {
      api.off('select', updateScrollState)
      api.off('reInit', updateScrollState)
    }
  }, [api])

  const scrollPrev = () => api?.scrollPrev()
  const scrollNext = () => api?.scrollNext()

  return (
    <div className="flex items-center justify-between border-t border-content-tertiary px-8 py-4">
      <Button
        variant="ghost"
        size="fit"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        className="flex items-center gap-2 px-3 py-2"
      >
        <ChevronLeft size={16} />
        Previous
      </Button>

      <div className="flex items-center gap-2">
        {Array.from({ length: api?.scrollSnapList().length || 0 }).map((_, i) => (
          <button
            key={i}
            onClick={() => api?.scrollTo(i)}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === selectedIndex
                ? 'bg-content-primary'
                : 'bg-content-secondary hover:bg-content-primary'
            }`}
            aria-label={`Go to version ${i + 1}`}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        size="fit"
        onClick={scrollNext}
        disabled={!canScrollNext}
        className="flex items-center gap-2 px-3 py-2"
      >
        Next
        <ChevronRight size={16} />
      </Button>
    </div>
  )
}

export function ProposalVersionHistoryModal({
  versions,
  isOpen,
  onClose,
}: ProposalVersionHistoryModalProps) {
  const [api, setApi] = useState<CarouselApi | null>(null)

  if (!versions || versions.length === 0) {
    return null
  }

  return (
    <DrawerDialog open={isOpen} onOpenChange={onClose}>
      <DrawerDialogContent className="max-h-[90vh] w-full max-w-4xl p-0">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-content-tertiary px-8 py-6 pr-20">
            <DrawerDialogTitle className="heading-5">
              Version History
            </DrawerDialogTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm text-content-secondary">
                {versions.length} {versions.length === 1 ? 'version' : 'versions'}
              </span>
            </div>
          </div>

          {/* Carousel */}
          <div className="flex-1 overflow-hidden min-h-0">
            <Carousel setApi={setApi} className="h-full">
              <CarouselContent className="h-full">
                {versions.map((version, index) => {
                  const previousVersion = index > 0 ? versions[index - 1] : undefined
                  return (
                    <CarouselItem key={version.id} className="h-full pl-0">
                      <VersionCard
                        version={version}
                        previousVersion={previousVersion}
                        index={index}
                        total={versions.length}
                      />
                    </CarouselItem>
                  )
                })}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Navigation */}
          <CarouselNavigation api={api} />
        </div>
      </DrawerDialogContent>
    </DrawerDialog>
  )
}

