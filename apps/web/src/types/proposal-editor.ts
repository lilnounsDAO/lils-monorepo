/**
 * TypeScript type definitions for the proposal editor
 */

import { Address, Hash } from 'viem'

// ============================================================================
// Action Types
// ============================================================================

export interface OneTimePaymentAction {
  type: 'one-time-payment'
  target: Address
  amount: string // Human-readable amount like "1.5"
  currency: 'eth' | 'weth' | 'usdc' | 'steth' | 'reth' | 'oeth'
}

export interface StreamingPaymentAction {
  type: 'streaming-payment'
  target: Address
  amount: string
  currency: 'weth' | 'usdc' | 'steth' | 'reth' | 'oeth'
  startTimestamp: number
  endTimestamp: number
  predictedStreamContractAddress: Address
}

export interface CustomTransactionAction {
  type: 'custom-transaction'
  contractCallTarget: Address
  contractCallSignature: string // e.g. "transfer(address,uint256)"
  contractCallArguments: any[]
  contractCallValue: string // ETH value in wei as string
  contractCallCustomAbiString?: string
}

export interface TreasuryNounTransferAction {
  type: 'treasury-noun-transfer'
  nounId: string
  target: Address
}

export interface PayerTopUpAction {
  type: 'payer-top-up'
  amount: string
  currency: 'eth' | 'steth' | 'reth' | 'oeth'
}

export type Action =
  | OneTimePaymentAction
  | StreamingPaymentAction
  | CustomTransactionAction
  | TreasuryNounTransferAction
  | PayerTopUpAction

// ============================================================================
// Transaction Types
// ============================================================================

export interface Transaction {
  target: Address
  value: bigint
  signature?: string
  calldata: string
}

export interface SimulationResult {
  success: boolean
  gasUsed?: number
  error?: string
}

// ============================================================================
// Draft Types
// ============================================================================

export interface Draft {
  id: string
  name: string
  body: string | RichTextNode[]
  actions: Action[] | null // null for topics
  createdAt?: number
  updatedAt?: number
}

export interface DraftStore {
  schema: number
  entriesById: Record<string, Draft>
}

// ============================================================================
// Rich Text Types
// ============================================================================

export interface RichTextNode {
  type: string
  children?: RichTextNode[]
  text?: string
  bold?: boolean
  italic?: boolean
  code?: boolean
  url?: string
  [key: string]: any
}

export type RichTextElement =
  | { type: 'paragraph'; children: RichTextNode[] }
  | { type: 'heading-one'; children: RichTextNode[] }
  | { type: 'heading-two'; children: RichTextNode[] }
  | { type: 'heading-three'; children: RichTextNode[] }
  | { type: 'bulleted-list'; children: RichTextNode[] }
  | { type: 'numbered-list'; children: RichTextNode[] }
  | { type: 'list-item'; children: RichTextNode[] }
  | { type: 'code-block'; children: RichTextNode[] }
  | { type: 'quote'; children: RichTextNode[] }
  | { type: 'link'; url: string; children: RichTextNode[] }
  | { type: 'image'; url: string; children: RichTextNode[] }

// ============================================================================
// Proposal & Candidate Types
// ============================================================================

export interface Proposal {
  id: string
  proposerId: Address
  description: string
  targets: Address[]
  values: bigint[]
  signatures: string[]
  calldatas: string[]
  startBlock: bigint
  endBlock: bigint
  forVotes: bigint
  againstVotes: bigint
  abstainVotes: bigint
  canceled: boolean
  executed: boolean
  signers?: Address[]
  createdAt: number
}

export interface ProposalCandidate {
  id: string
  slug: string
  proposerId: Address
  latestVersion: {
    content: {
      description: string
      transactions: Transaction[]
    }
  }
  signatures: Signature[]
  createdAt: number
}

export interface Signature {
  sig: string
  signer: Delegate
  expirationTimestamp: Date
  reason?: string
  canceled: boolean
}

export interface Delegate {
  id: Address
  nounsRepresented: Array<{ id: string }>
}

// ============================================================================
// Contract Types
// ============================================================================

export interface ContractInfo {
  address: Address
  chainId: number
  abi?: any[]
  name?: string
  implementationAbi?: any[]
}

export interface ContractConfig {
  dao: ContractInfo
  executor: ContractInfo
  token: ContractInfo
  payer: ContractInfo
  'token-buyer': ContractInfo
  'stream-factory': ContractInfo
  'weth-token': ContractInfo
  'usdc-token': ContractInfo
  'steth-token': ContractInfo
  [key: string]: ContractInfo
}

// ============================================================================
// Form Config Types
// ============================================================================

export interface FormConfig<TState = any> {
  title: string
  description?: string
  selectable?: boolean
  initialState: (ctx: { action?: Action; publicClient?: any }) => TState
  useStateMiddleware?: (ctx: { state: TState }) => TState
  hasRequiredInputs: (ctx: { state: TState }) => boolean
  buildAction: (ctx: { state: TState; publicClient?: any }) => Promise<Action> | Action
  Component: React.ComponentType<{
    state: TState
    setState: (update: Partial<TState> | ((prev: TState) => Partial<TState>)) => void
  }>
}

// ============================================================================
// Store Types
// ============================================================================

export interface AppState {
  proposals: Map<string, Proposal>
  proposalCandidates: Map<string, ProposalCandidate>
  delegates: Map<Address, Delegate>

  // Actions
  fetchProposal: (id: string) => Promise<void>
  fetchProposalCandidate: (id: string) => Promise<void>
  fetchProposalCandidatesByAccount: (address: Address) => Promise<void>
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseWalletReturn {
  address: Address | undefined
  isConnected: boolean
  chainId?: number
}

export interface UseDraftsReturn {
  items: Draft[]
  createItem: (values?: Partial<Draft>) => Draft
  deleteItem: (id: string) => void
}

export interface UseDraftReturn {
  draft: Draft | null
  setName: (name: string) => void
  setBody: (body: string | RichTextNode[]) => void
  setActions: (actions: Action[] | ((prev: Action[]) => Action[])) => void
}
