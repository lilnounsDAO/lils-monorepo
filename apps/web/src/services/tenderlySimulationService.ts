/**
 * Tenderly Simulation Service
 * Core simulation logic for validating proposal transactions
 */

import { Address } from 'viem'
import type { Transaction } from '@/utils/transactions'
import type {
  TenderlySimulationRequest,
  TenderlySimulationResponse,
  SimulationResult
} from '@/types/tenderly'

const TENDERLY_ACCESS_KEY = import.meta.env.VITE_TENDERLY_ACCESS_KEY
const TENDERLY_USERNAME = import.meta.env.VITE_TENDERLY_USERNAME // Optional, for backward compatibility
const TENDERLY_PROJECT = import.meta.env.VITE_TENDERLY_PROJECT

// Network-specific RPC endpoints (legacy, may have limitations)
const TENDERLY_RPC_URLS = {
  mainnet: `https://mainnet.gateway.tenderly.co/${TENDERLY_ACCESS_KEY}`,
  sepolia: `https://sepolia.gateway.tenderly.co/${TENDERLY_ACCESS_KEY}`
}

// REST API endpoint (more reliable for state overrides and balance)
// Use Nouns Camp pattern: account/me/project/{project-slug}
// Falls back to account/{username}/project/{project} if username is provided
const TENDERLY_REST_API_URL = TENDERLY_PROJECT
  ? TENDERLY_USERNAME
    ? `https://api.tenderly.co/api/v1/account/${TENDERLY_USERNAME}/project/${TENDERLY_PROJECT}`
    : `https://api.tenderly.co/api/v1/account/me/project/${TENDERLY_PROJECT}`
  : null

// Log configuration status (without exposing key)
if (!TENDERLY_ACCESS_KEY) {
  console.warn('[Tenderly] Access key not configured. Simulations will fail.')
} else {
  const accessKeyLength = TENDERLY_ACCESS_KEY.length
  const accessKeyPrefix = TENDERLY_ACCESS_KEY.substring(0, 4)
  const accessKeySuffix = TENDERLY_ACCESS_KEY.substring(accessKeyLength - 4)
  console.log('[Tenderly] Configuration loaded:', {
    hasAccessKey: !!TENDERLY_ACCESS_KEY,
    accessKeyLength,
    accessKeyFormat: `${accessKeyPrefix}...${accessKeySuffix}`,
    username: TENDERLY_USERNAME || 'NOT SET',
    project: TENDERLY_PROJECT || 'NOT SET',
    restApiUrl: TENDERLY_REST_API_URL || 'NOT CONFIGURED (missing username or project)'
  })
  
  if (!TENDERLY_PROJECT) {
    console.error('[Tenderly] REST API will not work! Missing required env var:')
    console.error('[Tenderly]   VITE_TENDERLY_PROJECT:', TENDERLY_PROJECT || 'MISSING')
    console.error('[Tenderly]   Note: VITE_TENDERLY_USERNAME is optional (will use account/me if not set)')
  } else if (!TENDERLY_REST_API_URL) {
    console.error('[Tenderly] REST API URL construction failed!')
  } else {
    console.log('[Tenderly] REST API URL constructed successfully:', TENDERLY_REST_API_URL)
    console.log('[Tenderly] Using endpoint pattern:', TENDERLY_USERNAME ? 'account/{username}/project/{project}' : 'account/me/project/{project}')
  }
}

// Network ID mapping
const NETWORK_IDS = {
  mainnet: '1',
  sepolia: '11155111'
}

/**
 * Simulates a single transaction using Tenderly REST API
 * Falls back to RPC API if REST API is not configured
 */
