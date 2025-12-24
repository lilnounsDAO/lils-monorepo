/**
 * NounsDAOData ABI - V2 with Topics support
 * Includes candidate and topic creation, updates, feedback, and signatures
 */
export const nounsDaoDataAbi = [
  // ============================================
  // CANDIDATE FUNCTIONS
  // ============================================
  {
    inputs: [
      { internalType: "address[]", name: "targets", type: "address[]" },
      { internalType: "uint256[]", name: "values", type: "uint256[]" },
      { internalType: "string[]", name: "signatures", type: "string[]" },
      { internalType: "bytes[]", name: "calldatas", type: "bytes[]" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "string", name: "slug", type: "string" },
      { internalType: "uint256", name: "proposalIdToUpdate", type: "uint256" },
    ],
    name: "createProposalCandidate",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address[]", name: "targets", type: "address[]" },
      { internalType: "uint256[]", name: "values", type: "uint256[]" },
      { internalType: "string[]", name: "signatures", type: "string[]" },
      { internalType: "bytes[]", name: "calldatas", type: "bytes[]" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "string", name: "slug", type: "string" },
      { internalType: "uint256", name: "proposalIdToUpdate", type: "uint256" },
      { internalType: "string", name: "reason", type: "string" },
    ],
    name: "updateProposalCandidate",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "slug", type: "string" },
    ],
    name: "cancelProposalCandidate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "proposer", type: "address" },
      { internalType: "string", name: "slug", type: "string" },
      { internalType: "uint8", name: "support", type: "uint8" },
      { internalType: "string", name: "reason", type: "string" },
    ],
    name: "sendCandidateFeedback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes", name: "sig", type: "bytes" },
      { internalType: "uint256", name: "expirationTimestamp", type: "uint256" },
      { internalType: "address", name: "proposer", type: "address" },
      { internalType: "string", name: "slug", type: "string" },
      { internalType: "uint256", name: "proposalIdToUpdate", type: "uint256" },
      { internalType: "bytes", name: "encodedProp", type: "bytes" },
      { internalType: "string", name: "reason", type: "string" },
    ],
    name: "addSignature",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ============================================
  // TOPIC FUNCTIONS (V2 Only)
  // ============================================
  {
    inputs: [
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "string", name: "slug", type: "string" },
    ],
    name: "createTopic",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "slug", type: "string" },
    ],
    name: "cancelTopic",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "string", name: "slug", type: "string" },
      { internalType: "uint8", name: "support", type: "uint8" },
      { internalType: "string", name: "reason", type: "string" },
    ],
    name: "sendTopicFeedback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes", name: "sig", type: "bytes" },
      { internalType: "uint256", name: "expirationTimestamp", type: "uint256" },
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "string", name: "slug", type: "string" },
      { internalType: "bytes", name: "encodedTopic", type: "bytes" },
      { internalType: "uint8", name: "support", type: "uint8" },
      { internalType: "string", name: "reason", type: "string" },
    ],
    name: "addTopicSignature",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ============================================
  // PROPOSAL FEEDBACK (V1 function)
  // ============================================
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "uint8", name: "support", type: "uint8" },
      { internalType: "string", name: "reason", type: "string" },
    ],
    name: "sendFeedback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ============================================
  // CANDIDATE EVENTS
  // ============================================
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "msgSender", type: "address" },
      { indexed: false, internalType: "address[]", name: "targets", type: "address[]" },
      { indexed: false, internalType: "uint256[]", name: "values", type: "uint256[]" },
      { indexed: false, internalType: "string[]", name: "signatures", type: "string[]" },
      { indexed: false, internalType: "bytes[]", name: "calldatas", type: "bytes[]" },
      { indexed: false, internalType: "string", name: "description", type: "string" },
      { indexed: false, internalType: "string", name: "slug", type: "string" },
      { indexed: false, internalType: "uint256", name: "proposalIdToUpdate", type: "uint256" },
      { indexed: false, internalType: "bytes32", name: "encodedProposalHash", type: "bytes32" },
    ],
    name: "ProposalCandidateCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "msgSender", type: "address" },
      { indexed: false, internalType: "address[]", name: "targets", type: "address[]" },
      { indexed: false, internalType: "uint256[]", name: "values", type: "uint256[]" },
      { indexed: false, internalType: "string[]", name: "signatures", type: "string[]" },
      { indexed: false, internalType: "bytes[]", name: "calldatas", type: "bytes[]" },
      { indexed: false, internalType: "string", name: "description", type: "string" },
      { indexed: false, internalType: "string", name: "slug", type: "string" },
      { indexed: false, internalType: "uint256", name: "proposalIdToUpdate", type: "uint256" },
      { indexed: false, internalType: "bytes32", name: "encodedProposalHash", type: "bytes32" },
      { indexed: false, internalType: "string", name: "reason", type: "string" },
    ],
    name: "ProposalCandidateUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "msgSender", type: "address" },
      { indexed: false, internalType: "string", name: "slug", type: "string" },
    ],
    name: "ProposalCandidateCanceled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "msgSender", type: "address" },
      { indexed: true, internalType: "address", name: "proposer", type: "address" },
      { indexed: false, internalType: "string", name: "slug", type: "string" },
      { indexed: false, internalType: "uint8", name: "support", type: "uint8" },
      { indexed: false, internalType: "string", name: "reason", type: "string" },
    ],
    name: "CandidateFeedbackSent",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "signer", type: "address" },
      { indexed: false, internalType: "bytes", name: "sig", type: "bytes" },
      { indexed: false, internalType: "uint256", name: "expirationTimestamp", type: "uint256" },
      { indexed: true, internalType: "address", name: "proposer", type: "address" },
      { indexed: false, internalType: "string", name: "slug", type: "string" },
      { indexed: false, internalType: "uint256", name: "proposalIdToUpdate", type: "uint256" },
      { indexed: false, internalType: "bytes32", name: "encodedPropHash", type: "bytes32" },
      { indexed: false, internalType: "bytes32", name: "sigDigest", type: "bytes32" },
      { indexed: false, internalType: "string", name: "reason", type: "string" },
    ],
    name: "SignatureAdded",
    type: "event",
  },

  // ============================================
  // TOPIC EVENTS (V2 Only)
  // ============================================
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "string", name: "title", type: "string" },
      { indexed: false, internalType: "string", name: "description", type: "string" },
      { indexed: false, internalType: "string", name: "slug", type: "string" },
      { indexed: false, internalType: "bytes32", name: "topicHash", type: "bytes32" },
    ],
    name: "TopicCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "string", name: "slug", type: "string" },
    ],
    name: "TopicCanceled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "msgSender", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "string", name: "slug", type: "string" },
      { indexed: false, internalType: "uint8", name: "support", type: "uint8" },
      { indexed: false, internalType: "string", name: "reason", type: "string" },
    ],
    name: "TopicFeedbackSent",
    type: "event",
  },

  // ============================================
  // PROPOSAL FEEDBACK EVENT (V1)
  // ============================================
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "msgSender", type: "address" },
      { indexed: true, internalType: "uint256", name: "proposalId", type: "uint256" },
      { indexed: false, internalType: "uint8", name: "support", type: "uint8" },
      { indexed: false, internalType: "string", name: "reason", type: "string" },
    ],
    name: "FeedbackSent",
    type: "event",
  },
] as const;
