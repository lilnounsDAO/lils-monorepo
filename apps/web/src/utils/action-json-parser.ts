/**
 * Utility for parsing and validating JSON input for proposal actions
 */

import { isAddress, type Address } from 'viem'
import type { Action } from '@/types/proposal-editor'

export interface ParseResult {
  success: boolean
  actions?: Action[]
  errors?: string[]
}

/**
 * Validates and parses JSON string into Action array
 */
export function parseActionsFromJSON(jsonString: string): ParseResult {
  const errors: string[] = []

  try {
    // Parse JSON
    let parsed: any
    try {
      parsed = JSON.parse(jsonString)
    } catch (e) {
      return {
        success: false,
        errors: ['Invalid JSON format. Please check your JSON syntax.']
      }
    }

    // Ensure it's an array
    const actionsArray = Array.isArray(parsed) ? parsed : [parsed]

    // Validate and transform each action
    const validatedActions: Action[] = []

    for (let i = 0; i < actionsArray.length; i++) {
      const item = actionsArray[i]
      const result = validateAction(item, i)

      if (result.success && result.action) {
        validatedActions.push(result.action)
      } else if (result.errors) {
        errors.push(...result.errors)
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors
      }
    }

    if (validatedActions.length === 0) {
      return {
        success: false,
        errors: ['No valid actions found in JSON']
      }
    }

    return {
      success: true,
      actions: validatedActions
    }
  } catch (e) {
    return {
      success: false,
      errors: [`Unexpected error: ${e instanceof Error ? e.message : String(e)}`]
    }
  }
}

interface ActionValidationResult {
  success: boolean
  action?: Action
  errors?: string[]
}

/**
 * Validates a single action object
 */
function validateAction(item: any, index: number): ActionValidationResult {
  const errors: string[] = []
  const prefix = `Action ${index + 1}`

  if (!item || typeof item !== 'object') {
    return {
      success: false,
      errors: [`${prefix}: Must be an object`]
    }
  }

  if (!item.type) {
    return {
      success: false,
      errors: [`${prefix}: Missing required field 'type'`]
    }
  }

  // Validate based on type
  switch (item.type) {
    case 'one-time-payment':
      return validateOneTimePayment(item, prefix)

    case 'streaming-payment':
      return validateStreamingPayment(item, prefix)

    case 'custom-transaction':
      return validateCustomTransaction(item, prefix)

    case 'treasury-noun-transfer':
      return validateTreasuryNounTransfer(item, prefix)

    case 'payer-top-up':
      return validatePayerTopUp(item, prefix)

    default:
      return {
        success: false,
        errors: [`${prefix}: Unknown action type '${item.type}'. Valid types: one-time-payment, streaming-payment, custom-transaction, treasury-noun-transfer, payer-top-up`]
      }
  }
}

