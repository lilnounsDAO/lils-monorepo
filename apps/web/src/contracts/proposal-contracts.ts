/**
 * Contract Definitions
 * The contracts the proposal editor builds transactions against, by chain.
 *
 * Lil Nouns' own contracts (DAO, treasury, token, Payer, TokenBuyer) and the
 * tokens the treasury holds come from CHAIN_SPECIFIC_CONFIGS, the same source
 * the rest of the app uses. This file used to carry its own copies, and they
 * were Nouns DAO's — a treasury Noun transfer built from them moved a Nouns
 * token out of the Nouns treasury, and the treasury balance view read the wrong
 * executor.
 */

import { Address } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { CHAIN_SPECIFIC_CONFIGS } from '@/config'
import { STREAM_FACTORY } from '@/utils/streams'

export interface ContractInfo {
  address: Address
  chainId: number
}

const contractsFor = (chainId: typeof mainnet.id | typeof sepolia.id) => {
  const addresses = CHAIN_SPECIFIC_CONFIGS[chainId].addresses
  const at = (address: Address): ContractInfo => ({ address, chainId })
  return {
    dao: at(addresses.nounsDaoProxy),
    executor: at(addresses.nounsTreasury),
    token: at(addresses.nounsToken),
    payer: at(addresses.lilNounsPayer),
    'token-buyer': at(addresses.lilNounsTokenBuyer),
    'token-buyer-v1': at(addresses.lilNounsTokenBuyerV1),
    'stream-factory': at(STREAM_FACTORY),
    'weth-token': at(addresses.wrappedNativeToken),
    'usdc-token': at(addresses.usdc),
    'steth-token': at(addresses.stEth),
    // stETH is Lido's token; kept as an alias so either name resolves
    'lido-token': at(addresses.stEth),
    // Not deployed on Sepolia; the mainnet addresses are kept so decoding still names them
    'reth-token': at('0xae78736Cd615f374D3085123A210448E74Fc6393'), // Rocket Pool rETH
    'oeth-token': at('0x856c4Efb76C1D1AE02e20CEB03A2A6a08b0b8dC3'), // Origin ETH (OETH)
  }
}

/**
 * Contract addresses by chain
 */
const CONTRACTS_BY_CHAIN = {
  [mainnet.id]: contractsFor(mainnet.id),
  [sepolia.id]: contractsFor(sepolia.id),
}

/**
 * Get contracts for a specific chain ID
 * Defaults to mainnet if chain ID is not supported
 */
export function getContractsForChain(chainId: number) {
  if (chainId === mainnet.id) {
    return CONTRACTS_BY_CHAIN[mainnet.id]
  }
  if (chainId === sepolia.id) {
    return CONTRACTS_BY_CHAIN[sepolia.id]
  }
  // Default to mainnet for unsupported chains
  console.warn(`Unsupported chain ID: ${chainId}, defaulting to mainnet`)
  return CONTRACTS_BY_CHAIN[mainnet.id]
}

/**
 * Lil Nouns DAO Contract Addresses
 * Defaults to mainnet for backward compatibility
 * Use getContractsForChain() for chain-specific addresses
 */
export const contracts = CONTRACTS_BY_CHAIN[mainnet.id]

export type ContractIdentifier = keyof typeof contracts

/**
 * Resolve a contract by its identifier
 */
export const resolveIdentifier = (id: ContractIdentifier): ContractInfo => {
  const contract = contracts[id]
  if (!contract) {
    throw new Error(`Unknown contract identifier: ${id}`)
  }
  return contract
}

/**
 * Resolve a contract by its address
 */
export const resolveAddress = (address: Address): ContractInfo | undefined => {
  return Object.values(contracts).find(
    (c) => c.address.toLowerCase() === address.toLowerCase()
  )
}

/**
 * Check if an address is a known contract
 */
export const isKnownContract = (address: Address): boolean => {
  return resolveAddress(address) !== undefined
}

/**
 * Get contract identifier from address
 */
export const getContractId = (address: Address): ContractIdentifier | undefined => {
  const entry = Object.entries(contracts).find(
    ([_, contract]) => contract.address.toLowerCase() === address.toLowerCase()
  )
  return entry?.[0] as ContractIdentifier | undefined
}
