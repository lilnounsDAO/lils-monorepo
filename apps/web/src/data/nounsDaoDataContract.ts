// Nouns DAO Data Contract - Temporary placeholder until Lil Nouns sponsorship contract is deployed
// Mainnet: 0xf790a5f59678dd733fb3de93493a91f472ca1365

export const nounsDaoDataAbi = [
  {
    type: 'function',
    name: 'updateProposalCandidateContent',
    inputs: [
      { name: 'proposer', type: 'address' },
      { name: 'slug', type: 'string' },
      { name: 'proposal', type: 'tuple', components: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'targets', type: 'address[]' },
        { name: 'values', type: 'uint256[]' },
        { name: 'signatures', type: 'string[]' },
        { name: 'calldatas', type: 'bytes[]' },
      ]},
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getProposalCandidate',
    inputs: [
      { name: 'proposer', type: 'address' },
      { name: 'slug', type: 'string' },
    ],
    outputs: [
      { name: 'updateMessage', type: 'string' },
      { name: 'content', type: 'tuple', components: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'targets', type: 'address[]' },
        { name: 'values', type: 'uint256[]' },
        { name: 'signatures', type: 'string[]' },
        { name: 'calldatas', type: 'bytes[]' },
      ]},
      { name: 'version', type: 'uint256' },
      { name: 'contentSignatures', type: 'tuple[]', components: [
        { name: 'sig', type: 'bytes' },
        { name: 'signer', type: 'address' },
        { name: 'expirationTimestamp', type: 'uint256' },
        { name: 'canceled', type: 'bool' },
      ]},
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'addSignature',
    inputs: [
      { name: 'proposer', type: 'address' },
      { name: 'slug', type: 'string' },
      { name: 'expirationTimestamp', type: 'uint256' },
      { name: 'sig', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelProposalCandidate',
    inputs: [
      { name: 'proposer', type: 'address' },
      { name: 'slug', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'sendFeedback',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'uint8' },
      { name: 'reason', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'sendCandidateFeedback',
    inputs: [
      { name: 'proposer', type: 'address' },
      { name: 'slug', type: 'string' },
      { name: 'support', type: 'uint8' },
      { name: 'reason', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'ProposalCandidateCreated',
    inputs: [
      { name: 'proposer', type: 'address', indexed: true },
      { name: 'slug', type: 'string', indexed: false },
      { name: 'proposal', type: 'tuple', components: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'targets', type: 'address[]' },
        { name: 'values', type: 'uint256[]' },
        { name: 'signatures', type: 'string[]' },
        { name: 'calldatas', type: 'bytes[]' },
      ], indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ProposalCandidateUpdated',
    inputs: [
      { name: 'proposer', type: 'address', indexed: true },
      { name: 'slug', type: 'string', indexed: false },
      { name: 'updateMessage', type: 'string', indexed: false },
      { name: 'proposal', type: 'tuple', components: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'targets', type: 'address[]' },
        { name: 'values', type: 'uint256[]' },
        { name: 'signatures', type: 'string[]' },
        { name: 'calldatas', type: 'bytes[]' },
      ], indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ProposalCandidateFeedback',
    inputs: [
      { name: 'proposer', type: 'address', indexed: true },
      { name: 'slug', type: 'string', indexed: false },
      { name: 'msgSender', type: 'address', indexed: true },
      { name: 'support', type: 'uint8', indexed: false },
      { name: 'reason', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ProposalCandidateCanceled',
    inputs: [
      { name: 'proposer', type: 'address', indexed: true },
      { name: 'slug', type: 'string', indexed: false },
    ],
  },
] as const

export const nounsDaoDataAddress = '0xf790a5f59678dd733fb3de93493a91f472ca1365' as const

export const nounsDaoDataConfig = {
  address: nounsDaoDataAddress,
  abi: nounsDaoDataAbi,
} as const

