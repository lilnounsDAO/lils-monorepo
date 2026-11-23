import type { Action, OneTimePaymentAction } from '@/types/proposal-editor'
import { parseEther, parseUnits, encodeFunctionData, encodeAbiParameters, parseAbiParameters, getAddress, decodeAbiParameters, parseAbi, formatEther, formatUnits, toFunctionSelector, zeroAddress } from 'viem'
import { contracts, getContractsForChain } from '@/contracts/proposal-contracts'
import { Address } from 'viem'
import { CHAIN_CONFIG, CHAIN_SPECIFIC_CONFIGS } from '@/config'
import { predictStreamAddress, STREAM_FACTORY } from '@/utils/streams'

export interface Transaction {
  target: string
  value: string
  signature: string
  calldata: string
}

/**
 * The treasury a proposal actually executes from. This is the live DAO's
 * timelock in CHAIN_SPECIFIC_CONFIGS, not the executor in proposal-contracts.ts
 * — that one belongs to the older DAO and holds different assets, so simulating
 * as it reports BALANCE_EXCEEDED for tokens the real treasury has plenty of.
 */
export function getDaoExecutorAddress(chainId: number): Address {
  const treasury = CHAIN_SPECIFIC_CONFIGS[chainId]?.addresses.nounsTreasury
  if (treasury) return treasury
  return getContractsForChain(chainId).executor.address
}

/**
 * Arguments only, without the 4-byte selector `encodeFunctionData` puts first.
 * Every transaction here carries a `signature`, and the executor prepends that
 * signature's selector itself — leaving ours in shifts every argument by four
 * bytes, which is how prop 396's 17.5505 stETH transfer came out as ~1e59 stETH.
 */
function withoutSelector(encoded: `0x${string}`): `0x${string}` {
  return `0x${encoded.slice(10)}`
}

/**
 * Calldata as the executor expects it next to `signature`: arguments alone.
 * Pasted and imported actions sometimes carry the selector anyway; when the
 * leftover is exactly four bytes and they match the signature's selector, they
 * are dropped. Anything else is passed through untouched.
 */
export function normalizeCalldata(signature: string, calldata: string): `0x${string}` {
  const hex = calldata.startsWith('0x') ? calldata.slice(2) : calldata
  if (signature && hasDoubledSelector(signature, calldata)) return `0x${hex.slice(8)}`
  return `0x${hex}`
}

/** True when calldata still starts with the selector the executor will add for `signature`. */
export function hasDoubledSelector(signature: string, calldata: string): boolean {
  const hex = (calldata.startsWith('0x') ? calldata.slice(2) : calldata).toLowerCase()
  if (!signature || hex.length % 64 !== 8) return false
  try {
    return hex.startsWith(toFunctionSelector(signature).slice(2).toLowerCase())
  } catch {
    return false
  }
}

/**
 * The ABI-encoded arguments of a transaction's calldata.
 *
 * The DAO executor builds the selector from `signature` and prepends it, so
 * calldata stored alongside a signature holds the arguments alone. Hand-written
 * and imported actions often include the selector anyway, and decoding those
 * four extra bytes as arguments shifts every word — which is how a 17.5505 stETH
 * transfer reads as a number with 30-odd digits. Arguments are whole 32-byte
 * words, so a remainder of exactly four bytes is a selector, and nothing else.
 */
function calldataArgs(calldata: string): `0x${string}` {
  const hex = calldata.startsWith('0x') ? calldata.slice(2) : calldata
  return (hex.length % 64 === 8 ? `0x${hex.slice(8)}` : `0x${hex}`) as `0x${string}`
}

/**
 * Convert an action to blockchain transactions
 * Some actions may generate multiple transactions
 */
export const resolveAction = (action: Action): Transaction[] => {
  switch (action.type) {
    case 'one-time-payment':
      return resolveOneTimePayment(action)
    case 'streaming-payment':
      return resolveStreamingPayment(action)
    case 'custom-transaction':
      return resolveCustomTransaction(action)
    case 'treasury-noun-transfer':
      return resolveTreasuryNounTransfer(action)
    case 'payer-top-up':
      return resolvePayerTopUp(action)
    default:
      throw new Error(`Unknown action type: ${(action as any).type}`)
  }
}

