import { parseActionsFromJSON } from '../action-json-parser'

describe('parseActionsFromJSON', () => {
  it('should parse valid one-time-payment action', () => {
    const json = JSON.stringify([
      {
        type: 'one-time-payment',
        target: '0x1234567890123456789012345678901234567890',
        amount: '1.5',
        currency: 'eth'
      }
    ])

    const result = parseActionsFromJSON(json)

    expect(result.success).toBe(true)
    expect(result.actions).toHaveLength(1)
    expect(result.actions?.[0]).toEqual({
      type: 'one-time-payment',
      target: '0x1234567890123456789012345678901234567890',
      amount: '1.5',
      currency: 'eth'
    })
  })

  it('should parse valid custom-transaction action', () => {
    const json = JSON.stringify([
      {
        type: 'custom-transaction',
        contractCallTarget: '0x1234567890123456789012345678901234567890',
        contractCallSignature: 'transfer(address,uint256)',
        contractCallArguments: ['0x1234567890123456789012345678901234567890', '1000000'],
        contractCallValue: '0'
      }
    ])

    const result = parseActionsFromJSON(json)

    expect(result.success).toBe(true)
    expect(result.actions).toHaveLength(1)
    expect(result.actions?.[0].type).toBe('custom-transaction')
  })

  it('should parse multiple actions', () => {
    const json = JSON.stringify([
      {
        type: 'one-time-payment',
        target: '0x1234567890123456789012345678901234567890',
        amount: '1.5',
        currency: 'eth'
      },
      {
        type: 'treasury-noun-transfer',
        nounId: '42',
        target: '0x1234567890123456789012345678901234567890'
      }
    ])

    const result = parseActionsFromJSON(json)

    expect(result.success).toBe(true)
    expect(result.actions).toHaveLength(2)
  })

  it('should handle single object (not array)', () => {
    const json = JSON.stringify({
      type: 'one-time-payment',
      target: '0x1234567890123456789012345678901234567890',
      amount: '1.5',
      currency: 'eth'
    })

    const result = parseActionsFromJSON(json)

    expect(result.success).toBe(true)
    expect(result.actions).toHaveLength(1)
  })

  it('should reject invalid JSON', () => {
    const result = parseActionsFromJSON('invalid json {]')

    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors?.[0]).toContain('Invalid JSON format')
  })

  it('should reject action with invalid address', () => {
    const json = JSON.stringify([
      {
        type: 'one-time-payment',
        target: 'not-an-address',
        amount: '1.5',
        currency: 'eth'
      }
    ])

    const result = parseActionsFromJSON(json)

    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors?.[0]).toContain('Invalid Ethereum address')
  })

  it('should reject action with missing required fields', () => {
    const json = JSON.stringify([
      {
        type: 'one-time-payment',
        target: '0x1234567890123456789012345678901234567890'
        // missing amount and currency
      }
    ])

    const result = parseActionsFromJSON(json)

    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })

  it('should reject action with invalid currency', () => {
    const json = JSON.stringify([
      {
        type: 'one-time-payment',
        target: '0x1234567890123456789012345678901234567890',
        amount: '1.5',
        currency: 'bitcoin'
      }
    ])

    const result = parseActionsFromJSON(json)

    expect(result.success).toBe(false)
    expect(result.errors?.[0]).toContain('Invalid currency')
  })

  it('should reject streaming payment with ETH (not allowed)', () => {
    const json = JSON.stringify([
      {
        type: 'streaming-payment',
        target: '0x1234567890123456789012345678901234567890',
        amount: '100',
        currency: 'eth',
        startTimestamp: 1234567890,
        endTimestamp: 1234567900,
        predictedStreamContractAddress: '0x1234567890123456789012345678901234567890'
      }
    ])

    const result = parseActionsFromJSON(json)

    expect(result.success).toBe(false)
    expect(result.errors?.[0]).toContain('Invalid currency')
  })

  it('should reject streaming payment with invalid timestamps', () => {
    const json = JSON.stringify([
      {
        type: 'streaming-payment',
        target: '0x1234567890123456789012345678901234567890',
        amount: '100',
        currency: 'weth',
        startTimestamp: 1234567900,
        endTimestamp: 1234567890, // end before start
        predictedStreamContractAddress: '0x1234567890123456789012345678901234567890'
      }
    ])

    const result = parseActionsFromJSON(json)

    expect(result.success).toBe(false)
    expect(result.errors?.[0]).toContain('endTimestamp')
  })

  it('should parse valid payer-top-up action', () => {
    const json = JSON.stringify([
      {
        type: 'payer-top-up',
        amount: '10',
        currency: 'eth'
      }
    ])

    const result = parseActionsFromJSON(json)

    expect(result.success).toBe(true)
    expect(result.actions).toHaveLength(1)
    expect(result.actions?.[0]).toEqual({
      type: 'payer-top-up',
      amount: '10',
      currency: 'eth'
    })
  })
})