export async function simulateTransaction(
  transaction: Transaction,
  fromAddress: Address,
  network: 'mainnet' | 'sepolia' = 'mainnet',
  stateOverrides?: Record<string, any>
): Promise<SimulationResult> {

  if (!TENDERLY_ACCESS_KEY) {
    throw new Error('Tenderly access key not configured')
  }

  // Try REST API first (better support for state overrides and balance)
  if (TENDERLY_REST_API_URL) {
    console.log('[Tenderly] Using REST API (better for state overrides)')
    try {
      return await simulateTransactionREST(transaction, fromAddress, network, stateOverrides)
    } catch (error) {
      console.error('[Tenderly] REST API failed:', error)
      console.warn('[Tenderly] Falling back to RPC API...')
      // Fall through to RPC API
    }
  } else {
    console.warn('[Tenderly] REST API not configured (missing VITE_TENDERLY_USERNAME or VITE_TENDERLY_PROJECT), using RPC API')
    console.warn('[Tenderly] Note: RPC API has limited support for state overrides and balance overrides')
  }

  // Fallback to RPC API
  const rpcUrl = TENDERLY_RPC_URLS[network]

  // Format transaction for Tenderly
  // All numeric values must be hex strings
  const gasLimit = 10000000
  const gasLimitHex = `0x${gasLimit.toString(16)}`
  
  // Convert value to hex if it's a decimal string
  let valueHex = transaction.value
  if (transaction.value && !transaction.value.startsWith('0x')) {
    try {
      const valueBigInt = BigInt(transaction.value)
      valueHex = `0x${valueBigInt.toString(16)}`
    } catch (e) {
      // If conversion fails, use as-is
      valueHex = transaction.value
    }
  }

  // For EIP-1559 transactions (Sepolia and Mainnet), we need maxFeePerGas and maxPriorityFeePerGas
  // Set reasonable values for simulation (gas price doesn't affect simulation outcome)
  // Using 20 gwei base fee + 2 gwei priority fee as reasonable defaults
  const baseFeePerGas = BigInt(20_000_000_000) // 20 gwei
  const maxPriorityFeePerGas = BigInt(2_000_000_000) // 2 gwei
  const maxFeePerGas = baseFeePerGas + maxPriorityFeePerGas // 22 gwei

  // Tenderly RPC API expects 'input' instead of 'data' for calldata
  const simulationRequest: TenderlySimulationRequest = {
    from: fromAddress,
    to: transaction.target,
    gas: gasLimitHex, // Must be hex string
    gasLimit: gasLimitHex, // Also set gasLimit explicitly (some APIs expect this)
    gasPrice: `0x${maxFeePerGas.toString(16)}`, // Use maxFeePerGas for legacy compatibility
    value: valueHex, // Must be hex string
    data: transaction.calldata // Will be mapped to 'input' in the actual request
  }
  
  console.log('[Tenderly] Formatted simulation request:', {
    from: simulationRequest.from,
    to: simulationRequest.to,
    gas: simulationRequest.gas,
    gasPrice: simulationRequest.gasPrice,
    value: simulationRequest.value,
    data: simulationRequest.data.substring(0, 100) + '...'
  })

  // Tenderly RPC API format for simulateTransaction
  // The third parameter is state overrides (optional)
  // Format: [transaction, blockNumber, stateOverrides]
  // Note: Tenderly expects 'input' field instead of 'data' for calldata
  // For EIP-1559, we can use maxFeePerGas and maxPriorityFeePerGas, or gasPrice
  // Using gasPrice for compatibility, but setting it to a reasonable value
  // IMPORTANT: Ensure gas is always set - Tenderly requires it for intrinsic gas calculation
  const gasValue = simulationRequest.gas || simulationRequest.gasLimit || gasLimitHex
  if (!gasValue || gasValue === '0x0' || gasValue === '0x') {
    throw new Error(`Invalid gas value: ${gasValue}. Gas must be set for simulation.`)
  }
  
  // Tenderly RPC API format
  // For EIP-1559 transactions, use maxFeePerGas/maxPriorityFeePerGas (don't include gasPrice)
  // For legacy transactions, use gasPrice
  const tenderlyTransaction: any = {
    from: simulationRequest.from,
    to: simulationRequest.to,
    gasLimit: gasValue, // Primary gas field - REQUIRED
    gas: gasValue, // Also include for compatibility
    value: simulationRequest.value,
    input: simulationRequest.data // Tenderly uses 'input' instead of 'data'
  }
  
  // For EIP-1559 networks (Sepolia and Mainnet), use maxFeePerGas and maxPriorityFeePerGas
  // Do NOT include gasPrice when using EIP-1559 fields
  if (network === 'sepolia' || network === 'mainnet') {
    tenderlyTransaction.maxFeePerGas = simulationRequest.gasPrice
    tenderlyTransaction.maxPriorityFeePerGas = `0x${maxPriorityFeePerGas.toString(16)}`
    // Don't include gasPrice for EIP-1559 transactions
  } else {
    // For non-EIP-1559 networks, use gasPrice
    tenderlyTransaction.gasPrice = simulationRequest.gasPrice
  }
  
  console.log('[Tenderly] Transaction gas fields:', {
    gas: tenderlyTransaction.gas,
    gasLimit: tenderlyTransaction.gasLimit,
    gasPrice: tenderlyTransaction.gasPrice,
    maxFeePerGas: tenderlyTransaction.maxFeePerGas,
    maxPriorityFeePerGas: tenderlyTransaction.maxPriorityFeePerGas
  })
  
  // Build params array - only include state overrides if they exist and are non-empty
  const params: any[] = [tenderlyTransaction, 'latest']
  
  // Only add state overrides if they exist and are non-empty
  // Some Tenderly endpoints may not support state overrides
  if (stateOverrides && Object.keys(stateOverrides).length > 0) {
    params.push(stateOverrides)
  }
  
  const rpcPayload = {
    id: 0,
    jsonrpc: '2.0',
    method: 'tenderly_simulateTransaction',
    params
  }

  console.log('[Tenderly] RPC Payload:', JSON.stringify({
    method: rpcPayload.method,
    params: [
      {
        from: tenderlyTransaction.from,
        to: tenderlyTransaction.to,
        value: tenderlyTransaction.value,
        gas: tenderlyTransaction.gas,
        gasLimit: tenderlyTransaction.gasLimit,
        gasPrice: tenderlyTransaction.gasPrice,
        maxFeePerGas: tenderlyTransaction.maxFeePerGas,
        maxPriorityFeePerGas: tenderlyTransaction.maxPriorityFeePerGas,
        input: tenderlyTransaction.input.substring(0, 100) + '...' // Truncate for readability
      },
      'latest',
      ...(stateOverrides && Object.keys(stateOverrides).length > 0 ? [stateOverrides] : [])
    ]
  }, null, 2))
  
  // Log the actual payload being sent (for debugging)
  console.log('[Tenderly] Actual RPC Payload (full):', JSON.stringify(rpcPayload, null, 2))
  
  // Verify gas is set correctly
  if (!tenderlyTransaction.gas || tenderlyTransaction.gas === '0x0' || tenderlyTransaction.gas === '0x') {
    console.error('[Tenderly] ERROR: Gas field is missing or zero!', {
      gas: tenderlyTransaction.gas,
      gasLimit: tenderlyTransaction.gasLimit
    })
  }

  try {
    console.log('[Tenderly] ========================================')
    console.log('[Tenderly] Simulating Transaction')
    console.log('[Tenderly] ========================================')
    console.log('[Tenderly] Network:', network)
    console.log('[Tenderly] From (Executor):', fromAddress)
    console.log('[Tenderly] To (Target):', transaction.target)
    console.log('[Tenderly] Value:', transaction.value)
    console.log('[Tenderly] Signature:', transaction.signature)
    console.log('[Tenderly] Calldata:', transaction.calldata)
    console.log('[Tenderly] Calldata Length:', transaction.calldata.length)
    console.log('[Tenderly] RPC URL:', rpcUrl.replace(TENDERLY_ACCESS_KEY || '', '[REDACTED]'))
    console.log('[Tenderly] ========================================')

    // Add timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    console.log('[Tenderly] Sending request to Tenderly...')
    const requestStartTime = Date.now()
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(rpcPayload),
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    const requestDuration = Date.now() - requestStartTime
    console.log('[Tenderly] Response received in', requestDuration, 'ms')
    console.log('[Tenderly] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Tenderly] ========================================')
      console.error('[Tenderly] API ERROR')
      console.error('[Tenderly] ========================================')
      console.error('[Tenderly] Status:', response.status)
      console.error('[Tenderly] Status Text:', response.statusText)
      console.error('[Tenderly] Error Response:', errorText)
      console.error('[Tenderly] ========================================')
      throw new Error(`Tenderly API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data: TenderlySimulationResponse = await response.json()
    console.log('[Tenderly] Response data:', JSON.stringify(data, null, 2))

    // Handle JSON-RPC error response
    if (data.error) {
      console.error('[Tenderly] ========================================')
      console.error('[Tenderly] JSON-RPC ERROR')
      console.error('[Tenderly] ========================================')
      console.error('[Tenderly] Error Code:', data.error.code)
      console.error('[Tenderly] Error Message:', data.error.message)
      console.error('[Tenderly] Error Data:', data.error.data)
      console.error('[Tenderly] ========================================')
      return {
        success: false,
        error: data.error.message || 'Tenderly simulation failed',
        transactionIndex: 0
      }
    }

    if (data.result?.error) {
      console.error('[Tenderly] ========================================')
      console.error('[Tenderly] SIMULATION RESULT ERROR')
      console.error('[Tenderly] ========================================')
      console.error('[Tenderly] Error:', data.result.error)
      console.error('[Tenderly] Full Result:', JSON.stringify(data.result, null, 2))
      console.error('[Tenderly] ========================================')
      return {
        success: false,
        error: data.result.error,
        transactionIndex: 0 // Set by caller
      }
    }

    if (!data.result) {
      console.error('[Tenderly] ========================================')
      console.error('[Tenderly] NO RESULT IN RESPONSE')
      console.error('[Tenderly] ========================================')
      console.error('[Tenderly] Full Response:', JSON.stringify(data, null, 2))
      console.error('[Tenderly] ========================================')
      return {
        success: false,
        error: 'No simulation result returned',
        transactionIndex: 0
      }
    }

    const result = {
      success: data.result.status,
      gasUsed: parseInt(data.result.gasUsed, 16),
      logs: data.result.logs,
      transactionIndex: 0 // Set by caller
    }

    console.log('[Tenderly] ========================================')
    console.log('[Tenderly] SIMULATION SUCCESS')
    console.log('[Tenderly] ========================================')
    console.log('[Tenderly] Status:', result.success ? 'SUCCESS' : 'FAILED')
    console.log('[Tenderly] Gas Used:', result.gasUsed)
    console.log('[Tenderly] Logs Count:', data.result.logs?.length || 0)
    console.log('[Tenderly] ========================================')

    return result
  } catch (error) {
    console.error('[Tenderly] Simulation error:', error)
    
    let errorMessage = 'Unknown simulation error'
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Simulation timeout (30s) - Tenderly API may be slow or unavailable'
      } else {
        errorMessage = error.message
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      transactionIndex: 0
    }
  }
}

/**
 * Simulates a transaction using Tenderly REST API
 * This API has better support for state overrides and balance overrides
 */
async function simulateTransactionREST(
  transaction: Transaction,
  fromAddress: Address,
  network: 'mainnet' | 'sepolia' = 'mainnet',
  stateOverrides?: Record<string, any>
): Promise<SimulationResult> {
  if (!TENDERLY_REST_API_URL) {
    throw new Error('Tenderly REST API not configured')
  }

  const networkId = NETWORK_IDS[network]
  
  // Convert value to hex if needed
  let valueHex = transaction.value
  if (transaction.value && !transaction.value.startsWith('0x')) {
    try {
      const valueBigInt = BigInt(transaction.value)
      valueHex = `0x${valueBigInt.toString(16)}`
    } catch (e) {
      valueHex = transaction.value
    }
  }

  // Build simulation request for REST API (matching Nouns Camp format)
  // Always add balance override for executor to ensure simulation succeeds
  // Use a very large balance (max uint256) to simulate unlimited funds
  const maxBalance = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
  
  const simulationRequest: any = {
    from: fromAddress,
    to: transaction.target,
    input: transaction.calldata,
    value: valueHex,
    estimate_gas: true,
    network_id: networkId,
    save: true,
    save_if_fails: true,
    simulation_type: 'full',
    // Add state overrides with balance override for executor
    // This ensures the executor has unlimited ETH for gas
    state_overrides: {
      [fromAddress.toLowerCase()]: {
        balance: maxBalance // Unlimited balance for simulation
      },
      // Merge any additional state overrides (like admin slot)
      ...(stateOverrides || {})
    }
  }

  console.log('[Tenderly REST] State overrides:', JSON.stringify(simulationRequest.state_overrides, null, 2))

  console.log('[Tenderly REST] ========================================')
  console.log('[Tenderly REST] Simulating Transaction')
  console.log('[Tenderly REST] ========================================')
  console.log('[Tenderly REST] From (Executor):', fromAddress)
  console.log('[Tenderly REST] To (Target):', transaction.target)
  console.log('[Tenderly REST] Value:', valueHex)
  console.log('[Tenderly REST] Input:', transaction.calldata)
  console.log('[Tenderly REST] Network ID:', networkId)
  console.log('[Tenderly REST] Has State Overrides:', !!(stateOverrides && Object.keys(stateOverrides).length > 0))
  if (stateOverrides && Object.keys(stateOverrides).length > 0) {
    console.log('[Tenderly REST] State Overrides:', JSON.stringify(stateOverrides, null, 2))
  }
  console.log('[Tenderly REST] ========================================')

  try {
    const apiUrl = `${TENDERLY_REST_API_URL}/simulate`
    console.log('[Tenderly REST] ========================================')
    console.log('[Tenderly REST] API Configuration Check')
    console.log('[Tenderly REST] ========================================')
    console.log('[Tenderly REST] Full API URL:', apiUrl)
    console.log('[Tenderly REST] Username:', TENDERLY_USERNAME)
    console.log('[Tenderly REST] Project:', TENDERLY_PROJECT)
    console.log('[Tenderly REST] Access Key Length:', TENDERLY_ACCESS_KEY?.length || 'MISSING')
    console.log('[Tenderly REST] Access Key Format:', TENDERLY_ACCESS_KEY ? `${TENDERLY_ACCESS_KEY.substring(0, 4)}...${TENDERLY_ACCESS_KEY.substring(TENDERLY_ACCESS_KEY.length - 4)}` : 'MISSING')
    console.log('[Tenderly REST] ========================================')
    console.log('[Tenderly REST] Request payload:', JSON.stringify(simulationRequest, null, 2))
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Access-Key': TENDERLY_ACCESS_KEY!
      },
      body: JSON.stringify(simulationRequest),
      cache: 'no-cache'
    })
    
    console.log('[Tenderly REST] Response status:', response.status, response.statusText)
    console.log('[Tenderly REST] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Tenderly REST] API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      })
      
      if (response.status === 403) {
        console.error('[Tenderly REST] ========================================')
        console.error('[Tenderly REST] 403 FORBIDDEN - Authentication Issue')
        console.error('[Tenderly REST] ========================================')
        console.error('[Tenderly REST] Possible causes:')
        console.error('[Tenderly REST]   1. API key does not have permissions for this project')
        console.error('[Tenderly REST]   2. API key is expired or invalid')
        console.error('[Tenderly REST]   3. Username/project combination is incorrect')
        console.error('[Tenderly REST]   4. API key needs to be regenerated in Tenderly dashboard')
        console.error('[Tenderly REST]')
        console.error('[Tenderly REST] To fix:')
        console.error('[Tenderly REST]   1. Go to https://dashboard.tenderly.co/')
        console.error('[Tenderly REST]   2. Navigate to Settings > Authorization')
        console.error('[Tenderly REST]   3. Verify the API key has access to project:', TENDERLY_PROJECT)
        console.error('[Tenderly REST]   4. Regenerate the API key if needed')
        console.error('[Tenderly REST]   5. Update VITE_TENDERLY_ACCESS_KEY in your .env file')
        console.error('[Tenderly REST] ========================================')
      }
      
      throw new Error(`Tenderly REST API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    console.log('[Tenderly REST] Response data:', JSON.stringify(data, null, 2))

    // Check for errors in response
    if (data.error) {
      console.error('[Tenderly REST] ========================================')
      console.error('[Tenderly REST] SIMULATION ERROR')
      console.error('[Tenderly REST] ========================================')
      console.error('[Tenderly REST] Error:', data.error)
      console.error('[Tenderly REST] ========================================')
      return {
        success: false,
        error: data.error.message || data.error || 'Simulation failed',
        transactionIndex: 0
      }
    }

    const simulation = data.simulation || {}
    
    // Share simulation to make it publicly viewable
    if (simulation.id) {
      try {
        await fetch(`${TENDERLY_REST_API_URL}/simulations/${simulation.id}/share`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Access-Key': TENDERLY_ACCESS_KEY!
          }
        })
        console.log('[Tenderly REST] Simulation shared:', simulation.id)
      } catch (shareError) {
        console.warn('[Tenderly REST] Failed to share simulation:', shareError)
      }
    }
    
    console.log('[Tenderly REST] ========================================')
    console.log('[Tenderly REST] SIMULATION RESULT')
    console.log('[Tenderly REST] ========================================')
    console.log('[Tenderly REST] Status:', simulation.status ? 'SUCCESS' : 'FAILED')
    console.log('[Tenderly REST] Gas Used:', simulation.gas_used)
    console.log('[Tenderly REST] Error Message:', simulation.error_message)
    console.log('[Tenderly REST] Simulation ID:', simulation.id)
    console.log('[Tenderly REST] ========================================')
    
    return {
      success: simulation.status === true,
      gasUsed: simulation.gas_used ? parseInt(simulation.gas_used, 16) : undefined,
      logs: simulation.logs || [],
      transactionIndex: 0,
      error: simulation.status === false ? (simulation.error_message || 'Simulation failed') : undefined
    }
  } catch (error) {
    console.error('[Tenderly REST] Simulation error:', error)
    throw error
  }
}