type Currency = OneTimePaymentAction['currency']
type TokenCurrency = Exclude<Currency, 'eth'>

const TOKEN_DECIMALS: Record<TokenCurrency, number> = { weth: 18, usdc: 6, steth: 18, reth: 18, oeth: 18 }

const tokenAddress = (currency: TokenCurrency): Address => {
  switch (currency) {
    case 'weth':
      return CHAIN_CONFIG.addresses.wrappedNativeToken
    case 'usdc':
      return CHAIN_CONFIG.addresses.usdc
    case 'steth':
      return CHAIN_CONFIG.addresses.stEth
    case 'reth':
      return contracts['reth-token'].address
    case 'oeth':
      return contracts['oeth-token'].address
  }
}

/** A call the executor makes, with calldata holding the arguments alone (it adds the selector). */
const call = (
  target: Address,
  signature: string,
  args: readonly unknown[],
  value: bigint = 0n,
): Transaction => {
  const types = signature.slice(signature.indexOf('(') + 1, -1)
  return {
    target,
    value: value.toString(),
    signature,
    calldata: types
      ? encodeAbiParameters(parseAbiParameters(types), args as readonly unknown[])
      : '0x',
  }
}

/**
 * Moves `amount` of `currency` from the DAO to `to`, the way the DAO actually holds it:
 * - USDC isn't held by the treasury. The Payer holds it, and sends it or, when
 *   short, records a debt it repays in order once topped up.
 * - WETH is barely held either, so treasury ETH is wrapped first, as Nouns does.
 * - stETH, rETH and OETH are held by the treasury and transferred directly.
 */
const sendToken = (currency: TokenCurrency, to: Address, amount: bigint): Transaction[] => {
  if (currency === 'usdc') {
    return [call(CHAIN_CONFIG.addresses.lilNounsPayer, 'sendOrRegisterDebt(address,uint256)', [to, amount])]
  }
  const token = tokenAddress(currency)
  if (currency === 'weth') {
    return [call(token, 'deposit()', [], amount), call(token, 'transfer(address,uint256)', [to, amount])]
  }
  return [call(token, 'transfer(address,uint256)', [to, amount])]
}

/**
 * Resolve one-time payment action
 */
const resolveOneTimePayment = (action: Extract<Action, { type: 'one-time-payment' }>): Transaction[] => {
  const { target, amount, currency } = action

  if (currency === 'eth') {
    // Direct ETH transfer
    return [{ target, value: parseEther(amount).toString(), signature: '', calldata: '0x' }]
  }
  if (!(currency in TOKEN_DECIMALS)) throw new Error(`Unsupported currency: ${currency}`)

  return sendToken(currency, target, parseUnits(amount, TOKEN_DECIMALS[currency]))
}

// stETH and OETH rebase, and their transfers can land a wei or two short of the
// amount sent; a stream funded one wei short can't pay out its final second
const REBASING_DUST = 2n

/**
 * Resolve streaming payment action
 *
 * The factory deploys the stream at an address fixed by its terms, so the stream
 * is created and then funded at that predicted address, all in one execution.
 * `createStream` checks the deployed address against the prediction and reverts
 * the proposal if they differ, so a wrong prediction can't strand funds.
 */
const resolveStreamingPayment = (action: Extract<Action, { type: 'streaming-payment' }>): Transaction[] => {
  const { target, amount, currency, startTimestamp, endTimestamp } = action
  if (!(currency in TOKEN_DECIMALS)) {
    throw new Error(`Unsupported currency for streaming: ${currency}. Supported currencies: WETH, USDC, stETH, rETH, OETH`)
  }

  const executor = CHAIN_CONFIG.addresses.nounsTreasury
  const token = tokenAddress(currency)
  const tokenAmount = parseUnits(amount, TOKEN_DECIMALS[currency])
  const startTime = BigInt(Math.floor(startTimestamp / 1000))
  const stopTime = BigInt(Math.floor(endTimestamp / 1000))
  const stream = predictStreamAddress({
    msgSender: executor,
    payer: executor,
    recipient: target,
    tokenAmount,
    tokenAddress: token,
    startTime,
    stopTime,
  })
  const funding = currency === 'steth' || currency === 'oeth' ? tokenAmount + REBASING_DUST : tokenAmount

  return [
    call(STREAM_FACTORY, 'createStream(address,uint256,address,uint256,uint256,uint8,address)', [
      target,
      tokenAmount,
      token,
      startTime,
      stopTime,
      0,
      stream,
    ]),
    ...sendToken(currency, stream, funding),
  ]
}

