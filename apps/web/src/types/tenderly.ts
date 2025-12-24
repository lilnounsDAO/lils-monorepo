/**
 * TypeScript type definitions for Tenderly simulation integration
 */

export interface TenderlySimulationRequest {
  from: string              // DAO executor address
  to: string                // Transaction target
  gas: string               // Gas limit as hex string (e.g., "0x989680")
  gasLimit?: string         // Gas limit (alternative field name)
  gasPrice: string          // Current gas price as hex string
  value: string             // ETH value in wei as hex string (e.g., "0x0")
  data: string              // Calldata (0x-prefixed hex)
}

export interface TenderlySimulationResponse {
  id?: number
  jsonrpc?: string
  result?: {
    status: boolean         // true = success, false = revert
    gasUsed: string        // Hex string
    logs: Array<{
      address: string
      topics: string[]
      data: string
    }>
    trace: Array<any>      // Call trace for debugging
    error?: string         // Error message if reverted
  }
  error?: {
    code: number
    message: string
    data?: any
  }
}

export interface SimulationResult {
  success: boolean
  gasUsed?: number
  error?: string
  transactionIndex: number  // Maps to action index
  logs?: Array<any>
}

export interface ActionSimulationState {
  actionIndex: number
  status: 'idle' | 'simulating' | 'success' | 'error'
  result?: SimulationResult
  error?: string
}