function validateOneTimePayment(item: any, prefix: string): ActionValidationResult {
  const errors: string[] = []

  // Validate target
  if (!item.target) {
    errors.push(`${prefix}: Missing required field 'target'`)
  } else if (!isAddress(item.target)) {
    errors.push(`${prefix}: Invalid Ethereum address in 'target': ${item.target}`)
  }

  // Validate amount
  if (!item.amount && item.amount !== '0') {
    errors.push(`${prefix}: Missing required field 'amount'`)
  } else if (typeof item.amount !== 'string') {
    errors.push(`${prefix}: Field 'amount' must be a string`)
  } else if (isNaN(parseFloat(item.amount))) {
    errors.push(`${prefix}: Field 'amount' must be a valid number`)
  }

  // Validate currency
  const validCurrencies = ['eth', 'weth', 'usdc', 'steth', 'reth', 'oeth']
  if (!item.currency) {
    errors.push(`${prefix}: Missing required field 'currency'`)
  } else if (!validCurrencies.includes(item.currency)) {
    errors.push(`${prefix}: Invalid currency '${item.currency}'. Valid: ${validCurrencies.join(', ')}`)
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return {
    success: true,
    action: {
      type: 'one-time-payment',
      target: item.target as Address,
      amount: String(item.amount),
      currency: item.currency as 'eth' | 'weth' | 'usdc' | 'steth' | 'reth' | 'oeth'
    }
  }
}

function validateStreamingPayment(item: any, prefix: string): ActionValidationResult {
  const errors: string[] = []

  // Validate target
  if (!item.target) {
    errors.push(`${prefix}: Missing required field 'target'`)
  } else if (!isAddress(item.target)) {
    errors.push(`${prefix}: Invalid Ethereum address in 'target': ${item.target}`)
  }

  // Validate amount
  if (!item.amount && item.amount !== '0') {
    errors.push(`${prefix}: Missing required field 'amount'`)
  } else if (typeof item.amount !== 'string') {
    errors.push(`${prefix}: Field 'amount' must be a string`)
  } else if (isNaN(parseFloat(item.amount))) {
    errors.push(`${prefix}: Field 'amount' must be a valid number`)
  }

  // Validate currency (no ETH for streaming)
  const validCurrencies = ['weth', 'usdc', 'steth', 'reth', 'oeth']
  if (!item.currency) {
    errors.push(`${prefix}: Missing required field 'currency'`)
  } else if (!validCurrencies.includes(item.currency)) {
    errors.push(`${prefix}: Invalid currency '${item.currency}'. Valid for streaming: ${validCurrencies.join(', ')}`)
  }

  // Validate timestamps
  if (!item.startTimestamp && item.startTimestamp !== 0) {
    errors.push(`${prefix}: Missing required field 'startTimestamp'`)
  } else if (typeof item.startTimestamp !== 'number') {
    errors.push(`${prefix}: Field 'startTimestamp' must be a number (unix timestamp)`)
  }

  if (!item.endTimestamp && item.endTimestamp !== 0) {
    errors.push(`${prefix}: Missing required field 'endTimestamp'`)
  } else if (typeof item.endTimestamp !== 'number') {
    errors.push(`${prefix}: Field 'endTimestamp' must be a number (unix timestamp)`)
  }

  if (item.startTimestamp >= item.endTimestamp) {
    errors.push(`${prefix}: 'endTimestamp' must be greater than 'startTimestamp'`)
  }

  // Validate predicted stream contract address
  if (!item.predictedStreamContractAddress) {
    errors.push(`${prefix}: Missing required field 'predictedStreamContractAddress'`)
  } else if (!isAddress(item.predictedStreamContractAddress)) {
    errors.push(`${prefix}: Invalid Ethereum address in 'predictedStreamContractAddress': ${item.predictedStreamContractAddress}`)
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return {
    success: true,
    action: {
      type: 'streaming-payment',
      target: item.target as Address,
      amount: String(item.amount),
      currency: item.currency as 'weth' | 'usdc' | 'steth' | 'reth' | 'oeth',
      startTimestamp: item.startTimestamp,
      endTimestamp: item.endTimestamp,
      predictedStreamContractAddress: item.predictedStreamContractAddress as Address
    }
  }
}

function validateCustomTransaction(item: any, prefix: string): ActionValidationResult {
  const errors: string[] = []

  // Validate contractCallTarget
  if (!item.contractCallTarget) {
    errors.push(`${prefix}: Missing required field 'contractCallTarget'`)
  } else if (!isAddress(item.contractCallTarget)) {
    errors.push(`${prefix}: Invalid Ethereum address in 'contractCallTarget': ${item.contractCallTarget}`)
  }

  // Validate contractCallSignature
  if (!item.contractCallSignature && item.contractCallSignature !== '') {
    errors.push(`${prefix}: Missing required field 'contractCallSignature'`)
  } else if (typeof item.contractCallSignature !== 'string') {
    errors.push(`${prefix}: Field 'contractCallSignature' must be a string`)
  }

  // Validate contractCallArguments
  if (!item.contractCallArguments) {
    errors.push(`${prefix}: Missing required field 'contractCallArguments'`)
  } else if (!Array.isArray(item.contractCallArguments)) {
    errors.push(`${prefix}: Field 'contractCallArguments' must be an array`)
  }

  // Validate contractCallValue
  if (!item.contractCallValue && item.contractCallValue !== '0') {
    errors.push(`${prefix}: Missing required field 'contractCallValue'`)
  } else if (typeof item.contractCallValue !== 'string') {
    errors.push(`${prefix}: Field 'contractCallValue' must be a string (wei amount)`)
  }

  // Optional: contractCallCustomAbiString
  if (item.contractCallCustomAbiString !== undefined && typeof item.contractCallCustomAbiString !== 'string') {
    errors.push(`${prefix}: Field 'contractCallCustomAbiString' must be a string if provided`)
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return {
    success: true,
    action: {
      type: 'custom-transaction',
      contractCallTarget: item.contractCallTarget as Address,
      contractCallSignature: item.contractCallSignature,
      contractCallArguments: item.contractCallArguments,
      contractCallValue: String(item.contractCallValue),
      contractCallCustomAbiString: item.contractCallCustomAbiString
    }
  }
}

function validateTreasuryNounTransfer(item: any, prefix: string): ActionValidationResult {
  const errors: string[] = []

  // Validate nounId
  if (!item.nounId && item.nounId !== '0') {
    errors.push(`${prefix}: Missing required field 'nounId'`)
  } else if (typeof item.nounId !== 'string') {
    errors.push(`${prefix}: Field 'nounId' must be a string`)
  }

  // Validate target
  if (!item.target) {
    errors.push(`${prefix}: Missing required field 'target'`)
  } else if (!isAddress(item.target)) {
    errors.push(`${prefix}: Invalid Ethereum address in 'target': ${item.target}`)
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return {
    success: true,
    action: {
      type: 'treasury-noun-transfer',
      nounId: String(item.nounId),
      target: item.target as Address
    }
  }
}

function validatePayerTopUp(item: any, prefix: string): ActionValidationResult {
  const errors: string[] = []

  // Validate amount
  if (!item.amount && item.amount !== '0') {
    errors.push(`${prefix}: Missing required field 'amount'`)
  } else if (typeof item.amount !== 'string') {
    errors.push(`${prefix}: Field 'amount' must be a string`)
  } else if (isNaN(parseFloat(item.amount))) {
    errors.push(`${prefix}: Field 'amount' must be a valid number`)
  }

  // Validate currency
  const validCurrencies = ['eth', 'steth', 'reth', 'oeth']
  if (!item.currency) {
    errors.push(`${prefix}: Missing required field 'currency'`)
  } else if (!validCurrencies.includes(item.currency)) {
    errors.push(`${prefix}: Invalid currency '${item.currency}'. Valid for payer top-up: ${validCurrencies.join(', ')}`)
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return {
    success: true,
    action: {
      type: 'payer-top-up',
      amount: String(item.amount),
      currency: item.currency as 'eth' | 'steth' | 'reth' | 'oeth'
    }
  }
}

/**
 * Example JSON format for documentation
 */
export const exampleJSON = `[
  {
    "type": "one-time-payment",
    "target": "0x1234567890123456789012345678901234567890",
    "amount": "1.5",
    "currency": "eth"
  },
  {
    "type": "custom-transaction",
    "contractCallTarget": "0x1234567890123456789012345678901234567890",
    "contractCallSignature": "transfer(address,uint256)",
    "contractCallArguments": ["0x1234567890123456789012345678901234567890", "1000000"],
    "contractCallValue": "0"
  }
]`