/**
 * Build state overrides to ensure executor has permissions
 * This sets the executor as admin/owner where needed
 * 
 * Note: Tenderly state overrides may not be supported on all networks/endpoints
 * If state overrides fail, we may need to use Tenderly's Simulation API instead of RPC
 * 
 * Format (if supported):
 * {
 *   "0xContractAddress": {
 *     "state": {
 *       "0xStorageSlot": "0xValue"
 *     }
 *   }
 * }
 */
function buildStateOverrides(
  targetContract: Address,
  executorAddress: Address
): Record<string, any> | null {
  // NounsDAOProxy stores admin at storage slot 0 (first variable in NounsDAOProxyStorage)
  // Format: address needs to be padded to 32 bytes (64 hex chars + 0x prefix = 66 chars total)
  const adminSlot = "0x0000000000000000000000000000000000000000000000000000000000000000"
  
  // Remove 0x prefix, pad address part to 64 hex characters (32 bytes), then add 0x back
  const addressWithoutPrefix = executorAddress.toLowerCase().replace(/^0x/, '')
  const paddedAddress = addressWithoutPrefix.padStart(64, '0')
  const executorValue = `0x${paddedAddress}` // Should be 66 chars total (0x + 64 hex chars)
  
  // Set executor balance to a high value for simulation (100 ETH)
  // This ensures the executor has enough funds to pay for gas
  const executorBalance = BigInt(100) * BigInt(10 ** 18) // 100 ETH in wei
  const executorBalanceHex = `0x${executorBalance.toString(16)}`
  
  console.log('[Tenderly] Building state overrides:', {
    targetContract: targetContract.toLowerCase(),
    executorAddress,
    adminSlot,
    executorValue,
    executorValueLength: executorValue.length,
    executorBalance: executorBalanceHex
  })
  
  // Return state overrides with:
  // 1. Admin slot override for the target contract
  // 2. Balance override for the executor address
  return {
    [targetContract.toLowerCase()]: {
      state: {
        [adminSlot]: executorValue
      }
    },
    [executorAddress.toLowerCase()]: {
      balance: executorBalanceHex
    }
  }
}

