import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// lilVRGDA
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xA2587b1e2626904c8575640512b987Bd3d3B592D)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x080A01A9163186102946c429B89b0c4dcF84159C)
 */
export const lilVrgdaAbi = [
  {
    type: 'function',
    inputs: [
      { name: 'expectedBlockNumber', type: 'uint256' },
      { name: 'expectedNounId', type: 'uint256' },
    ],
    name: 'buyNow',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getCurrentVRGDAPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'nextNounId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'blockNumber', type: 'uint256' }],
    name: 'fetchNoun',
    outputs: [
      { name: 'nounId', type: 'uint256' },
      {
        name: 'seed',
        type: 'tuple',
        components: [
          { name: 'background', type: 'uint48' },
          { name: 'body', type: 'uint48' },
          { name: 'accessory', type: 'uint48' },
          { name: 'head', type: 'uint48' },
          { name: 'glasses', type: 'uint48' },
        ],
      },
      { name: 'svg', type: 'string' },
      { name: 'price', type: 'uint256' },
      { name: 'hash', type: 'bytes32' },
    ],
    stateMutability: 'view',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xA2587b1e2626904c8575640512b987Bd3d3B592D)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x080A01A9163186102946c429B89b0c4dcF84159C)
 */
export const lilVrgdaAddress = {
  1: '0xA2587b1e2626904c8575640512b987Bd3d3B592D',
  11155111: '0x080A01A9163186102946c429B89b0c4dcF84159C',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xA2587b1e2626904c8575640512b987Bd3d3B592D)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x080A01A9163186102946c429B89b0c4dcF84159C)
 */
