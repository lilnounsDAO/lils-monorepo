import { defineConfig } from '@wagmi/cli'
import { react } from '@wagmi/cli/plugins'
import { mainnet, sepolia } from 'viem/chains'
import addresses from './src/addresses.json'
import { getAddress } from 'viem'

const mainnetAddresses = addresses['1']
const sepoliaAddresses = addresses['11155111']

/**
 * Wagmi CLI Configuration
 * Generates typed hooks for contract interactions
 *
 * Run: bun run codegen
 * Output: src/data/generated/wagmi.ts
 */
export default defineConfig({
  out: 'src/data/generated/wagmi.ts',
  plugins: [
    react(),
  ],
  contracts: [
    // Lil Nouns NFT Token (ERC721)
    {
      name: 'nounsNftToken',
      abi: [
        {
          type: 'function',
          inputs: [{ name: 'account', type: 'address' }],
          name: 'getCurrentVotes',
          outputs: [{ name: '', type: 'uint96' }],
          stateMutability: 'view',
        },
        {
          type: 'function',
          inputs: [{ name: 'account', type: 'address' }, { name: 'blockNumber', type: 'uint256' }],
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
      ] as const,
      address: {
        [mainnet.id]: getAddress(mainnetAddresses.nounsToken), // Lil Nouns Mainnet
        [sepolia.id]: getAddress(sepoliaAddresses.nounsToken), // Lil Nouns Sepolia
      },
    },

    // Lil VRGDA Contract
    {
      name: 'lilVRGDA',
      abi: [
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
      ] as const,
      address: {
        [mainnet.id]: getAddress(mainnetAddresses.lilVRGDAProxy), // Mainnet
        [sepolia.id]: getAddress(sepoliaAddresses.lilVRGDAProxy), // Sepolia
      },
    },

    // Nouns DAO Logic
    {
      name: 'nounsDaoLogic',
      abi: [
        {
          "inputs": [],
          "name": "AdminOnly",
          "type": "error"
        },
        {
          "inputs": [],
          "name": "CantCancelExecutedProposal",
          "type": "error"
        },
        {
          "inputs": [],
          "name": "CantVetoExecutedProposal",
          "type": "error"
        },
        {
          "inputs": [],
          "name": "InvalidMaxQuorumVotesBPS",
          "type": "error"
        },
        {
          "inputs": [],
          "name": "InvalidMinQuorumVotesBPS",
          "type": "error"
        },
        {
          "inputs": [],
          "name": "MinQuorumBPSGreaterThanMaxQuorumBPS",
          "type": "error"
        },
        {
          "inputs": [],
          "name": "PendingVetoerOnly",
          "type": "error"
        },
        {
          "inputs": [],
          "name": "UnsafeUint16Cast",
          "type": "error"
        },
        {
          "inputs": [],
          "name": "VetoerBurned",
          "type": "error"
        },
        {
          "inputs": [],
          "name": "VetoerOnly",
          "type": "error"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint16",
              "name": "oldMaxQuorumVotesBPS",
              "type": "uint16"
            },
            {
              "indexed": false,
              "internalType": "uint16",
              "name": "newMaxQuorumVotesBPS",
              "type": "uint16"
            }
          ],
          "name": "MaxQuorumVotesBPSSet",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint16",
              "name": "oldMinQuorumVotesBPS",
              "type": "uint16"
            },
            {
              "indexed": false,
              "internalType": "uint16",
              "name": "newMinQuorumVotesBPS",
              "type": "uint16"
            }
          ],
          "name": "MinQuorumVotesBPSSet",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "address",
              "name": "oldAdmin",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "newAdmin",
              "type": "address"
            }
          ],
          "name": "NewAdmin",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "address",
              "name": "oldImplementation",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "newImplementation",
              "type": "address"
            }
          ],
          "name": "NewImplementation",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "address",
              "name": "oldPendingAdmin",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "newPendingAdmin",
              "type": "address"
            }
          ],
          "name": "NewPendingAdmin",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "address",
              "name": "oldPendingVetoer",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "newPendingVetoer",
              "type": "address"
            }
          ],
          "name": "NewPendingVetoer",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "address",
              "name": "oldVetoer",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "newVetoer",
              "type": "address"
            }
          ],
          "name": "NewVetoer",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            }
          ],
          "name": "ProposalCanceled",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "proposer",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "address[]",
              "name": "targets",
              "type": "address[]"
            },
            {
              "indexed": false,
              "internalType": "uint256[]",
              "name": "values",
              "type": "uint256[]"
            },
            {
              "indexed": false,
              "internalType": "string[]",
              "name": "signatures",
              "type": "string[]"
            },
            {
              "indexed": false,
              "internalType": "bytes[]",
              "name": "calldatas",
              "type": "bytes[]"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "startBlock",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "endBlock",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "description",
              "type": "string"
            }
          ],
          "name": "ProposalCreated",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "proposer",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "address[]",
              "name": "targets",
              "type": "address[]"
            },
            {
              "indexed": false,
              "internalType": "uint256[]",
              "name": "values",
              "type": "uint256[]"
            },
            {
              "indexed": false,
              "internalType": "string[]",
              "name": "signatures",
              "type": "string[]"
            },
            {
              "indexed": false,
              "internalType": "bytes[]",
              "name": "calldatas",
              "type": "bytes[]"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "startBlock",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "endBlock",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "proposalThreshold",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "quorumVotes",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "description",
              "type": "string"
            }
          ],
          "name": "ProposalCreatedWithRequirements",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            }
          ],
          "name": "ProposalExecuted",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "eta",
              "type": "uint256"
            }
          ],
          "name": "ProposalQueued",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "oldProposalThresholdBPS",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "newProposalThresholdBPS",
              "type": "uint256"
            }
          ],
          "name": "ProposalThresholdBPSSet",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            }
          ],
          "name": "ProposalVetoed",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint32",
              "name": "oldQuorumCoefficient",
              "type": "uint32"
            },
            {
              "indexed": false,
              "internalType": "uint32",
              "name": "newQuorumCoefficient",
              "type": "uint32"
            }
          ],
          "name": "QuorumCoefficientSet",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "oldQuorumVotesBPS",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "newQuorumVotesBPS",
              "type": "uint256"
            }
          ],
          "name": "QuorumVotesBPSSet",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "voter",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "refundAmount",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "bool",
              "name": "refundSent",
              "type": "bool"
            }
          ],
          "name": "RefundableVote",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "voter",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "proposalId",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint8",
              "name": "support",
              "type": "uint8"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "votes",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "reason",
              "type": "string"
            }
          ],
          "name": "VoteCast",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "oldVotingDelay",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "newVotingDelay",
              "type": "uint256"
            }
          ],
          "name": "VotingDelaySet",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "oldVotingPeriod",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "newVotingPeriod",
              "type": "uint256"
            }
          ],
          "name": "VotingPeriodSet",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "bool",
              "name": "sent",
              "type": "bool"
            }
          ],
          "name": "Withdraw",
          "type": "event"
        },
        {
          "inputs": [],
          "name": "BALLOT_TYPEHASH",
          "outputs": [
            {
              "internalType": "bytes32",
              "name": "",
              "type": "bytes32"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "DOMAIN_TYPEHASH",
          "outputs": [
            {
              "internalType": "bytes32",
              "name": "",
              "type": "bytes32"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "MAX_PROPOSAL_THRESHOLD_BPS",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "MAX_QUORUM_VOTES_BPS",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "MAX_QUORUM_VOTES_BPS_UPPER_BOUND",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "MAX_REFUND_BASE_FEE",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "MAX_REFUND_GAS_USED",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "MAX_REFUND_PRIORITY_FEE",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "MAX_VOTING_DELAY",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "MAX_VOTING_PERIOD",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "MIN_PROPOSAL_THRESHOLD_BPS",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "MIN_QUORUM_VOTES_BPS_LOWER_BOUND",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "MIN_QUORUM_VOTES_BPS_UPPER_BOUND",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "MIN_VOTING_DELAY",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "MIN_VOTING_PERIOD",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "REFUND_BASE_GAS",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "_acceptAdmin",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "_acceptVetoer",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "_burnVetoPower",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint16",
              "name": "newMinQuorumVotesBPS",
              "type": "uint16"
            },
            {
              "internalType": "uint16",
              "name": "newMaxQuorumVotesBPS",
              "type": "uint16"
            },
            {
              "internalType": "uint32",
              "name": "newQuorumCoefficient",
              "type": "uint32"
            }
          ],
          "name": "_setDynamicQuorumParams",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint16",
              "name": "newMaxQuorumVotesBPS",
              "type": "uint16"
            }
          ],
          "name": "_setMaxQuorumVotesBPS",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint16",
              "name": "newMinQuorumVotesBPS",
              "type": "uint16"
            }
          ],
          "name": "_setMinQuorumVotesBPS",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "newPendingAdmin",
              "type": "address"
            }
          ],
          "name": "_setPendingAdmin",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "newPendingVetoer",
              "type": "address"
            }
          ],
          "name": "_setPendingVetoer",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "newProposalThresholdBPS",
              "type": "uint256"
            }
          ],
          "name": "_setProposalThresholdBPS",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint32",
              "name": "newQuorumCoefficient",
              "type": "uint32"
            }
          ],
          "name": "_setQuorumCoefficient",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "newVotingDelay",
              "type": "uint256"
            }
          ],
          "name": "_setVotingDelay",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "newVotingPeriod",
              "type": "uint256"
            }
          ],
          "name": "_setVotingPeriod",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "_withdraw",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "admin",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "proposalId",
              "type": "uint256"
            }
          ],
          "name": "cancel",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "proposalId",
              "type": "uint256"
            },
            {
              "internalType": "uint8",
              "name": "support",
              "type": "uint8"
            }
          ],
          "name": "castRefundableVote",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "proposalId",
              "type": "uint256"
            },
            {
              "internalType": "uint8",
              "name": "support",
              "type": "uint8"
            },
            {
              "internalType": "string",
              "name": "reason",
              "type": "string"
            }
          ],
          "name": "castRefundableVoteWithReason",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "proposalId",
              "type": "uint256"
            },
            {
              "internalType": "uint8",
              "name": "support",
              "type": "uint8"
            }
          ],
          "name": "castVote",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "proposalId",
              "type": "uint256"
            },
            {
              "internalType": "uint8",
              "name": "support",
              "type": "uint8"
            },
            {
              "internalType": "uint8",
              "name": "v",
              "type": "uint8"
            },
            {
              "internalType": "bytes32",
              "name": "r",
              "type": "bytes32"
            },
            {
              "internalType": "bytes32",
              "name": "s",
              "type": "bytes32"
            }
          ],
          "name": "castVoteBySig",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "proposalId",
              "type": "uint256"
            },
            {
              "internalType": "uint8",
              "name": "support",
              "type": "uint8"
            },
            {
              "internalType": "string",
              "name": "reason",
              "type": "string"
            }
          ],
          "name": "castVoteWithReason",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "againstVotes",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "totalSupply",
              "type": "uint256"
            },
            {
              "components": [
                {
                  "internalType": "uint16",
                  "name": "minQuorumVotesBPS",
                  "type": "uint16"
                },
                {
                  "internalType": "uint16",
                  "name": "maxQuorumVotesBPS",
                  "type": "uint16"
                },
                {
                  "internalType": "uint32",
                  "name": "quorumCoefficient",
                  "type": "uint32"
                }
              ],
              "internalType": "struct NounsDAOStorageV2.DynamicQuorumParams",
              "name": "params",
              "type": "tuple"
            }
          ],
          "name": "dynamicQuorumVotes",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "pure",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "proposalId",
              "type": "uint256"
            }
          ],
          "name": "execute",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "proposalId",
              "type": "uint256"
            }
          ],
          "name": "getActions",
          "outputs": [
            {
              "internalType": "address[]",
              "name": "targets",
              "type": "address[]"
            },
            {
              "internalType": "uint256[]",
              "name": "values",
              "type": "uint256[]"
            },
            {
              "internalType": "string[]",
              "name": "signatures",
              "type": "string[]"
            },
            {
              "internalType": "bytes[]",
              "name": "calldatas",
              "type": "bytes[]"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "blockNumber_",
              "type": "uint256"
            }
          ],
          "name": "getDynamicQuorumParamsAt",
          "outputs": [
            {
              "components": [
                {
                  "internalType": "uint16",
                  "name": "minQuorumVotesBPS",
                  "type": "uint16"
                },
                {
                  "internalType": "uint16",
                  "name": "maxQuorumVotesBPS",
                  "type": "uint16"
                },
                {
                  "internalType": "uint32",
                  "name": "quorumCoefficient",
                  "type": "uint32"
                }
              ],
              "internalType": "struct NounsDAOStorageV2.DynamicQuorumParams",
              "name": "",
              "type": "tuple"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "proposalId",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "voter",
              "type": "address"
            }
          ],
          "name": "getReceipt",
          "outputs": [
            {
              "components": [
                {
                  "internalType": "bool",
                  "name": "hasVoted",
                  "type": "bool"
                },
                {
                  "internalType": "uint8",
                  "name": "support",
                  "type": "uint8"
                },
                {
                  "internalType": "uint96",
                  "name": "votes",
                  "type": "uint96"
                }
              ],
              "internalType": "struct NounsDAOStorageV1Adjusted.Receipt",
              "name": "",
              "type": "tuple"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "implementation",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "timelock_",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "nouns_",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "vetoer_",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "votingPeriod_",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "votingDelay_",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "proposalThresholdBPS_",
              "type": "uint256"
            },
            {
              "components": [
                {
                  "internalType": "uint16",
                  "name": "minQuorumVotesBPS",
                  "type": "uint16"
                },
                {
                  "internalType": "uint16",
                  "name": "maxQuorumVotesBPS",
                  "type": "uint16"
                },
                {
                  "internalType": "uint32",
                  "name": "quorumCoefficient",
                  "type": "uint32"
                }
              ],
              "internalType": "struct NounsDAOStorageV2.DynamicQuorumParams",
              "name": "dynamicQuorumParams_",
              "type": "tuple"
            }
          ],
          "name": "initialize",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "name": "latestProposalIds",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "maxQuorumVotes",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "minQuorumVotes",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "name",
          "outputs": [
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "nouns",
          "outputs": [
            {
              "internalType": "contract NounsTokenLike",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "pendingAdmin",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "pendingVetoer",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "proposalCount",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "proposalMaxOperations",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "proposalThreshold",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "proposalThresholdBPS",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "proposalId",
              "type": "uint256"
            }
          ],
          "name": "proposals",
          "outputs": [
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "id",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "proposer",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "proposalThreshold",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "quorumVotes",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "eta",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "startBlock",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "endBlock",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "forVotes",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "againstVotes",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "abstainVotes",
                  "type": "uint256"
                },
                {
                  "internalType": "bool",
                  "name": "canceled",
                  "type": "bool"
                },
                {
                  "internalType": "bool",
                  "name": "vetoed",
                  "type": "bool"
                },
                {
                  "internalType": "bool",
                  "name": "executed",
                  "type": "bool"
                },
                {
                  "internalType": "uint256",
                  "name": "totalSupply",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "creationBlock",
                  "type": "uint256"
                }
              ],
              "internalType": "struct NounsDAOStorageV2.ProposalCondensed",
              "name": "",
              "type": "tuple"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address[]",
              "name": "targets",
              "type": "address[]"
            },
            {
              "internalType": "uint256[]",
              "name": "values",
              "type": "uint256[]"
            },
            {
              "internalType": "string[]",
              "name": "signatures",
              "type": "string[]"
            },
            {
              "internalType": "bytes[]",
              "name": "calldatas",
              "type": "bytes[]"
            },
            {
              "internalType": "string",
              "name": "description",
              "type": "string"
            }
          ],
          "name": "propose",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "proposalId",
              "type": "uint256"
            }
          ],
          "name": "queue",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "name": "quorumParamsCheckpoints",
          "outputs": [
            {
              "internalType": "uint32",
              "name": "fromBlock",
              "type": "uint32"
            },
            {
              "components": [
                {
                  "internalType": "uint16",
                  "name": "minQuorumVotesBPS",
                  "type": "uint16"
                },
                {
                  "internalType": "uint16",
                  "name": "maxQuorumVotesBPS",
                  "type": "uint16"
                },
                {
                  "internalType": "uint32",
                  "name": "quorumCoefficient",
                  "type": "uint32"
                }
              ],
              "internalType": "struct NounsDAOStorageV2.DynamicQuorumParams",
              "name": "params",
              "type": "tuple"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "proposalId",
              "type": "uint256"
            }
          ],
          "name": "quorumVotes",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "quorumVotesBPS",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "proposalId",
              "type": "uint256"
            }
          ],
          "name": "state",
          "outputs": [
            {
              "internalType": "enum NounsDAOStorageV1Adjusted.ProposalState",
              "name": "",
              "type": "uint8"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "timelock",
          "outputs": [
            {
              "internalType": "contract INounsDAOExecutor",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "proposalId",
              "type": "uint256"
            }
          ],
          "name": "veto",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "vetoer",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "votingDelay",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "votingPeriod",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "stateMutability": "payable",
          "type": "receive"
        }
      ] as const,
      address: {
        [mainnet.id]: getAddress(mainnetAddresses.nounsDAOProxy), // Mainnet
        [sepolia.id]: getAddress(sepoliaAddresses.nounsDAOProxy), // Sepolia
      },
    },

    // Nouns dao data v2 contract
    {
      name: 'nounsDaoData',
      abi: [
        {
          inputs: [
            { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
            { internalType: 'uint8', name: 'support', type: 'uint8' },
            { internalType: 'string', name: 'reason', type: 'string' }
          ],
          name: 'sendFeedback',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function'
        },
        {
          inputs: [
            { internalType: 'address', name: 'creator', type: 'address' },
            { internalType: 'string', name: 'slug', type: 'string' },
            { internalType: 'uint8', name: 'support', type: 'uint8' },
            { internalType: 'string', name: 'reason', type: 'string' }
          ],
          name: 'sendTopicFeedback',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function'
        },
        {
          inputs: [
            { internalType: 'bytes', name: 'sig', type: 'bytes' },
            {
              internalType: 'uint256',
              name: 'expirationTimestamp',
              type: 'uint256'
            },
            { internalType: 'address', name: 'creator', type: 'address' },
            { internalType: 'string', name: 'slug', type: 'string' },
            { internalType: 'bytes', name: 'encodedTopic', type: 'bytes' },
            { internalType: 'uint8', name: 'support', type: 'uint8' },
            { internalType: 'string', name: 'reason', type: 'string' }
          ],
          name: 'addTopicSignature',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function'
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "msgSender",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "proposer",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "slug",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "uint8",
              "name": "support",
              "type": "uint8"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "reason",
              "type": "string"
            }
          ],
          "name": "CandidateFeedbackSent",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "oldCreateCandidateCost",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "newCreateCandidateCost",
              "type": "uint256"
            }
          ],
          "name": "CreateCandidateCostSet",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "oldCreateTopicCost",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "newCreateTopicCost",
              "type": "uint256"
            }
          ],
          "name": "CreateTopicCostSet",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            }
          ],
          "name": "ETHWithdrawn",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "oldFeeRecipient",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "newFeeRecipient",
              "type": "address"
            }
          ],
          "name": "FeeRecipientSet",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "msgSender",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "proposalId",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint8",
              "name": "support",
              "type": "uint8"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "reason",
              "type": "string"
            }
          ],
          "name": "FeedbackSent",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "msgSender",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "slug",
              "type": "string"
            }
          ],
          "name": "ProposalCandidateCanceled",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "msgSender",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "address[]",
              "name": "targets",
              "type": "address[]"
            },
            {
              "indexed": false,
              "internalType": "uint256[]",
              "name": "values",
              "type": "uint256[]"
            },
            {
              "indexed": false,
              "internalType": "string[]",
              "name": "signatures",
              "type": "string[]"
            },
            {
              "indexed": false,
              "internalType": "bytes[]",
              "name": "calldatas",
              "type": "bytes[]"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "description",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "slug",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "proposalIdToUpdate",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "bytes32",
              "name": "encodedProposalHash",
              "type": "bytes32"
            }
          ],
          "name": "ProposalCandidateCreated",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "msgSender",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "address[]",
              "name": "targets",
              "type": "address[]"
            },
            {
              "indexed": false,
              "internalType": "uint256[]",
              "name": "values",
              "type": "uint256[]"
            },
            {
              "indexed": false,
              "internalType": "string[]",
              "name": "signatures",
              "type": "string[]"
            },
            {
              "indexed": false,
              "internalType": "bytes[]",
              "name": "calldatas",
              "type": "bytes[]"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "description",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "slug",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "proposalIdToUpdate",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "bytes32",
              "name": "encodedProposalHash",
              "type": "bytes32"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "reason",
              "type": "string"
            }
          ],
          "name": "ProposalCandidateUpdated",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "signer",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "bytes",
              "name": "sig",
              "type": "bytes"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "expirationTimestamp",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "proposer",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "slug",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "proposalIdToUpdate",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "bytes32",
              "name": "encodedPropHash",
              "type": "bytes32"
            },
            {
              "indexed": false,
              "internalType": "bytes32",
              "name": "sigDigest",
              "type": "bytes32"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "reason",
              "type": "string"
            }
          ],
          "name": "SignatureAdded",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "msgSender",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "slug",
              "type": "string"
            }
          ],
          "name": "TopicCanceled",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "msgSender",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "title",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "description",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "slug",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "bytes32",
              "name": "topicHash",
              "type": "bytes32"
            }
          ],
          "name": "TopicCreated",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "msgSender",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "creator",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "slug",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "uint8",
              "name": "support",
              "type": "uint8"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "reason",
              "type": "string"
            }
          ],
          "name": "TopicFeedbackSent",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "signer",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "bytes",
              "name": "sig",
              "type": "bytes"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "expirationTimestamp",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "creator",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "slug",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "bytes32",
              "name": "topicHash",
              "type": "bytes32"
            },
            {
              "indexed": false,
              "internalType": "bytes32",
              "name": "sigDigest",
              "type": "bytes32"
            },
            {
              "indexed": false,
              "internalType": "uint8",
              "name": "support",
              "type": "uint8"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "reason",
              "type": "string"
            }
          ],
          "name": "TopicSignatureAdded",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "oldUpdateCandidateCost",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "newUpdateCandidateCost",
              "type": "uint256"
            }
          ],
          "name": "UpdateCandidateCostSet",
          "type": "event"
        }
      ] as const,
      address: {
        [mainnet.id]: getAddress(mainnetAddresses.nounsDAODataProxy) !== '0x0000000000000000000000000000000000000000' ? getAddress(mainnetAddresses.nounsDAODataProxy) : '0x0000000000000000000000000000000000000000', // todo create mainnet
        [sepolia.id]: getAddress(sepoliaAddresses.nounsDAODataProxy), // Sepolia
      },
    },

    // for nouns: nouns auction house contract
    {
      name: 'nounsAuctionHouse',
      abi: [
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
      ] as const,
      address: {
        [mainnet.id]: getAddress(mainnetAddresses.nounsAuctionHouseProxy), //'0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E', // Mainnet
        [sepolia.id]: getAddress(sepoliaAddresses.nounsAuctionHouseProxy) !== '0x0000000000000000000000000000000000000000' ? getAddress(sepoliaAddresses.nounsAuctionHouseProxy) : '0x0000000000000000000000000000000000000000', // Sepolia
      },
    }

  ],
})