/**
 * Simulates all transactions in sequence with state carried forward
 * Uses Tenderly's simulation bundle API to ensure state changes from
 * previous transactions are applied to subsequent ones
 */
export async function simulateTransactionBundle(
  transactions: Transaction[],
  daoExecutorAddress: Address,
  network: 'mainnet' | 'sepolia' = 'mainnet'
): Promise<SimulationResult[]> {

  if (transactions.length === 0) {
    return []
  }

  // Try REST API bundle simulation first (supports sequential state)
  if (TENDERLY_REST_API_URL) {
    try {
      console.log('[Tenderly Bundle] Attempting REST bundle API simulation...')
      const results = await simulateTransactionBundleREST(
        transactions,
        daoExecutorAddress,
        network
      )
      console.log('[Tenderly Bundle] REST bundle API succeeded with', results.length, 'results')
      return results
    } catch (error) {
      console.error('[Tenderly Bundle] ========================================')
      console.error('[Tenderly Bundle] REST BUNDLE API FAILED')
      console.error('[Tenderly Bundle] ========================================')
      console.error('[Tenderly Bundle] Error:', error)
      console.error('[Tenderly Bundle] Error message:', error instanceof Error ? error.message : String(error))
      console.error('[Tenderly Bundle] Error stack:', error instanceof Error ? error.stack : 'N/A')
      console.error('[Tenderly Bundle] ========================================')
      console.warn('[Tenderly Bundle] Falling back to individual simulations...')
      console.warn('[Tenderly Bundle] NOTE: Individual simulations do NOT carry state forward!')
      // Fall through to individual simulations
    }
  } else {
    console.warn('[Tenderly Bundle] REST API URL not configured, using individual simulations')
  }

  // Fallback: Simulate each transaction individually
  // Note: This doesn't carry state forward, so transactions that depend on
  // previous state changes may fail
  console.warn('[Tenderly Bundle] Using individual simulations (state not carried forward)')
  const results: SimulationResult[] = []

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i]

    // Build state overrides to ensure executor has permissions on target contract
    const stateOverrides = buildStateOverrides(tx.target as Address, daoExecutorAddress)

    console.log('[Tenderly Bundle] ========================================')
    console.log('[Tenderly Bundle] Transaction', i + 1, 'of', transactions.length)
    console.log('[Tenderly Bundle] ========================================')
    console.log('[Tenderly Bundle] Target:', tx.target)
    console.log('[Tenderly Bundle] Executor:', daoExecutorAddress)
    console.log('[Tenderly Bundle] Signature:', tx.signature)
    console.log('[Tenderly Bundle] Value:', tx.value)
    console.log('[Tenderly Bundle] Calldata:', tx.calldata)
    console.log('[Tenderly Bundle] State Overrides:', JSON.stringify(stateOverrides, null, 2))
    console.log('[Tenderly Bundle] ========================================')

    // Try simulation with state overrides first
    let result = await simulateTransaction(
      tx,
      daoExecutorAddress,
      network,
      stateOverrides || undefined
    )
    
    // If state overrides aren't supported, try without them
    if (!result.success && result.error?.includes('not supported')) {
      console.log('[Tenderly Bundle] State overrides not supported, retrying without overrides...')
      result = await simulateTransaction(
        tx,
        daoExecutorAddress,
        network,
        undefined
      )
    }

    result.transactionIndex = i
    results.push(result)

    // Stop simulating if a transaction fails
    if (!result.success) {
      // Mark remaining as blocked
      for (let j = i + 1; j < transactions.length; j++) {
        results.push({
          success: false,
          error: 'Previous transaction failed',
          transactionIndex: j
        })
      }
      break
    }
  }

  return results
}