export const lilVrgdaConfig = {
  address: lilVrgdaAddress,
  abi: lilVrgdaAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// nounsAuctionHouse
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const nounsAuctionHouseAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_nouns', internalType: 'contract INounsToken', type: 'address' },
      { name: '_weth', internalType: 'address', type: 'address' },
      { name: '_duration', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'nounId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      { name: 'extended', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'AuctionBid',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'nounId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'clientId',
        internalType: 'uint32',
        type: 'uint32',
        indexed: true,
      },
    ],
    name: 'AuctionBidWithClientId',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'nounId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'startTime',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'endTime',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AuctionCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'nounId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'endTime',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AuctionExtended',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'minBidIncrementPercentage',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AuctionMinBidIncrementPercentageUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'reservePrice',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AuctionReservePriceUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'nounId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'winner',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AuctionSettled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'nounId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'clientId',
        internalType: 'uint32',
        type: 'uint32',
        indexed: true,
      },
    ],
    name: 'AuctionSettledWithClientId',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'timeBuffer',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AuctionTimeBufferUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'Paused',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'Unpaused',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_TIME_BUFFER',
    outputs: [{ name: '', internalType: 'uint56', type: 'uint56' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'auction',
    outputs: [
      {
        name: '',
        internalType: 'struct INounsAuctionHouseV2.AuctionV2View',
        type: 'tuple',
        components: [
          { name: 'nounId', internalType: 'uint96', type: 'uint96' },
          { name: 'amount', internalType: 'uint128', type: 'uint128' },
          { name: 'startTime', internalType: 'uint40', type: 'uint40' },
          { name: 'endTime', internalType: 'uint40', type: 'uint40' },
          { name: 'bidder', internalType: 'address payable', type: 'address' },
          { name: 'settled', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'auctionStorage',
    outputs: [
      { name: 'nounId', internalType: 'uint96', type: 'uint96' },
      { name: 'clientId', internalType: 'uint32', type: 'uint32' },
      { name: 'amount', internalType: 'uint128', type: 'uint128' },
      { name: 'startTime', internalType: 'uint40', type: 'uint40' },
      { name: 'endTime', internalType: 'uint40', type: 'uint40' },
      { name: 'bidder', internalType: 'address payable', type: 'address' },
      { name: 'settled', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'nounId', internalType: 'uint256', type: 'uint256' }],
    name: 'biddingClient',
    outputs: [{ name: '', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'nounId', internalType: 'uint256', type: 'uint256' }],
    name: 'createBid',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'nounId', internalType: 'uint256', type: 'uint256' },
      { name: 'clientId', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'createBid',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'duration',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'auctionCount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getPrices',
    outputs: [{ name: 'prices', internalType: 'uint256[]', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'auctionCount', internalType: 'uint256', type: 'uint256' },
      { name: 'skipEmptyValues', internalType: 'bool', type: 'bool' },
    ],
    name: 'getSettlements',
    outputs: [
      {
        name: 'settlements',
        internalType: 'struct INounsAuctionHouseV2.Settlement[]',
        type: 'tuple[]',
        components: [
          { name: 'blockTimestamp', internalType: 'uint32', type: 'uint32' },
          { name: 'amount', internalType: 'uint256', type: 'uint256' },
          { name: 'winner', internalType: 'address', type: 'address' },
          { name: 'nounId', internalType: 'uint256', type: 'uint256' },
          { name: 'clientId', internalType: 'uint32', type: 'uint32' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'startId', internalType: 'uint256', type: 'uint256' },
      { name: 'endId', internalType: 'uint256', type: 'uint256' },
      { name: 'skipEmptyValues', internalType: 'bool', type: 'bool' },
    ],
    name: 'getSettlements',
    outputs: [
      {
        name: 'settlements',
        internalType: 'struct INounsAuctionHouseV2.Settlement[]',
        type: 'tuple[]',
        components: [
          { name: 'blockTimestamp', internalType: 'uint32', type: 'uint32' },
          { name: 'amount', internalType: 'uint256', type: 'uint256' },
          { name: 'winner', internalType: 'address', type: 'address' },
          { name: 'nounId', internalType: 'uint256', type: 'uint256' },
          { name: 'clientId', internalType: 'uint32', type: 'uint32' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'startId', internalType: 'uint256', type: 'uint256' },
      { name: 'endTimestamp', internalType: 'uint256', type: 'uint256' },
      { name: 'skipEmptyValues', internalType: 'bool', type: 'bool' },
    ],
    name: 'getSettlementsFromIdtoTimestamp',
    outputs: [
      {
        name: 'settlements',
        internalType: 'struct INounsAuctionHouseV2.Settlement[]',
        type: 'tuple[]',
        components: [
          { name: 'blockTimestamp', internalType: 'uint32', type: 'uint32' },
          { name: 'amount', internalType: 'uint256', type: 'uint256' },
          { name: 'winner', internalType: 'address', type: 'address' },
          { name: 'nounId', internalType: 'uint256', type: 'uint256' },
          { name: 'clientId', internalType: 'uint32', type: 'uint32' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_reservePrice', internalType: 'uint192', type: 'uint192' },
      { name: '_timeBuffer', internalType: 'uint56', type: 'uint56' },
      {
        name: '_minBidIncrementPercentage',
        internalType: 'uint8',
        type: 'uint8',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'minBidIncrementPercentage',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'nouns',
    outputs: [
      { name: '', internalType: 'contract INounsToken', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'paused',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'reservePrice',
    outputs: [{ name: '', internalType: 'uint192', type: 'uint192' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_minBidIncrementPercentage',
        internalType: 'uint8',
        type: 'uint8',
      },
    ],
    name: 'setMinBidIncrementPercentage',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'settlements',
        internalType: 'struct INounsAuctionHouseV2.SettlementNoClientId[]',
        type: 'tuple[]',
        components: [
          { name: 'blockTimestamp', internalType: 'uint32', type: 'uint32' },
          { name: 'amount', internalType: 'uint256', type: 'uint256' },
          { name: 'winner', internalType: 'address', type: 'address' },
          { name: 'nounId', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    name: 'setPrices',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_reservePrice', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'setReservePrice',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_timeBuffer', internalType: 'uint56', type: 'uint56' }],
    name: 'setTimeBuffer',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'settleAuction',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'settleCurrentAndCreateNewAuction',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'timeBuffer',
    outputs: [{ name: '', internalType: 'uint56', type: 'uint56' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'startId', internalType: 'uint256', type: 'uint256' },
      { name: 'endId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'warmUpSettlementState',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'weth',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const nounsAuctionHouseAddress = {
  1: '0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E',
  11155111: '0x0000000000000000000000000000000000000000',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const nounsAuctionHouseConfig = {
  address: nounsAuctionHouseAddress,
  abi: nounsAuctionHouseAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// nounsDaoData
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const nounsDaoDataAbi = [
  {
    type: 'function',
    inputs: [
      { name: 'proposalId', internalType: 'uint256', type: 'uint256' },
      { name: 'support', internalType: 'uint8', type: 'uint8' },
      { name: 'reason', internalType: 'string', type: 'string' },
    ],
    name: 'sendFeedback',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'creator', internalType: 'address', type: 'address' },
      { name: 'slug', internalType: 'string', type: 'string' },
      { name: 'support', internalType: 'uint8', type: 'uint8' },
      { name: 'reason', internalType: 'string', type: 'string' },
    ],
    name: 'sendTopicFeedback',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sig', internalType: 'bytes', type: 'bytes' },
      { name: 'expirationTimestamp', internalType: 'uint256', type: 'uint256' },
      { name: 'creator', internalType: 'address', type: 'address' },
      { name: 'slug', internalType: 'string', type: 'string' },
      { name: 'encodedTopic', internalType: 'bytes', type: 'bytes' },
      { name: 'support', internalType: 'uint8', type: 'uint8' },
      { name: 'reason', internalType: 'string', type: 'string' },
    ],
    name: 'addTopicSignature',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'msgSender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'proposer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'slug', internalType: 'string', type: 'string', indexed: false },
      { name: 'support', internalType: 'uint8', type: 'uint8', indexed: false },
      {
        name: 'reason',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'CandidateFeedbackSent',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldCreateCandidateCost',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newCreateCandidateCost',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'CreateCandidateCostSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldCreateTopicCost',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newCreateTopicCost',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'CreateTopicCostSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ETHWithdrawn',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldFeeRecipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newFeeRecipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'FeeRecipientSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'msgSender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'proposalId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      { name: 'support', internalType: 'uint8', type: 'uint8', indexed: false },
      {
        name: 'reason',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'FeedbackSent',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'msgSender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'slug', internalType: 'string', type: 'string', indexed: false },
    ],
    name: 'ProposalCandidateCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'msgSender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'targets',
        internalType: 'address[]',
        type: 'address[]',
        indexed: false,
      },
      {
        name: 'values',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false,
      },
      {
        name: 'signatures',
        internalType: 'string[]',
        type: 'string[]',
        indexed: false,
      },
      {
        name: 'calldatas',
        internalType: 'bytes[]',
        type: 'bytes[]',
        indexed: false,
      },
      {
        name: 'description',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      { name: 'slug', internalType: 'string', type: 'string', indexed: false },
      {
        name: 'proposalIdToUpdate',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'encodedProposalHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
    ],
    name: 'ProposalCandidateCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'msgSender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'targets',
        internalType: 'address[]',
        type: 'address[]',
        indexed: false,
      },
      {
        name: 'values',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false,
      },
      {
        name: 'signatures',
        internalType: 'string[]',
        type: 'string[]',
        indexed: false,
      },
      {
        name: 'calldatas',
        internalType: 'bytes[]',
        type: 'bytes[]',
        indexed: false,
      },
      {
        name: 'description',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      { name: 'slug', internalType: 'string', type: 'string', indexed: false },
      {
        name: 'proposalIdToUpdate',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'encodedProposalHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'reason',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'ProposalCandidateUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'signer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'sig', internalType: 'bytes', type: 'bytes', indexed: false },
      {
        name: 'expirationTimestamp',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'proposer',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      { name: 'slug', internalType: 'string', type: 'string', indexed: false },
      {
        name: 'proposalIdToUpdate',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'encodedPropHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'sigDigest',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'reason',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'SignatureAdded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'msgSender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'slug', internalType: 'string', type: 'string', indexed: false },
    ],
    name: 'TopicCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'msgSender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'title', internalType: 'string', type: 'string', indexed: false },
      {
        name: 'description',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      { name: 'slug', internalType: 'string', type: 'string', indexed: false },
      {
        name: 'topicHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
    ],
    name: 'TopicCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'msgSender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'creator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'slug', internalType: 'string', type: 'string', indexed: false },
      { name: 'support', internalType: 'uint8', type: 'uint8', indexed: false },
      {
        name: 'reason',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'TopicFeedbackSent',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'signer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'sig', internalType: 'bytes', type: 'bytes', indexed: false },
      {
        name: 'expirationTimestamp',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'creator',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      { name: 'slug', internalType: 'string', type: 'string', indexed: false },
      {
        name: 'topicHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'sigDigest',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      { name: 'support', internalType: 'uint8', type: 'uint8', indexed: false },
      {
        name: 'reason',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'TopicSignatureAdded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldUpdateCandidateCost',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newUpdateCandidateCost',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'UpdateCandidateCostSet',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const nounsDaoDataAddress = {
  1: '0x0000000000000000000000000000000000000000',
  11155111: '0x6CaC39a113A498e5C82B31b466299f080aeD4F6F',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const nounsDaoDataConfig = {
  address: nounsDaoDataAddress,
  abi: nounsDaoDataAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// nounsDaoLogic
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const nounsDaoLogicAbi = [
  { type: 'error', inputs: [], name: 'AdminOnly' },
  { type: 'error', inputs: [], name: 'CantCancelExecutedProposal' },
  { type: 'error', inputs: [], name: 'CantVetoExecutedProposal' },
  { type: 'error', inputs: [], name: 'InvalidMaxQuorumVotesBPS' },
  { type: 'error', inputs: [], name: 'InvalidMinQuorumVotesBPS' },
  { type: 'error', inputs: [], name: 'MinQuorumBPSGreaterThanMaxQuorumBPS' },
  { type: 'error', inputs: [], name: 'PendingVetoerOnly' },
  { type: 'error', inputs: [], name: 'UnsafeUint16Cast' },
  { type: 'error', inputs: [], name: 'VetoerBurned' },
  { type: 'error', inputs: [], name: 'VetoerOnly' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldMaxQuorumVotesBPS',
        internalType: 'uint16',
        type: 'uint16',
        indexed: false,
      },
      {
        name: 'newMaxQuorumVotesBPS',
        internalType: 'uint16',
        type: 'uint16',
        indexed: false,
      },
    ],
    name: 'MaxQuorumVotesBPSSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldMinQuorumVotesBPS',
        internalType: 'uint16',
        type: 'uint16',
        indexed: false,
      },
      {
        name: 'newMinQuorumVotesBPS',
        internalType: 'uint16',
        type: 'uint16',
        indexed: false,
      },
    ],
    name: 'MinQuorumVotesBPSSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldAdmin',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'newAdmin',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'NewAdmin',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldImplementation',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'newImplementation',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'NewImplementation',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldPendingAdmin',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'newPendingAdmin',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'NewPendingAdmin',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldPendingVetoer',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'newPendingVetoer',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'NewPendingVetoer',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldVetoer',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'newVetoer',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'NewVetoer',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'ProposalCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: false },
      {
        name: 'proposer',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'targets',
        internalType: 'address[]',
        type: 'address[]',
        indexed: false,
      },
      {
        name: 'values',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false,
      },
      {
        name: 'signatures',
        internalType: 'string[]',
        type: 'string[]',
        indexed: false,
      },
      {
        name: 'calldatas',
        internalType: 'bytes[]',
        type: 'bytes[]',
        indexed: false,
      },
      {
        name: 'startBlock',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'endBlock',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'description',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'ProposalCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: false },
      {
        name: 'proposer',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'targets',
        internalType: 'address[]',
        type: 'address[]',
        indexed: false,
      },
      {
        name: 'values',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false,
      },
      {
        name: 'signatures',
        internalType: 'string[]',
        type: 'string[]',
        indexed: false,
      },
      {
        name: 'calldatas',
        internalType: 'bytes[]',
        type: 'bytes[]',
        indexed: false,
      },
      {
        name: 'startBlock',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'endBlock',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'proposalThreshold',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'quorumVotes',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'description',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'ProposalCreatedWithRequirements',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'ProposalExecuted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'eta', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'ProposalQueued',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldProposalThresholdBPS',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newProposalThresholdBPS',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ProposalThresholdBPSSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'ProposalVetoed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldQuorumCoefficient',
        internalType: 'uint32',
        type: 'uint32',
        indexed: false,
      },
      {
        name: 'newQuorumCoefficient',
        internalType: 'uint32',
        type: 'uint32',
        indexed: false,
      },
    ],
    name: 'QuorumCoefficientSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldQuorumVotesBPS',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newQuorumVotesBPS',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'QuorumVotesBPSSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'voter',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'refundAmount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'refundSent',
        internalType: 'bool',
        type: 'bool',
        indexed: false,
      },
    ],
    name: 'RefundableVote',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'voter',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'proposalId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      { name: 'support', internalType: 'uint8', type: 'uint8', indexed: false },
      {
        name: 'votes',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'reason',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'VoteCast',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldVotingDelay',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newVotingDelay',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'VotingDelaySet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldVotingPeriod',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newVotingPeriod',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'VotingPeriodSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      { name: 'sent', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'Withdraw',
  },
  {
    type: 'function',
    inputs: [],
    name: 'BALLOT_TYPEHASH',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DOMAIN_TYPEHASH',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_PROPOSAL_THRESHOLD_BPS',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_QUORUM_VOTES_BPS',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_QUORUM_VOTES_BPS_UPPER_BOUND',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_REFUND_BASE_FEE',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_REFUND_GAS_USED',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_REFUND_PRIORITY_FEE',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_VOTING_DELAY',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_VOTING_PERIOD',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MIN_PROPOSAL_THRESHOLD_BPS',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MIN_QUORUM_VOTES_BPS_LOWER_BOUND',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MIN_QUORUM_VOTES_BPS_UPPER_BOUND',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MIN_VOTING_DELAY',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MIN_VOTING_PERIOD',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'REFUND_BASE_GAS',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: '_acceptAdmin',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: '_acceptVetoer',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: '_burnVetoPower',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newMinQuorumVotesBPS', internalType: 'uint16', type: 'uint16' },
      { name: 'newMaxQuorumVotesBPS', internalType: 'uint16', type: 'uint16' },
      { name: 'newQuorumCoefficient', internalType: 'uint32', type: 'uint32' },
    ],
    name: '_setDynamicQuorumParams',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newMaxQuorumVotesBPS', internalType: 'uint16', type: 'uint16' },
    ],
    name: '_setMaxQuorumVotesBPS',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newMinQuorumVotesBPS', internalType: 'uint16', type: 'uint16' },
    ],
    name: '_setMinQuorumVotesBPS',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newPendingAdmin', internalType: 'address', type: 'address' },
    ],
    name: '_setPendingAdmin',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newPendingVetoer', internalType: 'address', type: 'address' },
    ],
    name: '_setPendingVetoer',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'newProposalThresholdBPS',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    name: '_setProposalThresholdBPS',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newQuorumCoefficient', internalType: 'uint32', type: 'uint32' },
    ],
    name: '_setQuorumCoefficient',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newVotingDelay', internalType: 'uint256', type: 'uint256' },
    ],
    name: '_setVotingDelay',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newVotingPeriod', internalType: 'uint256', type: 'uint256' },
    ],
    name: '_setVotingPeriod',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: '_withdraw',
    outputs: [
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'admin',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'cancel',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'proposalId', internalType: 'uint256', type: 'uint256' },
      { name: 'support', internalType: 'uint8', type: 'uint8' },
    ],
    name: 'castRefundableVote',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'proposalId', internalType: 'uint256', type: 'uint256' },
      { name: 'support', internalType: 'uint8', type: 'uint8' },
      { name: 'reason', internalType: 'string', type: 'string' },
    ],
    name: 'castRefundableVoteWithReason',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'proposalId', internalType: 'uint256', type: 'uint256' },
      { name: 'support', internalType: 'uint8', type: 'uint8' },
    ],
    name: 'castVote',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'proposalId', internalType: 'uint256', type: 'uint256' },
      { name: 'support', internalType: 'uint8', type: 'uint8' },
      { name: 'v', internalType: 'uint8', type: 'uint8' },
      { name: 'r', internalType: 'bytes32', type: 'bytes32' },
      { name: 's', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'castVoteBySig',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'proposalId', internalType: 'uint256', type: 'uint256' },
      { name: 'support', internalType: 'uint8', type: 'uint8' },
      { name: 'reason', internalType: 'string', type: 'string' },
    ],
    name: 'castVoteWithReason',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'againstVotes', internalType: 'uint256', type: 'uint256' },
      { name: 'totalSupply', internalType: 'uint256', type: 'uint256' },
      {
        name: 'params',
        internalType: 'struct NounsDAOStorageV2.DynamicQuorumParams',
        type: 'tuple',
        components: [
          { name: 'minQuorumVotesBPS', internalType: 'uint16', type: 'uint16' },
          { name: 'maxQuorumVotesBPS', internalType: 'uint16', type: 'uint16' },
          { name: 'quorumCoefficient', internalType: 'uint32', type: 'uint32' },
        ],
      },
    ],
    name: 'dynamicQuorumVotes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'execute',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'getActions',
    outputs: [
      { name: 'targets', internalType: 'address[]', type: 'address[]' },
      { name: 'values', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'signatures', internalType: 'string[]', type: 'string[]' },
      { name: 'calldatas', internalType: 'bytes[]', type: 'bytes[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'blockNumber_', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getDynamicQuorumParamsAt',
    outputs: [
      {
        name: '',
        internalType: 'struct NounsDAOStorageV2.DynamicQuorumParams',
        type: 'tuple',
        components: [
          { name: 'minQuorumVotesBPS', internalType: 'uint16', type: 'uint16' },
          { name: 'maxQuorumVotesBPS', internalType: 'uint16', type: 'uint16' },
          { name: 'quorumCoefficient', internalType: 'uint32', type: 'uint32' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'proposalId', internalType: 'uint256', type: 'uint256' },
      { name: 'voter', internalType: 'address', type: 'address' },
    ],
    name: 'getReceipt',
    outputs: [
      {
        name: '',
        internalType: 'struct NounsDAOStorageV1Adjusted.Receipt',
        type: 'tuple',
        components: [
          { name: 'hasVoted', internalType: 'bool', type: 'bool' },
          { name: 'support', internalType: 'uint8', type: 'uint8' },
          { name: 'votes', internalType: 'uint96', type: 'uint96' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'implementation',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'timelock_', internalType: 'address', type: 'address' },
      { name: 'nouns_', internalType: 'address', type: 'address' },
      { name: 'vetoer_', internalType: 'address', type: 'address' },
      { name: 'votingPeriod_', internalType: 'uint256', type: 'uint256' },
      { name: 'votingDelay_', internalType: 'uint256', type: 'uint256' },
      {
        name: 'proposalThresholdBPS_',
        internalType: 'uint256',
        type: 'uint256',
      },
      {
        name: 'dynamicQuorumParams_',
        internalType: 'struct NounsDAOStorageV2.DynamicQuorumParams',
        type: 'tuple',
        components: [
          { name: 'minQuorumVotesBPS', internalType: 'uint16', type: 'uint16' },
          { name: 'maxQuorumVotesBPS', internalType: 'uint16', type: 'uint16' },
          { name: 'quorumCoefficient', internalType: 'uint32', type: 'uint32' },
        ],
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'latestProposalIds',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'maxQuorumVotes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'minQuorumVotes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'nouns',
    outputs: [
      { name: '', internalType: 'contract NounsTokenLike', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pendingAdmin',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pendingVetoer',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proposalCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proposalMaxOperations',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proposalThreshold',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proposalThresholdBPS',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'proposals',
    outputs: [
      {
        name: '',
        internalType: 'struct NounsDAOStorageV2.ProposalCondensed',
        type: 'tuple',
        components: [
          { name: 'id', internalType: 'uint256', type: 'uint256' },
          { name: 'proposer', internalType: 'address', type: 'address' },
          {
            name: 'proposalThreshold',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'quorumVotes', internalType: 'uint256', type: 'uint256' },
          { name: 'eta', internalType: 'uint256', type: 'uint256' },
          { name: 'startBlock', internalType: 'uint256', type: 'uint256' },
          { name: 'endBlock', internalType: 'uint256', type: 'uint256' },
          { name: 'forVotes', internalType: 'uint256', type: 'uint256' },
          { name: 'againstVotes', internalType: 'uint256', type: 'uint256' },
          { name: 'abstainVotes', internalType: 'uint256', type: 'uint256' },
          { name: 'canceled', internalType: 'bool', type: 'bool' },
          { name: 'vetoed', internalType: 'bool', type: 'bool' },
          { name: 'executed', internalType: 'bool', type: 'bool' },
          { name: 'totalSupply', internalType: 'uint256', type: 'uint256' },
          { name: 'creationBlock', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'targets', internalType: 'address[]', type: 'address[]' },
      { name: 'values', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'signatures', internalType: 'string[]', type: 'string[]' },
      { name: 'calldatas', internalType: 'bytes[]', type: 'bytes[]' },
      { name: 'description', internalType: 'string', type: 'string' },
    ],
    name: 'propose',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'queue',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'quorumParamsCheckpoints',
    outputs: [
      { name: 'fromBlock', internalType: 'uint32', type: 'uint32' },
      {
        name: 'params',
        internalType: 'struct NounsDAOStorageV2.DynamicQuorumParams',
        type: 'tuple',
        components: [
          { name: 'minQuorumVotesBPS', internalType: 'uint16', type: 'uint16' },
          { name: 'maxQuorumVotesBPS', internalType: 'uint16', type: 'uint16' },
          { name: 'quorumCoefficient', internalType: 'uint32', type: 'uint32' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'quorumVotes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'quorumVotesBPS',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'state',
    outputs: [
      {
        name: '',
        internalType: 'enum NounsDAOStorageV1Adjusted.ProposalState',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'timelock',
    outputs: [
      { name: '', internalType: 'contract INounsDAOExecutor', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'veto',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'vetoer',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'votingDelay',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'votingPeriod',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  { type: 'receive', stateMutability: 'payable' },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const nounsDaoLogicAddress = {
  1: '0x5d2C31ce16924C2a71D317e5BbFd5ce387854039',
  11155111: '0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const nounsDaoLogicConfig = {
  address: nounsDaoLogicAddress,
  abi: nounsDaoLogicAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// nounsNftToken
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x94319212eff19b15A27F20cCa145eB43B6b92bdA)
 */
export const nounsNftTokenAbi = [
  {
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    name: 'getCurrentVotes',
    outputs: [{ name: '', type: 'uint96' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'blockNumber', type: 'uint256' },
    ],
    name: 'getPriorVotes',
    outputs: [{ name: '', type: 'uint96' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'delegatee', type: 'address' }],
    name: 'delegate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'delegator', type: 'address' }],
    name: 'delegates',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x94319212eff19b15A27F20cCa145eB43B6b92bdA)
 */
export const nounsNftTokenAddress = {
  1: '0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B',
  11155111: '0x94319212eff19b15A27F20cCa145eB43B6b92bdA',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x94319212eff19b15A27F20cCa145eB43B6b92bdA)
 */
export const nounsNftTokenConfig = {
  address: nounsNftTokenAddress,
  abi: nounsNftTokenAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lilVrgdaAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xA2587b1e2626904c8575640512b987Bd3d3B592D)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x080A01A9163186102946c429B89b0c4dcF84159C)
 */
export const useReadLilVrgda = /*#__PURE__*/ createUseReadContract({
  abi: lilVrgdaAbi,
  address: lilVrgdaAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lilVrgdaAbi}__ and `functionName` set to `"getCurrentVRGDAPrice"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xA2587b1e2626904c8575640512b987Bd3d3B592D)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x080A01A9163186102946c429B89b0c4dcF84159C)
 */
export const useReadLilVrgdaGetCurrentVrgdaPrice =
  /*#__PURE__*/ createUseReadContract({
    abi: lilVrgdaAbi,
    address: lilVrgdaAddress,
    functionName: 'getCurrentVRGDAPrice',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lilVrgdaAbi}__ and `functionName` set to `"nextNounId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xA2587b1e2626904c8575640512b987Bd3d3B592D)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x080A01A9163186102946c429B89b0c4dcF84159C)
 */
export const useReadLilVrgdaNextNounId = /*#__PURE__*/ createUseReadContract({
  abi: lilVrgdaAbi,
  address: lilVrgdaAddress,
  functionName: 'nextNounId',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lilVrgdaAbi}__ and `functionName` set to `"fetchNoun"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xA2587b1e2626904c8575640512b987Bd3d3B592D)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x080A01A9163186102946c429B89b0c4dcF84159C)
 */
export const useReadLilVrgdaFetchNoun = /*#__PURE__*/ createUseReadContract({
  abi: lilVrgdaAbi,
  address: lilVrgdaAddress,
  functionName: 'fetchNoun',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lilVrgdaAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xA2587b1e2626904c8575640512b987Bd3d3B592D)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x080A01A9163186102946c429B89b0c4dcF84159C)
 */
export const useWriteLilVrgda = /*#__PURE__*/ createUseWriteContract({
  abi: lilVrgdaAbi,
  address: lilVrgdaAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lilVrgdaAbi}__ and `functionName` set to `"buyNow"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xA2587b1e2626904c8575640512b987Bd3d3B592D)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x080A01A9163186102946c429B89b0c4dcF84159C)
 */
export const useWriteLilVrgdaBuyNow = /*#__PURE__*/ createUseWriteContract({
  abi: lilVrgdaAbi,
  address: lilVrgdaAddress,
  functionName: 'buyNow',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lilVrgdaAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xA2587b1e2626904c8575640512b987Bd3d3B592D)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x080A01A9163186102946c429B89b0c4dcF84159C)
 */
export const useSimulateLilVrgda = /*#__PURE__*/ createUseSimulateContract({
  abi: lilVrgdaAbi,
  address: lilVrgdaAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lilVrgdaAbi}__ and `functionName` set to `"buyNow"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xA2587b1e2626904c8575640512b987Bd3d3B592D)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x080A01A9163186102946c429B89b0c4dcF84159C)
 */
export const useSimulateLilVrgdaBuyNow =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lilVrgdaAbi,
    address: lilVrgdaAddress,
    functionName: 'buyNow',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useReadNounsAuctionHouse = /*#__PURE__*/ createUseReadContract({
  abi: nounsAuctionHouseAbi,
  address: nounsAuctionHouseAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"MAX_TIME_BUFFER"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useReadNounsAuctionHouseMaxTimeBuffer =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'MAX_TIME_BUFFER',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"auction"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useReadNounsAuctionHouseAuction =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'auction',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"auctionStorage"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useReadNounsAuctionHouseAuctionStorage =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'auctionStorage',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"biddingClient"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useReadNounsAuctionHouseBiddingClient =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'biddingClient',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"duration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useReadNounsAuctionHouseDuration =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'duration',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"getPrices"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useReadNounsAuctionHouseGetPrices =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'getPrices',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"getSettlements"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useReadNounsAuctionHouseGetSettlements =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'getSettlements',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"getSettlementsFromIdtoTimestamp"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useReadNounsAuctionHouseGetSettlementsFromIdtoTimestamp =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'getSettlementsFromIdtoTimestamp',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"minBidIncrementPercentage"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useReadNounsAuctionHouseMinBidIncrementPercentage =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'minBidIncrementPercentage',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"nouns"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useReadNounsAuctionHouseNouns =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'nouns',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"owner"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useReadNounsAuctionHouseOwner =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'owner',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"paused"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useReadNounsAuctionHousePaused =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'paused',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"reservePrice"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useReadNounsAuctionHouseReservePrice =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'reservePrice',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"timeBuffer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useReadNounsAuctionHouseTimeBuffer =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'timeBuffer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"weth"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useReadNounsAuctionHouseWeth = /*#__PURE__*/ createUseReadContract(
  {
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'weth',
  },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWriteNounsAuctionHouse = /*#__PURE__*/ createUseWriteContract({
  abi: nounsAuctionHouseAbi,
  address: nounsAuctionHouseAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"createBid"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWriteNounsAuctionHouseCreateBid =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'createBid',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"initialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWriteNounsAuctionHouseInitialize =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"pause"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWriteNounsAuctionHousePause =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'pause',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWriteNounsAuctionHouseRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"setMinBidIncrementPercentage"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWriteNounsAuctionHouseSetMinBidIncrementPercentage =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'setMinBidIncrementPercentage',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"setPrices"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWriteNounsAuctionHouseSetPrices =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'setPrices',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"setReservePrice"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWriteNounsAuctionHouseSetReservePrice =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'setReservePrice',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"setTimeBuffer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWriteNounsAuctionHouseSetTimeBuffer =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'setTimeBuffer',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"settleAuction"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWriteNounsAuctionHouseSettleAuction =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'settleAuction',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"settleCurrentAndCreateNewAuction"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWriteNounsAuctionHouseSettleCurrentAndCreateNewAuction =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'settleCurrentAndCreateNewAuction',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWriteNounsAuctionHouseTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"unpause"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWriteNounsAuctionHouseUnpause =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'unpause',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"warmUpSettlementState"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWriteNounsAuctionHouseWarmUpSettlementState =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'warmUpSettlementState',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useSimulateNounsAuctionHouse =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"createBid"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useSimulateNounsAuctionHouseCreateBid =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'createBid',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"initialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useSimulateNounsAuctionHouseInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"pause"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useSimulateNounsAuctionHousePause =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'pause',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useSimulateNounsAuctionHouseRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"setMinBidIncrementPercentage"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useSimulateNounsAuctionHouseSetMinBidIncrementPercentage =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'setMinBidIncrementPercentage',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"setPrices"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useSimulateNounsAuctionHouseSetPrices =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'setPrices',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"setReservePrice"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useSimulateNounsAuctionHouseSetReservePrice =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'setReservePrice',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"setTimeBuffer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useSimulateNounsAuctionHouseSetTimeBuffer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'setTimeBuffer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"settleAuction"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useSimulateNounsAuctionHouseSettleAuction =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'settleAuction',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"settleCurrentAndCreateNewAuction"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useSimulateNounsAuctionHouseSettleCurrentAndCreateNewAuction =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'settleCurrentAndCreateNewAuction',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useSimulateNounsAuctionHouseTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"unpause"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useSimulateNounsAuctionHouseUnpause =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'unpause',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `functionName` set to `"warmUpSettlementState"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useSimulateNounsAuctionHouseWarmUpSettlementState =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    functionName: 'warmUpSettlementState',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsAuctionHouseAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWatchNounsAuctionHouseEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `eventName` set to `"AuctionBid"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWatchNounsAuctionHouseAuctionBidEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    eventName: 'AuctionBid',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `eventName` set to `"AuctionBidWithClientId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWatchNounsAuctionHouseAuctionBidWithClientIdEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    eventName: 'AuctionBidWithClientId',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `eventName` set to `"AuctionCreated"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWatchNounsAuctionHouseAuctionCreatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    eventName: 'AuctionCreated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `eventName` set to `"AuctionExtended"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWatchNounsAuctionHouseAuctionExtendedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    eventName: 'AuctionExtended',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `eventName` set to `"AuctionMinBidIncrementPercentageUpdated"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWatchNounsAuctionHouseAuctionMinBidIncrementPercentageUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    eventName: 'AuctionMinBidIncrementPercentageUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `eventName` set to `"AuctionReservePriceUpdated"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWatchNounsAuctionHouseAuctionReservePriceUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    eventName: 'AuctionReservePriceUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `eventName` set to `"AuctionSettled"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWatchNounsAuctionHouseAuctionSettledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    eventName: 'AuctionSettled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `eventName` set to `"AuctionSettledWithClientId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWatchNounsAuctionHouseAuctionSettledWithClientIdEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    eventName: 'AuctionSettledWithClientId',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `eventName` set to `"AuctionTimeBufferUpdated"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWatchNounsAuctionHouseAuctionTimeBufferUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    eventName: 'AuctionTimeBufferUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWatchNounsAuctionHouseOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `eventName` set to `"Paused"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWatchNounsAuctionHousePausedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    eventName: 'Paused',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsAuctionHouseAbi}__ and `eventName` set to `"Unpaused"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000)
 */
export const useWatchNounsAuctionHouseUnpausedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsAuctionHouseAbi,
    address: nounsAuctionHouseAddress,
    eventName: 'Unpaused',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoDataAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWriteNounsDaoData = /*#__PURE__*/ createUseWriteContract({
  abi: nounsDaoDataAbi,
  address: nounsDaoDataAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `functionName` set to `"sendFeedback"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWriteNounsDaoDataSendFeedback =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    functionName: 'sendFeedback',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `functionName` set to `"sendTopicFeedback"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWriteNounsDaoDataSendTopicFeedback =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    functionName: 'sendTopicFeedback',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `functionName` set to `"addTopicSignature"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWriteNounsDaoDataAddTopicSignature =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    functionName: 'addTopicSignature',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoDataAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useSimulateNounsDaoData = /*#__PURE__*/ createUseSimulateContract({
  abi: nounsDaoDataAbi,
  address: nounsDaoDataAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `functionName` set to `"sendFeedback"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useSimulateNounsDaoDataSendFeedback =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    functionName: 'sendFeedback',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `functionName` set to `"sendTopicFeedback"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useSimulateNounsDaoDataSendTopicFeedback =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    functionName: 'sendTopicFeedback',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `functionName` set to `"addTopicSignature"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useSimulateNounsDaoDataAddTopicSignature =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    functionName: 'addTopicSignature',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoDataAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWatchNounsDaoDataEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `eventName` set to `"CandidateFeedbackSent"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWatchNounsDaoDataCandidateFeedbackSentEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    eventName: 'CandidateFeedbackSent',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `eventName` set to `"CreateCandidateCostSet"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWatchNounsDaoDataCreateCandidateCostSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    eventName: 'CreateCandidateCostSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `eventName` set to `"CreateTopicCostSet"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWatchNounsDaoDataCreateTopicCostSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    eventName: 'CreateTopicCostSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `eventName` set to `"ETHWithdrawn"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWatchNounsDaoDataEthWithdrawnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    eventName: 'ETHWithdrawn',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `eventName` set to `"FeeRecipientSet"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWatchNounsDaoDataFeeRecipientSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    eventName: 'FeeRecipientSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `eventName` set to `"FeedbackSent"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWatchNounsDaoDataFeedbackSentEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    eventName: 'FeedbackSent',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `eventName` set to `"ProposalCandidateCanceled"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWatchNounsDaoDataProposalCandidateCanceledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    eventName: 'ProposalCandidateCanceled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `eventName` set to `"ProposalCandidateCreated"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWatchNounsDaoDataProposalCandidateCreatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    eventName: 'ProposalCandidateCreated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `eventName` set to `"ProposalCandidateUpdated"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWatchNounsDaoDataProposalCandidateUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    eventName: 'ProposalCandidateUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `eventName` set to `"SignatureAdded"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWatchNounsDaoDataSignatureAddedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    eventName: 'SignatureAdded',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `eventName` set to `"TopicCanceled"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWatchNounsDaoDataTopicCanceledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    eventName: 'TopicCanceled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `eventName` set to `"TopicCreated"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWatchNounsDaoDataTopicCreatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    eventName: 'TopicCreated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `eventName` set to `"TopicFeedbackSent"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWatchNounsDaoDataTopicFeedbackSentEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    eventName: 'TopicFeedbackSent',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `eventName` set to `"TopicSignatureAdded"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWatchNounsDaoDataTopicSignatureAddedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    eventName: 'TopicSignatureAdded',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoDataAbi}__ and `eventName` set to `"UpdateCandidateCostSet"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x6CaC39a113A498e5C82B31b466299f080aeD4F6F)
 */
export const useWatchNounsDaoDataUpdateCandidateCostSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoDataAbi,
    address: nounsDaoDataAddress,
    eventName: 'UpdateCandidateCostSet',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogic = /*#__PURE__*/ createUseReadContract({
  abi: nounsDaoLogicAbi,
  address: nounsDaoLogicAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"BALLOT_TYPEHASH"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicBallotTypehash =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'BALLOT_TYPEHASH',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"DOMAIN_TYPEHASH"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicDomainTypehash =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'DOMAIN_TYPEHASH',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"MAX_PROPOSAL_THRESHOLD_BPS"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicMaxProposalThresholdBps =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'MAX_PROPOSAL_THRESHOLD_BPS',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"MAX_QUORUM_VOTES_BPS"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicMaxQuorumVotesBps =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'MAX_QUORUM_VOTES_BPS',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"MAX_QUORUM_VOTES_BPS_UPPER_BOUND"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicMaxQuorumVotesBpsUpperBound =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'MAX_QUORUM_VOTES_BPS_UPPER_BOUND',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"MAX_REFUND_BASE_FEE"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicMaxRefundBaseFee =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'MAX_REFUND_BASE_FEE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"MAX_REFUND_GAS_USED"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicMaxRefundGasUsed =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'MAX_REFUND_GAS_USED',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"MAX_REFUND_PRIORITY_FEE"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicMaxRefundPriorityFee =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'MAX_REFUND_PRIORITY_FEE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"MAX_VOTING_DELAY"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicMaxVotingDelay =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'MAX_VOTING_DELAY',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"MAX_VOTING_PERIOD"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicMaxVotingPeriod =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'MAX_VOTING_PERIOD',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"MIN_PROPOSAL_THRESHOLD_BPS"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicMinProposalThresholdBps =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'MIN_PROPOSAL_THRESHOLD_BPS',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"MIN_QUORUM_VOTES_BPS_LOWER_BOUND"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicMinQuorumVotesBpsLowerBound =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'MIN_QUORUM_VOTES_BPS_LOWER_BOUND',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"MIN_QUORUM_VOTES_BPS_UPPER_BOUND"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicMinQuorumVotesBpsUpperBound =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'MIN_QUORUM_VOTES_BPS_UPPER_BOUND',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"MIN_VOTING_DELAY"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicMinVotingDelay =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'MIN_VOTING_DELAY',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"MIN_VOTING_PERIOD"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicMinVotingPeriod =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'MIN_VOTING_PERIOD',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"REFUND_BASE_GAS"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicRefundBaseGas =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'REFUND_BASE_GAS',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"admin"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicAdmin = /*#__PURE__*/ createUseReadContract({
  abi: nounsDaoLogicAbi,
  address: nounsDaoLogicAddress,
  functionName: 'admin',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"dynamicQuorumVotes"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicDynamicQuorumVotes =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'dynamicQuorumVotes',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"getActions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicGetActions =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'getActions',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"getDynamicQuorumParamsAt"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicGetDynamicQuorumParamsAt =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'getDynamicQuorumParamsAt',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"getReceipt"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicGetReceipt =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'getReceipt',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"implementation"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicImplementation =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'implementation',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"latestProposalIds"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicLatestProposalIds =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'latestProposalIds',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"maxQuorumVotes"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicMaxQuorumVotes =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'maxQuorumVotes',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"minQuorumVotes"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicMinQuorumVotes =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'minQuorumVotes',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicName = /*#__PURE__*/ createUseReadContract({
  abi: nounsDaoLogicAbi,
  address: nounsDaoLogicAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"nouns"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicNouns = /*#__PURE__*/ createUseReadContract({
  abi: nounsDaoLogicAbi,
  address: nounsDaoLogicAddress,
  functionName: 'nouns',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"pendingAdmin"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicPendingAdmin =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'pendingAdmin',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"pendingVetoer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicPendingVetoer =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'pendingVetoer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"proposalCount"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicProposalCount =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'proposalCount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"proposalMaxOperations"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicProposalMaxOperations =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'proposalMaxOperations',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"proposalThreshold"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicProposalThreshold =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'proposalThreshold',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"proposalThresholdBPS"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicProposalThresholdBps =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'proposalThresholdBPS',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"proposals"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicProposals =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'proposals',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"quorumParamsCheckpoints"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicQuorumParamsCheckpoints =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'quorumParamsCheckpoints',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"quorumVotes"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicQuorumVotes =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'quorumVotes',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"quorumVotesBPS"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicQuorumVotesBps =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'quorumVotesBPS',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"state"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicState = /*#__PURE__*/ createUseReadContract({
  abi: nounsDaoLogicAbi,
  address: nounsDaoLogicAddress,
  functionName: 'state',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"timelock"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicTimelock = /*#__PURE__*/ createUseReadContract(
  {
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'timelock',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"vetoer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicVetoer = /*#__PURE__*/ createUseReadContract({
  abi: nounsDaoLogicAbi,
  address: nounsDaoLogicAddress,
  functionName: 'vetoer',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"votingDelay"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicVotingDelay =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'votingDelay',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"votingPeriod"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useReadNounsDaoLogicVotingPeriod =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'votingPeriod',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogic = /*#__PURE__*/ createUseWriteContract({
  abi: nounsDaoLogicAbi,
  address: nounsDaoLogicAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_acceptAdmin"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicAcceptAdmin =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_acceptAdmin',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_acceptVetoer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicAcceptVetoer =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_acceptVetoer',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_burnVetoPower"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicBurnVetoPower =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_burnVetoPower',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_setDynamicQuorumParams"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicSetDynamicQuorumParams =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_setDynamicQuorumParams',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_setMaxQuorumVotesBPS"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicSetMaxQuorumVotesBps =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_setMaxQuorumVotesBPS',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_setMinQuorumVotesBPS"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicSetMinQuorumVotesBps =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_setMinQuorumVotesBPS',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_setPendingAdmin"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicSetPendingAdmin =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_setPendingAdmin',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_setPendingVetoer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicSetPendingVetoer =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_setPendingVetoer',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_setProposalThresholdBPS"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicSetProposalThresholdBps =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_setProposalThresholdBPS',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_setQuorumCoefficient"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicSetQuorumCoefficient =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_setQuorumCoefficient',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_setVotingDelay"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicSetVotingDelay =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_setVotingDelay',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_setVotingPeriod"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicSetVotingPeriod =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_setVotingPeriod',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicWithdraw =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_withdraw',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"cancel"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicCancel = /*#__PURE__*/ createUseWriteContract(
  {
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'cancel',
  },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"castRefundableVote"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicCastRefundableVote =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'castRefundableVote',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"castRefundableVoteWithReason"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicCastRefundableVoteWithReason =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'castRefundableVoteWithReason',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"castVote"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicCastVote =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'castVote',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"castVoteBySig"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicCastVoteBySig =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'castVoteBySig',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"castVoteWithReason"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicCastVoteWithReason =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'castVoteWithReason',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"execute"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicExecute =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'execute',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"initialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicInitialize =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"propose"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicPropose =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'propose',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"queue"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicQueue = /*#__PURE__*/ createUseWriteContract({
  abi: nounsDaoLogicAbi,
  address: nounsDaoLogicAddress,
  functionName: 'queue',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"veto"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWriteNounsDaoLogicVeto = /*#__PURE__*/ createUseWriteContract({
  abi: nounsDaoLogicAbi,
  address: nounsDaoLogicAddress,
  functionName: 'veto',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogic = /*#__PURE__*/ createUseSimulateContract(
  { abi: nounsDaoLogicAbi, address: nounsDaoLogicAddress },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_acceptAdmin"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicAcceptAdmin =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_acceptAdmin',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_acceptVetoer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicAcceptVetoer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_acceptVetoer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_burnVetoPower"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicBurnVetoPower =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_burnVetoPower',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_setDynamicQuorumParams"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicSetDynamicQuorumParams =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_setDynamicQuorumParams',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_setMaxQuorumVotesBPS"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicSetMaxQuorumVotesBps =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_setMaxQuorumVotesBPS',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_setMinQuorumVotesBPS"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicSetMinQuorumVotesBps =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_setMinQuorumVotesBPS',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_setPendingAdmin"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicSetPendingAdmin =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_setPendingAdmin',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_setPendingVetoer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicSetPendingVetoer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_setPendingVetoer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_setProposalThresholdBPS"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicSetProposalThresholdBps =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_setProposalThresholdBPS',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_setQuorumCoefficient"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicSetQuorumCoefficient =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_setQuorumCoefficient',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_setVotingDelay"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicSetVotingDelay =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_setVotingDelay',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_setVotingPeriod"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicSetVotingPeriod =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_setVotingPeriod',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"_withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicWithdraw =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: '_withdraw',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"cancel"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicCancel =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'cancel',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"castRefundableVote"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicCastRefundableVote =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'castRefundableVote',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"castRefundableVoteWithReason"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicCastRefundableVoteWithReason =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'castRefundableVoteWithReason',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"castVote"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicCastVote =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'castVote',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"castVoteBySig"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicCastVoteBySig =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'castVoteBySig',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"castVoteWithReason"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicCastVoteWithReason =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'castVoteWithReason',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"execute"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicExecute =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'execute',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"initialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"propose"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicPropose =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'propose',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"queue"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicQueue =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'queue',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `functionName` set to `"veto"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useSimulateNounsDaoLogicVeto =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    functionName: 'veto',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"MaxQuorumVotesBPSSet"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicMaxQuorumVotesBpsSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'MaxQuorumVotesBPSSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"MinQuorumVotesBPSSet"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicMinQuorumVotesBpsSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'MinQuorumVotesBPSSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"NewAdmin"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicNewAdminEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'NewAdmin',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"NewImplementation"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicNewImplementationEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'NewImplementation',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"NewPendingAdmin"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicNewPendingAdminEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'NewPendingAdmin',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"NewPendingVetoer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicNewPendingVetoerEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'NewPendingVetoer',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"NewVetoer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicNewVetoerEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'NewVetoer',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"ProposalCanceled"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicProposalCanceledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'ProposalCanceled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"ProposalCreated"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicProposalCreatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'ProposalCreated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"ProposalCreatedWithRequirements"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicProposalCreatedWithRequirementsEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'ProposalCreatedWithRequirements',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"ProposalExecuted"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicProposalExecutedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'ProposalExecuted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"ProposalQueued"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicProposalQueuedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'ProposalQueued',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"ProposalThresholdBPSSet"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicProposalThresholdBpsSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'ProposalThresholdBPSSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"ProposalVetoed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicProposalVetoedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'ProposalVetoed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"QuorumCoefficientSet"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicQuorumCoefficientSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'QuorumCoefficientSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"QuorumVotesBPSSet"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicQuorumVotesBpsSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'QuorumVotesBPSSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"RefundableVote"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicRefundableVoteEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'RefundableVote',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"VoteCast"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicVoteCastEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'VoteCast',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"VotingDelaySet"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicVotingDelaySetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'VotingDelaySet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"VotingPeriodSet"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicVotingPeriodSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'VotingPeriodSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link nounsDaoLogicAbi}__ and `eventName` set to `"Withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb73613d288F5d69EbBde6d3B129f91D1F53c28B2)
 */
export const useWatchNounsDaoLogicWithdrawEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: nounsDaoLogicAbi,
    address: nounsDaoLogicAddress,
    eventName: 'Withdraw',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsNftTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x94319212eff19b15A27F20cCa145eB43B6b92bdA)
 */
export const useReadNounsNftToken = /*#__PURE__*/ createUseReadContract({
  abi: nounsNftTokenAbi,
  address: nounsNftTokenAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsNftTokenAbi}__ and `functionName` set to `"getCurrentVotes"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x94319212eff19b15A27F20cCa145eB43B6b92bdA)
 */
export const useReadNounsNftTokenGetCurrentVotes =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsNftTokenAbi,
    address: nounsNftTokenAddress,
    functionName: 'getCurrentVotes',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsNftTokenAbi}__ and `functionName` set to `"getPriorVotes"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x94319212eff19b15A27F20cCa145eB43B6b92bdA)
 */
export const useReadNounsNftTokenGetPriorVotes =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsNftTokenAbi,
    address: nounsNftTokenAddress,
    functionName: 'getPriorVotes',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsNftTokenAbi}__ and `functionName` set to `"delegates"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x94319212eff19b15A27F20cCa145eB43B6b92bdA)
 */
export const useReadNounsNftTokenDelegates =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsNftTokenAbi,
    address: nounsNftTokenAddress,
    functionName: 'delegates',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsNftTokenAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x94319212eff19b15A27F20cCa145eB43B6b92bdA)
 */
export const useReadNounsNftTokenBalanceOf =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsNftTokenAbi,
    address: nounsNftTokenAddress,
    functionName: 'balanceOf',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link nounsNftTokenAbi}__ and `functionName` set to `"totalSupply"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x94319212eff19b15A27F20cCa145eB43B6b92bdA)
 */
export const useReadNounsNftTokenTotalSupply =
  /*#__PURE__*/ createUseReadContract({
    abi: nounsNftTokenAbi,
    address: nounsNftTokenAddress,
    functionName: 'totalSupply',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsNftTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x94319212eff19b15A27F20cCa145eB43B6b92bdA)
 */
export const useWriteNounsNftToken = /*#__PURE__*/ createUseWriteContract({
  abi: nounsNftTokenAbi,
  address: nounsNftTokenAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link nounsNftTokenAbi}__ and `functionName` set to `"delegate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x94319212eff19b15A27F20cCa145eB43B6b92bdA)
 */
export const useWriteNounsNftTokenDelegate =
  /*#__PURE__*/ createUseWriteContract({
    abi: nounsNftTokenAbi,
    address: nounsNftTokenAddress,
    functionName: 'delegate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsNftTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x94319212eff19b15A27F20cCa145eB43B6b92bdA)
 */
export const useSimulateNounsNftToken = /*#__PURE__*/ createUseSimulateContract(
  { abi: nounsNftTokenAbi, address: nounsNftTokenAddress },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link nounsNftTokenAbi}__ and `functionName` set to `"delegate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x94319212eff19b15A27F20cCa145eB43B6b92bdA)
 */
export const useSimulateNounsNftTokenDelegate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: nounsNftTokenAbi,
    address: nounsNftTokenAddress,
    functionName: 'delegate',
  })