/**
 * Resolve custom transaction action
 */
const resolveCustomTransaction = (action: Extract<Action, { type: 'custom-transaction' }>): Transaction[] => {
  const { contractCallTarget, contractCallSignature, contractCallArguments, contractCallValue } = action

  // Parse the function signature to create ABI
  const match = contractCallSignature.match(/^(\w+)\((.*)\)$/)
  if (!match) {
    throw new Error(`Invalid function signature: ${contractCallSignature}`)
  }

  const [, functionName, paramsStr] = match
  const paramTypes = paramsStr ? paramsStr.split(',').map((s) => s.trim()) : []

  // Validate argument count matches parameter count
  if (contractCallArguments.length !== paramTypes.length) {
    throw new Error(
      `Argument count mismatch: expected ${paramTypes.length} arguments for ${contractCallSignature}, got ${contractCallArguments.length}`
    )
  }

  // Normalize arguments based on their types
  const normalizedArgs = contractCallArguments.map((arg, i) => {
    const paramType = paramTypes[i]
    
    // Handle address types - ensure they're properly formatted
    if (paramType === 'address' || paramType.startsWith('address[')) {
      if (typeof arg === 'string') {
        // Ensure address is checksummed and has 0x prefix
        return getAddress(arg as `0x${string}`)
      }
      return arg
    }
    
    // Handle uint/int types - convert strings to BigInt
    if (paramType.startsWith('uint') || paramType.startsWith('int')) {
      if (typeof arg === 'string') {
        // If it's a hex string, parse it
        if (arg.startsWith('0x')) {
          return BigInt(arg)
        }
        // Otherwise treat as decimal
        return BigInt(arg)
      }
      if (typeof arg === 'number') {
        return BigInt(arg)
      }
      return arg
    }
    
    // Handle bytes types
    if (paramType.startsWith('bytes')) {
      return arg
    }
    
    // For other types, return as-is
    return arg
  })

  // Create minimal ABI for the function
  const abi = [
    {
      name: functionName,
      type: 'function',
      inputs: paramTypes.map((type, i) => ({
        name: `arg${i}`,
        type,
      })),
      outputs: [],
      stateMutability: contractCallValue !== '0' ? 'payable' : 'nonpayable',
    },
  ] as const

  try {
    const calldataWithSelector = encodeFunctionData({
      abi,
      functionName,
      args: normalizedArgs,
    })

    // IMPORTANT: NounsDAOExecutor.executeTransaction() prepends the function selector
    // from the signature to the calldata. So we need to strip the selector from
    // the encoded calldata to avoid double-encoding.
    // The selector is the first 4 bytes (8 hex characters + '0x' = 10 chars)
    const calldataWithoutSelector = withoutSelector(calldataWithSelector);

    console.log('[Transaction] Encoded custom transaction:', {
      functionName,
      signature: contractCallSignature,
      paramTypes,
      args: contractCallArguments,
      normalizedArgs,
      calldataWithSelector,
      calldataWithoutSelector,
      calldataLength: calldataWithoutSelector.length
    })

    return [
      {
        target: contractCallTarget,
        value: contractCallValue,
        signature: contractCallSignature,
        calldata: calldataWithoutSelector,
      },
    ]
  } catch (error) {
    console.error('[Transaction] Failed to encode custom transaction:', {
      functionName,
      signature: contractCallSignature,
      paramTypes,
      args: contractCallArguments,
      normalizedArgs,
      error
    })
    throw new Error(`Failed to encode transaction for ${contractCallSignature}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Resolve payer top-up action
 *
 * The Payer only holds USDC, and is refilled by the TokenBuyer, which sells what
 * it's sent to bots for USDC that goes straight to the Payer. TokenBuyerV2 sells
 * ETH, sent to it plainly as Lil Nouns always has (props 241 to 354), and stETH,
 * sent with a stETH transfer. The treasury holds mostly stETH, so that's the
 * usual top-up now.
 */
const resolvePayerTopUp = (action: Extract<Action, { type: 'payer-top-up' }>): Transaction[] => {
  const tokenBuyer = CHAIN_CONFIG.addresses.lilNounsTokenBuyer
  if (sameAddress(tokenBuyer, zeroAddress)) {
    throw new Error('There is no TokenBuyer on this network to top up')
  }
  if (action.currency === 'eth') {
    return [{ target: tokenBuyer, value: parseEther(action.amount).toString(), signature: '', calldata: '0x' }]
  }
  if (action.currency === 'steth') {
    return [call(CHAIN_CONFIG.addresses.stEth, 'transfer(address,uint256)', [tokenBuyer, parseEther(action.amount)])]
  }
  throw new Error(`Payer top-ups are ETH or stETH: the TokenBuyer can't take ${String(action.currency).toUpperCase()}`)
}

/**
 * Resolve treasury noun transfer action
 */
const resolveTreasuryNounTransfer = (action: Extract<Action, { type: 'treasury-noun-transfer' }>): Transaction[] => {
  const { nounId, target } = action
  return [
    call(CHAIN_CONFIG.addresses.nounsToken, 'transferFrom(address,address,uint256)', [
      CHAIN_CONFIG.addresses.nounsTreasury,
      target,
      BigInt(nounId),
    ]),
  ]
}

/**
 * Convert all actions to transactions (flattened)
 */
export const resolveActions = (actions: Action[]): Transaction[] => {
  console.log('[Transaction] ========================================')
  console.log('[Transaction] Resolving', actions.length, 'actions to transactions')
  console.log('[Transaction] ========================================')
  
  const transactions: Transaction[] = []
  
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i]
    console.log(`[Transaction] Action ${i + 1}:`, {
      type: action.type,
      ...(action.type === 'custom-transaction' ? {
        contractCallTarget: action.contractCallTarget,
        contractCallSignature: action.contractCallSignature,
        contractCallArguments: action.contractCallArguments,
        contractCallValue: action.contractCallValue
      } : action.type === 'one-time-payment' ? {
        target: action.target,
        amount: action.amount,
        currency: action.currency
      } : action.type === 'streaming-payment' ? {
        target: action.target,
        amount: action.amount,
        currency: action.currency,
        startTimestamp: action.startTimestamp,
        endTimestamp: action.endTimestamp
      } : action.type === 'treasury-noun-transfer' ? {
        nounId: action.nounId,
        target: action.target
      } : {})
    })
    
    const resolved = resolveAction(action)
    
    resolved.forEach((tx, txIndex) => {
      console.log(`[Transaction]   → Transaction ${txIndex + 1} of ${resolved.length}:`, {
        target: tx.target,
        value: tx.value,
        signature: tx.signature,
        calldata: tx.calldata,
        calldataLength: tx.calldata.length,
        calldataPreview: tx.calldata.substring(0, 100) + (tx.calldata.length > 100 ? '...' : '')
      })
    })
    
    transactions.push(...resolved)
  }
  
  console.log('[Transaction] ========================================')
  console.log('[Transaction] Total transactions:', transactions.length)
  console.log('[Transaction] ========================================')
  
  return transactions
}

