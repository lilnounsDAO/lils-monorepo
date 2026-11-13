import React, { useDeferredValue, useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Address } from 'viem'
import {
  DrawerDialog,
  DrawerDialogContent,
  DrawerDialogContentInner,
  DrawerDialogTitle,
} from '@/components/ui/DrawerDialog'
import { Button } from '@/components/ui/button'
import { EnsAvatar } from '@/components/EnsAvatar'
import { EnsName } from '@/components/EnsName'
import { VoteBar } from '@/components/VoteBar'
import { VoterStats, VoteSupport } from '@/data/goldsky/governance/getVoterIndex'
import {
  displayName,
  isLookupQuery,
  LookupResult,
  matchRank,
  useAddressLookup,
  useVoterIndex,
} from '@/hooks/useVoterIndex'
import {
  againstVotesToDefeat,
  dynamicQuorumVotes,
  forVotesToPass,
  isPassing,
  useQuorumSnapshot,
} from '@/hooks/useQuorumSnapshot'

const RECENT_PROPOSALS = 20
const PAGE = 50
const SUGGESTIONS = 8

type Bucket = VoteSupport | 'pool'

const SUPPORT_META: Record<VoteSupport, { label: string; short: string; text: string; border: string; bg: string }> = {
  1: { label: 'For', short: 'F', text: 'text-semantic-positive', border: 'border-semantic-positive', bg: 'bg-green-50' },
  0: { label: 'Against', short: 'A', text: 'text-semantic-negative', border: 'border-semantic-negative', bg: 'bg-red-50' },
  2: { label: 'Abstain', short: 'Ab', text: 'text-content-secondary', border: 'border-gray-400', bg: 'bg-gray-50' },
}

const COLUMNS: VoteSupport[] = [1, 0, 2]

type SortKey = 'recent' | 'active' | 'votes'

interface SimulateVotesDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
}

/** A looked-up address as an entry in the list, keeping any voting history the index has for it. */
function fromLookup(lookup: LookupResult, known?: VoterStats): VoterStats {
  return {
    address: lookup.address,
    ensName: lookup.ensName ?? known?.ensName ?? null,
    currentVotes: lookup.currentVotes,
    tokenBalance: lookup.tokenBalance,
    delegate: lookup.delegate,
    propsVoted: known?.propsVoted ?? 0,
    recentPropsVoted: known?.recentPropsVoted ?? 0,
    lastVotedAt: known?.lastVotedAt ?? 0,
    counts: known?.counts ?? { 0: 0, 1: 0, 2: 0 },
    mostFrequent: known?.mostFrequent ?? null,
  }
}