/**
 * Simulates a bundle of transactions sequentially using Tenderly REST API
 * State changes from each transaction are carried forward to the next
 */
async function simulateTransactionBundleREST(
  transactions: Transaction[],
  daoExecutorAddress: Address,
  network: 'mainnet' | 'sepolia' = 'mainnet'
): Promise<SimulationResult[]> {
  if (!TENDERLY_REST_API_URL) {
    throw new Error('Tenderly REST API not configured')
  }

  const networkId = NETWORK_IDS[network]
  const maxBalance = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'

  // Build initial state overrides (executor balance + admin permissions)
  // These will be applied to the first transaction
  const initialStateOverrides: Record<string, any> = {
    [daoExecutorAddress.toLowerCase()]: {
      balance: maxBalance
    }
  }

  // Add admin slot override for each unique target contract
  const targetContracts = new Set(transactions.map(tx => tx.target.toLowerCase()))
  for (const targetContract of targetContracts) {
    const adminSlot = "0x0000000000000000000000000000000000000000000000000000000000000000"
    const addressWithoutPrefix = daoExecutorAddress.toLowerCase().replace(/^0x/, '')
    const paddedAddress = addressWithoutPrefix.padStart(64, '0')
    const executorValue = `0x${paddedAddress}`
    
    initialStateOverrides[targetContract] = {
      state: {
        [adminSlot]: executorValue
      }
    }
  }

  // Build simulation array for bundle API (matching Nouns Camp format)
  const simulations = transactions.map((tx, index) => {
    // Convert value to hex if needed
    let valueHex = tx.value || '0'
    if (valueHex && !valueHex.startsWith('0x')) {
      try {
        const valueBigInt = BigInt(valueHex)
        valueHex = `0x${valueBigInt.toString(16)}`
      } catch (e) {
        valueHex = valueHex || '0'
      }
    }

    // Match Nouns Camp's exact request format
    const simulation: any = {
      from: daoExecutorAddress,
      to: tx.target,
      input: tx.calldata,
      value: valueHex,
      estimate_gas: true,
      network_id: networkId,
      save: true,
      save_if_fails: true,
      simulation_type: 'full'
    }

    // Only apply initial state overrides to the first transaction
    // Subsequent transactions will use state from previous simulations
    if (index === 0 && Object.keys(initialStateOverrides).length > 0) {
      simulation.state_overrides = initialStateOverrides
    }

    return simulation
  })

  console.log('[Tenderly Bundle REST] ========================================')
  console.log('[Tenderly Bundle REST] Simulating', transactions.length, 'transactions sequentially')
  console.log('[Tenderly Bundle REST] ========================================')
  console.log('[Tenderly Bundle REST] Network ID:', networkId)
  console.log('[Tenderly Bundle REST] Executor:', daoExecutorAddress)
  console.log('[Tenderly Bundle REST] Initial State Overrides:', JSON.stringify(initialStateOverrides, null, 2))
  console.log('[Tenderly Bundle REST] ========================================')

  try {
    const bundleRequest = {
      simulations
    }

    console.log('[Tenderly Bundle REST] Request payload:', JSON.stringify(bundleRequest, null, 2))

    const response = await fetch(`${TENDERLY_REST_API_URL}/simulate-bundle`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Access-Key': TENDERLY_ACCESS_KEY!
      },
      body: JSON.stringify(bundleRequest),
      cache: 'no-cache'
    })

    console.log('[Tenderly Bundle REST] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Tenderly Bundle REST] API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      })
      
      // If bundle endpoint doesn't exist (404) or isn't supported, throw to trigger fallback
      if (response.status === 404 || response.status === 501) {
        throw new Error(`Bundle API not available (${response.status}): ${errorText}`)
      }
      
      throw new Error(`Tenderly bundle API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    console.log('[Tenderly Bundle REST] ========================================')
    console.log('[Tenderly Bundle REST] Raw Response Structure')
    console.log('[Tenderly Bundle REST] ========================================')
    console.log('[Tenderly Bundle REST] Type:', Array.isArray(data) ? 'Array' : typeof data)
    console.log('[Tenderly Bundle REST] Keys:', Array.isArray(data) ? `Array[${data.length}]` : Object.keys(data))
    console.log('[Tenderly Bundle REST] Full response:', JSON.stringify(data, null, 2).substring(0, 2000))
    console.log('[Tenderly Bundle REST] ========================================')

    // Parse bundle response
    // Tenderly bundle API can return results in different formats:
    // 1. { simulations: [{ transaction: { status: true, ... }, ... }, ...] }
    // 2. { simulations: [{ simulation: { transaction: {...} }, ... }, ...] }
    // 3. Direct array: [{ transaction: {...}, ... }, ...]
    let simulationsArray: any[] = []
    
    if (Array.isArray(data)) {
      simulationsArray = [...data]
      console.log('[Tenderly Bundle REST] Response is direct array with', simulationsArray.length, 'items')
    } else if (data.simulation_results && Array.isArray(data.simulation_results)) {
      simulationsArray = [...data.simulation_results]
      console.log('[Tenderly Bundle REST] Response has simulation_results array with', simulationsArray.length, 'items')
    } else if (data.simulations && Array.isArray(data.simulations)) {
      simulationsArray = [...data.simulations]
      console.log('[Tenderly Bundle REST] Response has simulations array with', simulationsArray.length, 'items')
    } else if (data.results && Array.isArray(data.results)) {
      simulationsArray = [...data.results]
      console.log('[Tenderly Bundle REST] Response has results array with', simulationsArray.length, 'items')
    } else {
      console.error('[Tenderly Bundle REST] ========================================')
      console.error('[Tenderly Bundle REST] UNEXPECTED RESPONSE FORMAT')
      console.error('[Tenderly Bundle REST] ========================================')
      console.error('[Tenderly Bundle REST] Response type:', typeof data)
      console.error('[Tenderly Bundle REST] Response keys:', Object.keys(data))
      console.error('[Tenderly Bundle REST] Full response:', JSON.stringify(data, null, 2))
      console.error('[Tenderly Bundle REST] ========================================')
      throw new Error(`Invalid bundle response format: expected simulations array, got ${typeof data} with keys: ${Object.keys(data).join(', ')}`)
    }
    
    if (simulationsArray.length !== transactions.length) {
      console.warn(`[Tenderly Bundle REST] Warning: Expected ${transactions.length} simulations, got ${simulationsArray.length}`)
    }

    const results: SimulationResult[] = simulationsArray.map((sim: any, index: number) => {
      console.log(`[Tenderly Bundle REST] Parsing simulation ${index + 1}:`, JSON.stringify(sim, null, 2))
      
      // Handle different response formats
      // Tenderly bundle API can return:
      // 1. Direct transaction object: { transaction: { status: true, gas_used: ... }, ... }
      // 2. Nested: { simulation: { transaction: { status: true, ... } } }
      // 3. Flat: { status: true, gas_used: ..., transaction: { ... } }
      // Based on curl test, the structure is: { transaction: { status: true, gas_used: ... }, ... }
      
      // Try multiple paths to find the transaction object
      const transaction = sim.transaction || 
                         sim.simulation?.transaction || 
                         (sim.simulation && !sim.transaction ? sim.simulation : null) ||
                         sim
      
      // The simulation object is the parent (for logs, etc.)
      const simulation = sim.simulation || sim
      
      // Check if this simulation succeeded
      // Priority order: transaction.status > simulation.status > sim.status
      let status: boolean = true
      if (transaction?.status !== undefined) {
        status = transaction.status === true
      } else if (simulation?.status !== undefined) {
        status = simulation.status === true
      } else if (sim.status !== undefined) {
        status = sim.status === true
      } else {
        // Check for error indicators - if any error exists, mark as failed
        if (transaction?.error || simulation?.error || sim.error) {
          status = false
        } else if (transaction?.error_message || simulation?.error_message || sim.error_message) {
          status = false
        }
      }
      
      // Extract gas used (could be hex or decimal)
      // Priority: transaction.gas_used > simulation.gas_used > sim.gas_used
      let gasUsed: number | undefined
      const gasUsedValue = transaction?.gas_used || 
                          simulation?.gas_used ||
                          sim.gas_used
      if (gasUsedValue !== undefined) {
        if (typeof gasUsedValue === 'string') {
          gasUsed = gasUsedValue.startsWith('0x') 
            ? parseInt(gasUsedValue, 16) 
            : parseInt(gasUsedValue, 10)
        } else {
          gasUsed = gasUsedValue
        }
      }
      
      // Extract error message - check multiple possible locations
      let errorMessage: string | undefined
      if (!status) {
        // Check transaction level first, then simulation level, then top level
        errorMessage = transaction?.error_message ||
                      transaction?.error?.message ||
                      transaction?.error?.error_message ||
                      simulation?.error_message ||
                      simulation?.error?.message ||
                      simulation?.error?.error_message ||
                      sim.error_message ||
                      sim.error?.message ||
                      transaction?.result?.error ||
                      'Simulation failed: execution reverted'
      }
      
      // Extract logs from various possible locations
      const logs = transaction?.logs || 
                   simulation?.logs || 
                   sim.logs || 
                   []
      
      console.log(`[Tenderly Bundle REST] Simulation ${index + 1} parsed:`, {
        success: status,
        gasUsed,
        error: errorMessage,
        hasSimulation: !!simulation,
        hasTransaction: !!transaction,
        transactionStatus: transaction?.status,
        simulationStatus: simulation?.status
      })
      
      return {
        success: status,
        gasUsed,
        logs,
        transactionIndex: index,
        error: errorMessage
      }
    })

    console.log('[Tenderly Bundle REST] ========================================')
    console.log('[Tenderly Bundle REST] Bundle Simulation Results')
    console.log('[Tenderly Bundle REST] ========================================')
    results.forEach((result, index) => {
      console.log(`[Tenderly Bundle REST] Transaction ${index + 1}:`, {
        success: result.success,
        gasUsed: result.gasUsed,
        error: result.error
      })
    })
    console.log('[Tenderly Bundle REST] ========================================')

    return results
  } catch (error) {
    console.error('[Tenderly Bundle REST] Simulation error:', error)
    throw error
  }
}