/**
 * USDC the actions ask the Payer for (6 decimals): one-time USDC payments and
 * USDC streams, all of which the Payer pays or registers as debt.
 */
export const usdcRequested = (actions: Action[]): bigint =>
  actions.reduce((total, action) => {
    if ((action.type === 'one-time-payment' || action.type === 'streaming-payment') && action.currency === 'usdc') {
      try {
        return total + parseUnits(action.amount, 6)
      } catch {
        return total
      }
    }
    return total
  }, 0n)

/**
 * Estimate total ETH value needed for all transactions
 */
export const calculateTotalValue = (transactions: Transaction[]): bigint => {
  return transactions.reduce((total, tx) => total + BigInt(tx.value), 0n)
}

const STREAM_SIGNATURE = 'createStream(address,uint256,address,uint256,uint256,uint8,address)'

const sameAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

const currencyOf = (token: string): TokenCurrency | undefined =>
  (Object.keys(TOKEN_DECIMALS) as TokenCurrency[]).find((c) => sameAddress(tokenAddress(c), token))

/** `to` and `amount` of a two-argument payment call, or undefined if it doesn't decode. */
const decodeSend = (tx: Transaction): { to: Address; amount: bigint } | undefined => {
  try {
    const [to, amount] = decodeAbiParameters(parseAbiParameters('address, uint256'), calldataArgs(tx.calldata))
    return { to, amount }
  } catch {
    return undefined
  }
}