function timeAgo(ms: number): string {
  const minutes = Math.round((Date.now() - ms) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`
}

const SimulateVotesDialog: React.FC<SimulateVotesDialogProps> = ({ isOpen, onClose, title }) => {
  // Mounted with the editor, so the index hydrates from cache and refreshes
  // before the dialog is ever opened
  const {
    data: indexed,
    isLoading: loadingVoters,
    isError,
    isFetching,
    dataUpdatedAt,
  } = useVoterIndex(RECENT_PROPOSALS)
  const { totalSupply, params, isLoading: loadingQuorum } = useQuorumSnapshot()

  const [placements, setPlacements] = useState<Record<Address, VoteSupport>>({})
  // People found by pasting an address or ENS name, with on-chain figures
  // that override the index's
  const [lookedUp, setLookedUp] = useState<Record<Address, VoterStats>>({})
  const [dragOver, setDragOver] = useState<Bucket | null>(null)
  const [search, setSearch] = useState('')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [sort, setSort] = useState<SortKey>('recent')
  const [shown, setShown] = useState(PAGE)
  const query = useDeferredValue(search)
  // The chain is only asked once typing pauses, not for every partial name
  const [lookupQuery, setLookupQuery] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setLookupQuery(search), 350)
    return () => clearTimeout(timer)
  }, [search])

  const voters = useMemo(() => {
    const merged = new Map((indexed ?? []).map((v) => [v.address, v]))
    for (const [address, voter] of Object.entries(lookedUp)) merged.set(address as Address, voter)
    return Array.from(merged.values())
  }, [indexed, lookedUp])

  const byAddress = useMemo(() => new Map(voters.map((v) => [v.address, v])), [voters])

  const { data: lookup, isFetching: lookingUp } = useAddressLookup(lookupQuery)
  const lookupVoter = lookup ? fromLookup(lookup, byAddress.get(lookup.address)) : null

  const tally = useMemo(() => {
    const t: Record<VoteSupport, number> = { 0: 0, 1: 0, 2: 0 }
    for (const [address, support] of Object.entries(placements)) {
      t[support] += byAddress.get(address as Address)?.currentVotes ?? 0
    }
    return t
  }, [placements, byAddress])

  const place = (address: Address, bucket: Bucket) =>
    setPlacements((prev) => {
      const next = { ...prev }
      if (bucket === 'pool') delete next[address]
      else next[address] = bucket
      return next
    })

  // Placing a looked-up person keeps them, and their on-chain votes, in the list
  const placeVoter = (voter: VoterStats, bucket: Bucket) => {
    if (lookupVoter?.address === voter.address) {
      setLookedUp((prev) => ({ ...prev, [voter.address]: voter }))
    }
    place(voter.address, bucket)
  }

  const placeByHabit = () =>
    setPlacements(
      Object.fromEntries(
        voters
          .filter((v) => v.currentVotes > 0 && v.recentPropsVoted > 0 && v.mostFrequent !== null)
          .map((v) => [v.address, v.mostFrequent as VoteSupport]),
      ),
    )

  const matches = useMemo(() => {
    const ranked: { voter: VoterStats; rank: number }[] = []
    for (const voter of voters) {
      if (placements[voter.address] !== undefined) continue
      const rank = matchRank(voter, query)
      if (rank !== null) ranked.push({ voter, rank })
    }
    return ranked
  }, [voters, placements, query])

  const pool = useMemo(
    () =>
      matches
        .slice()
        .sort(
          (a, b) =>
            // While searching, the closest matches lead
            (query.trim() ? a.rank - b.rank : 0) ||
            // Voters who hold no votes today can't move the outcome, keep them at the bottom
            Number(b.voter.currentVotes > 0) - Number(a.voter.currentVotes > 0) ||
            (sort === 'votes'
              ? b.voter.currentVotes - a.voter.currentVotes || b.voter.lastVotedAt - a.voter.lastVotedAt
              : sort === 'active'
                ? b.voter.propsVoted - a.voter.propsVoted || b.voter.currentVotes - a.voter.currentVotes
                : b.voter.recentPropsVoted - a.voter.recentPropsVoted ||
                  b.voter.lastVotedAt - a.voter.lastVotedAt ||
                  b.voter.currentVotes - a.voter.currentVotes),
        )
        .map((m) => m.voter),
    [matches, sort, query],
  )

  // Autocomplete: best name and address matches, those with votes first
  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    return matches
      .slice()
      .sort((a, b) => a.rank - b.rank || b.voter.currentVotes - a.voter.currentVotes)
      .slice(0, SUGGESTIONS)
      .map((m) => m.voter)
  }, [matches, query])

  // A pasted address or name the index doesn't know yet (or knows with stale
  // figures) is shown from the chain; nothing at all when it holds no votes
  const showLookup =
    lookupVoter !== null &&
    placements[lookupVoter.address] === undefined &&
    lookupQuery.trim() === search.trim() &&
    isLookupQuery(search)

  const ready = totalSupply !== undefined && params !== undefined
  const quorum = ready ? dynamicQuorumVotes(tally[0], totalSupply, params) : 0
  const minQuorum = ready ? dynamicQuorumVotes(0, totalSupply, params) : 0
  const maxQuorum = ready ? Math.floor((totalSupply * params.maxQuorumVotesBPS) / 10000) : 0
  const passing = ready && isPassing(tally[1], tally[0], totalSupply, params)
  const toPass = ready ? forVotesToPass(tally[1], tally[0], totalSupply, params) : 0
  const toDefeat = ready ? againstVotesToDefeat(tally[1], tally[0], totalSupply, params) : 0

  const chooseSuggestion = (voter: VoterStats) => {
    setSearch(displayName(voter) ?? voter.address)
    setSuggestionsOpen(false)
    setShown(PAGE)
  }

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestionsOpen || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      chooseSuggestion(suggestions[Math.min(highlighted, suggestions.length - 1)])
    } else if (e.key === 'Escape') {
      e.stopPropagation()
      setSuggestionsOpen(false)
    }
  }

  const dropProps = (bucket: Bucket) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (dragOver !== bucket) setDragOver(bucket)
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null)
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      const address = e.dataTransfer.getData('text/plain') as Address
      const voter = byAddress.get(address) ?? (lookupVoter?.address === address ? lookupVoter : undefined)
      if (voter) placeVoter(voter, bucket)
      setDragOver(null)
    },
  })

  return (
    <DrawerDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerDialogContent className="md:max-w-[min(1100px,95vw)]">
        <DrawerDialogContentInner className="items-stretch gap-5">
          <div className="pr-10">
            <DrawerDialogTitle className="heading-4">Simulate votes</DrawerDialogTitle>
            <p className="mt-1 text-sm text-content-secondary">
              {title?.trim() ? `"${title.trim()}" if` : 'If'} proposed now.{' '}
              Drag voters onto a side. Every past voter, delegate and holder is listed, most active in the last{' '}
              {RECENT_PROPOSALS} proposals first. Vote weights are their current delegated votes.
            </p>
          </div>

          {/* Outcome */}
          <div className="flex flex-col gap-3 rounded-[12px] border border-gray-200 p-4">
            {loadingQuorum || !ready ? (
              <p className="text-sm text-content-secondary">Loading quorum…</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={clsx(
                      'rounded-[6px] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
                      passing ? 'bg-green-100 text-semantic-positive' : 'bg-red-100 text-semantic-negative',
                    )}
                  >
                    {passing ? 'Would pass' : 'Would fail'}
                  </span>
                  <span className="text-sm font-bold">
                    {passing
                      ? `${toDefeat} more against vote${toDefeat === 1 ? '' : 's'} would defeat it`
                      : `Needs ${toPass} more for vote${toPass === 1 ? '' : 's'} to pass`}
                  </span>
                </div>
                <VoteBar
                  size="lg"
                  forVotes={tally[1]}
                  againstVotes={tally[0]}
                  abstainVotes={tally[2]}
                  quorumVotes={quorum}
                  className="my-1"
                />
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-content-secondary">
                  <span>
                    <b className="text-semantic-positive">{tally[1]}</b> for / <b className="text-semantic-warning">{quorum}</b> quorum
                  </span>
                  <span>
                    <b className="text-semantic-negative">{tally[0]}</b> against
                  </span>
                  <span>
                    <b className="text-content-primary">{tally[2]}</b> abstain
                  </span>
                  <span>
                    Quorum moves {minQuorum}→{maxQuorum} as against grows ({totalSupply} votable supply)
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button className="px-4 py-2" variant="secondary" onClick={placeByHabit} disabled={!voters.length}>
              Place recent voters by usual vote
            </Button>
            <Button className="px-4 py-2" variant="ghost" onClick={() => setPlacements({})} disabled={!Object.keys(placements).length}>
              Reset
            </Button>
            {dataUpdatedAt > 0 && (
              <span className="ml-auto text-xs text-content-secondary">
                {isFetching ? 'Refreshing voters…' : `Voters updated ${timeAgo(dataUpdatedAt)}`}
              </span>
            )}
          </div>

          <div className="grid shrink-0 grid-cols-1 gap-4 md:min-h-0 md:shrink md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
            {/* Voter pool */}
            <div
              {...dropProps('pool')}
              className={clsx(
                'flex min-h-[200px] flex-col gap-2 rounded-[12px] border-2 border-dashed p-3 transition-colors',
                dragOver === 'pool' ? 'border-gray-400 bg-gray-50' : 'border-transparent bg-background-secondary',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold uppercase text-content-secondary">
                  Voters{indexed ? ` (${pool.length})` : ''}
                </h3>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as SortKey)
                    setShown(PAGE)
                  }}
                  className="rounded border border-gray-200 bg-white px-2 py-1 text-xs"
                >
                  <option value="recent">Recent first</option>
                  <option value="active">Most active all-time</option>
                  <option value="votes">Most votes</option>
                </select>
              </div>
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setSuggestionsOpen(true)
                    setHighlighted(0)
                    setShown(PAGE)
                  }}
                  onFocus={() => setSuggestionsOpen(true)}
                  onBlur={() => setSuggestionsOpen(false)}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Search name, ENS or address — or paste one"
                  role="combobox"
                  aria-expanded={suggestionsOpen && suggestions.length > 0}
                  aria-autocomplete="list"
                  className="w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-sm"
                />
                {suggestionsOpen && suggestions.length > 0 && (
                  <ul
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-[8px] border border-gray-200 bg-white py-1 shadow-lg"
                  >
                    {suggestions.map((voter, i) => (
                      <li
                        key={voter.address}
                        role="option"
                        aria-selected={i === highlighted}
                        // Before the input's blur, which would close the list first
                        onMouseDown={(e) => {
                          e.preventDefault()
                          chooseSuggestion(voter)
                        }}
                        onMouseEnter={() => setHighlighted(i)}
                        className={clsx(
                          'flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm',
                          i === highlighted && 'bg-gray-100',
                        )}
                      >
                        <EnsAvatar address={voter.address} size={18} />
                        <span className="min-w-0 flex-1 truncate font-semibold">
                          {displayName(voter) ?? `${voter.address.slice(0, 6)}…${voter.address.slice(-4)}`}
                        </span>
                        <span className="shrink-0 text-xs text-content-secondary">
                          {voter.currentVotes} vote{voter.currentVotes === 1 ? '' : 's'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex max-h-[45vh] flex-col gap-1.5 overflow-y-auto">
                {lookingUp && isLookupQuery(lookupQuery) && (
                  <p className="text-xs text-content-secondary">Checking on chain…</p>
                )}
                {showLookup && lookupVoter && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase text-content-secondary">On chain now</span>
                    <VoterChip voter={lookupVoter} onPlace={(_, bucket) => placeVoter(lookupVoter, bucket)} />
                  </div>
                )}
                {loadingVoters && <p className="text-sm text-content-secondary">Loading voters and holders…</p>}
                {isError && !indexed && <p className="text-sm text-semantic-negative">Couldn't load voters.</p>}
                {/* A pasted address or name with nothing to bring shows nothing at all */}
                {indexed && pool.length === 0 && !showLookup && !isLookupQuery(search) && (
                  <p className="text-sm text-content-secondary">
                    {query.trim() ? 'No one matches.' : 'Everyone is placed.'}
                  </p>
                )}
                {pool
                  .filter((voter) => !(showLookup && voter.address === lookupVoter?.address))
                  .slice(0, shown)
                  .map((voter) => (
                    <VoterChip key={voter.address} voter={voter} onPlace={place} />
                  ))}
                {pool.length > shown && (
                  <button
                    type="button"
                    onClick={() => setShown((n) => n + PAGE)}
                    className="rounded py-1.5 text-sm font-semibold text-content-secondary hover:bg-gray-100"
                  >
                    Show more ({pool.length - shown} left)
                  </button>
                )}
              </div>
            </div>

            {/* Vote columns */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {COLUMNS.map((support) => {
                const meta = SUPPORT_META[support]
                const placed = voters.filter((v) => placements[v.address] === support)
                return (
                  <div
                    key={support}
                    {...dropProps(support)}
                    className={clsx(
                      'flex min-h-[160px] flex-col gap-1.5 rounded-[12px] border-2 border-dashed p-3 transition-colors',
                      dragOver === support ? clsx(meta.border, meta.bg) : 'border-gray-200',
                    )}
                  >
                    <div className="flex items-baseline justify-between">
                      <h3 className={clsx('text-sm font-semibold uppercase', meta.text)}>{meta.label}</h3>
                      <span className="text-sm font-bold">{tally[support]}</span>
                    </div>
                    {placed.length === 0 && (
                      <p className="text-xs text-content-secondary">Drop voters here</p>
                    )}
                    <div className="flex flex-col gap-1.5 md:max-h-[45vh] md:overflow-y-auto">
                      {placed.map((voter) => (
                        <VoterChip key={voter.address} voter={voter} placed={support} onPlace={place} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </DrawerDialogContentInner>
      </DrawerDialogContent>
    </DrawerDialog>
  )
}

function VoterChip({
  voter,
  placed,
  onPlace,
}: {
  voter: VoterStats
  placed?: VoteSupport
  onPlace: (address: Address, bucket: Bucket) => void
}) {
  const habit = voter.mostFrequent === null ? null : SUPPORT_META[voter.mostFrequent]
  const name = displayName(voter)
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', voter.address)
        e.dataTransfer.effectAllowed = 'move'
      }}
      className="flex cursor-grab items-center gap-2 rounded-[8px] border border-gray-200 bg-white px-2 py-1.5 text-sm active:cursor-grabbing"
    >
      <EnsAvatar address={voter.address} size={20} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* New tab so the simulation and unsaved editor changes survive */}
        <a
          href={`/profile/${voter.address}`}
          target="_blank"
          rel="noopener noreferrer"
          draggable={false}
          className="truncate font-semibold hover:underline"
        >
          {name ?? <EnsName address={voter.address} />}
        </a>
        <span className="text-xs text-content-secondary">
          {voter.currentVotes} vote{voter.currentVotes === 1 ? '' : 's'}
          {voter.delegate && voter.tokenBalance > 0 && (
            <>
              {' '}· holds {voter.tokenBalance}, delegated to <EnsName address={voter.delegate} />
            </>
          )}
          {habit ? (
            <>
              {' '}· {voter.recentPropsVoted}/{RECENT_PROPOSALS} recent ·{' '}
              <span className={habit.text}>
                usually {habit.label.toLowerCase()} {voter.counts[voter.mostFrequent!]}/{voter.propsVoted}
              </span>
            </>
          ) : (
            ' · never voted'
          )}
        </span>
      </div>
      {/* Tap targets for touch screens, where drag and drop isn't available */}
      <div className="flex shrink-0 gap-0.5">
        {placed === undefined ? (
          COLUMNS.map((s) => (
            <button
              key={s}
              type="button"
              title={SUPPORT_META[s].label}
              onClick={() => onPlace(voter.address, s)}
              className={clsx('rounded px-1.5 py-0.5 text-xs font-bold hover:bg-gray-100', SUPPORT_META[s].text)}
            >
              {SUPPORT_META[s].short}
            </button>
          ))
        ) : (
          <button
            type="button"
            title="Remove"
            onClick={() => onPlace(voter.address, 'pool')}
            className="rounded px-1.5 py-0.5 text-xs text-content-secondary hover:bg-gray-100"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

export default SimulateVotesDialog