/** The one-time token payment starting at `i`, in any shape `sendToken` produces. */
const decodeTokenPayment = (
  transactions: Transaction[],
  i: number,
): { currency: TokenCurrency; to: Address; amount: bigint; length: number } | undefined => {
  const tx = transactions[i]
  if (tx.signature === 'sendOrRegisterDebt(address,uint256)' && sameAddress(tx.target, CHAIN_CONFIG.addresses.lilNounsPayer)) {
    const send = decodeSend(tx)
    return send && { currency: 'usdc', ...send, length: 1 }
  }
  const currency = currencyOf(tx.target)
  if (!currency) return undefined
  // WETH is wrapped from treasury ETH right before it's sent
  if (currency === 'weth' && tx.signature === 'deposit()') {
    const next = transactions[i + 1]
    const send = next && sameAddress(next.target, tx.target) && next.signature === 'transfer(address,uint256)' ? decodeSend(next) : undefined
    return send && send.amount === BigInt(tx.value) ? { currency, ...send, length: 2 } : undefined
  }
  if (tx.signature === 'transfer(address,uint256)') {
    const send = decodeSend(tx)
    return send && { currency, ...send, length: 1 }
  }
  return undefined
}

// Zero where a chain has no TokenBuyer, and a send to 0x0 is a burn, not a top-up
const isTokenBuyer = (address: string) =>
  !sameAddress(address, zeroAddress) &&
  (sameAddress(address, CHAIN_CONFIG.addresses.lilNounsTokenBuyer) ||
    sameAddress(address, CHAIN_CONFIG.addresses.lilNounsTokenBuyerV1))

/** A payer top-up: ETH sent to either TokenBuyer, or stETH transferred to one. */
const decodePayerTopUp = (tx: Transaction): Extract<Action, { type: 'payer-top-up' }> | undefined => {
  if (tx.signature === '' && BigInt(tx.value) > 0n && isTokenBuyer(tx.target)) {
    return { type: 'payer-top-up', amount: formatEther(BigInt(tx.value)), currency: 'eth' }
  }
  if (tx.signature === 'transfer(address,uint256)' && sameAddress(tx.target, CHAIN_CONFIG.addresses.stEth)) {
    const send = decodeSend(tx)
    if (send && isTokenBuyer(send.to)) return { type: 'payer-top-up', amount: formatEther(send.amount), currency: 'steth' }
  }
  return undefined
}

/** How many transactions from `i` fund `stream`, or 0 when what follows isn't its funding. */
const fundingLength = (transactions: Transaction[], i: number, currency: TokenCurrency, stream: Address): number => {
  const payment = transactions[i] ? decodeTokenPayment(transactions, i) : undefined
  return payment && payment.currency === currency && sameAddress(payment.to, stream) ? payment.length : 0
}

/**
 * Reverse-engineer actions from transactions
 * Attempts to detect action types and decode calldata
 */
export const transactionsToActions = (transactions: Transaction[], chainId: number = 1): Action[] => {
  const actions: Action[] = []
  
  let i = 0
  while (i < transactions.length) {
    const tx = transactions[i]
    
    // ETH or stETH sent to a TokenBuyer tops up the Payer
    const topUp = decodePayerTopUp(tx)
    if (topUp) {
      actions.push(topUp)
      i++
      continue
    }

    // Check for ETH transfer (one-time payment)
    if (tx.signature === '' && BigInt(tx.value) > 0n) {
      actions.push({
        type: 'one-time-payment',
        target: getAddress(tx.target),
        amount: formatEther(BigInt(tx.value)),
        currency: 'eth',
      })
      i++
      continue
    }
    
    // Streaming payment: createStream, then the funding sent to the stream it creates
    if (tx.signature === STREAM_SIGNATURE && sameAddress(tx.target, STREAM_FACTORY)) {
      try {
        const [recipient, tokenAmount, token, startTime, stopTime, , stream] = decodeAbiParameters(
          parseAbiParameters('address, uint256, address, uint256, uint256, uint8, address'),
          calldataArgs(tx.calldata),
        )
        const currency = currencyOf(token)
        const funding = currency ? fundingLength(transactions, i + 1, currency, stream) : 0
        if (currency && funding > 0) {
          actions.push({
            type: 'streaming-payment',
            target: recipient,
            amount: formatUnits(tokenAmount, TOKEN_DECIMALS[currency]),
            currency,
            startTimestamp: Number(startTime) * 1000,
            endTimestamp: Number(stopTime) * 1000,
            predictedStreamContractAddress: stream,
          })
          i += 1 + funding
          continue
        }
      } catch (error) {
        console.warn('Failed to decode streaming payment:', error)
      }
    }

    // One-time token payment, in whichever shape `sendToken` builds for its currency
    const payment = decodeTokenPayment(transactions, i)
    if (payment) {
      actions.push({
        type: 'one-time-payment',
        target: payment.to,
        amount: formatUnits(payment.amount, TOKEN_DECIMALS[payment.currency]),
        currency: payment.currency,
      })
      i += payment.length
      continue
    }

    // Check for treasury noun transfer
    if (tx.signature === 'transferFrom(address,address,uint256)' &&
        sameAddress(tx.target, CHAIN_CONFIG.addresses.nounsToken)) {
      try {
        const [from, recipient, nounId] = decodeAbiParameters(
          parseAbiParameters('address, address, uint256'),
          calldataArgs(tx.calldata),
        )
        if (sameAddress(from, CHAIN_CONFIG.addresses.nounsTreasury)) {
          actions.push({ type: 'treasury-noun-transfer', nounId: nounId.toString(), target: recipient })
          i++
          continue
        }
      } catch (error) {
        console.warn('Failed to decode noun transfer:', error)
      }
    }

    // Default: treat as custom transaction
    try {
      // Parse signature to get function name and params
      const signatureMatch = tx.signature.match(/^(\w+)\((.*)\)$/)
      if (signatureMatch) {
        const [, functionName, paramsStr] = signatureMatch
        const paramTypes = paramsStr ? paramsStr.split(',').map((s) => s.trim()).filter(s => s.length > 0) : []
        
        // Try to decode calldata - calldata is stored WITHOUT selector
        let decodedArgs: string[] = []
        if (paramTypes.length > 0 && tx.calldata && tx.calldata !== '0x') {
          try {
            // decodeAbiParameters can decode just the parameters (without selector)
            const decoded = decodeAbiParameters(
              paramTypes.map((type, i) => ({ name: `arg${i}`, type })),
              calldataArgs(tx.calldata)
            )
            
            // Convert decoded values to strings
            decodedArgs = decoded.map((value) => {
              if (typeof value === 'bigint') {
                return value.toString()
              }
              if (typeof value === 'string') {
                return value
              }
              return String(value)
            })
          } catch (error) {
            console.warn(`Failed to decode calldata for ${tx.signature}:`, error)
            // Fill with empty strings if decoding fails
            decodedArgs = paramTypes.map(() => '')
          }
        }
        
        actions.push({
          type: 'custom-transaction',
          contractCallTarget: getAddress(tx.target),
          contractCallSignature: tx.signature,
          contractCallArguments: decodedArgs,
          contractCallValue: tx.value,
        })
      } else {
        // Invalid signature, skip
        console.warn(`Invalid signature format: ${tx.signature}`)
      }
    } catch (error) {
      console.warn(`Failed to parse transaction ${i}:`, error)
    }
    
    i++
  }
  
  return actions
}
