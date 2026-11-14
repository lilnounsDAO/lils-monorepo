import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatUnits, parseEther, parseUnits } from 'viem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Action, PayerTopUpAction } from '@/types/proposal-editor'
import { cn } from '@/utils/shadcn'
import { useTokenPrices, formatUsdConversion } from '@/hooks/useTokenPrices'
import { parseActionsFromJSON } from '@/utils/action-json-parser'
import { FileJson, AlertCircle } from 'lucide-react'
import { getPayerStatus, PayerStatus, payerFundingAvailable } from '@/data/payer/getPayerStatus'
import { planTopUp, roundUpEther, TopUpPlan } from '@/data/payer/payerTopUp'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import {
  DrawerDialog,
  DrawerDialogContent,
  DrawerDialogContentInner,
  DrawerDialogTitle,
  DrawerDialogDescription,
} from "../ui/DrawerDialog"

interface ActionDialogProps {
  isOpen: boolean
  onClose: () => void
  /**
   * `topUp`, when set, is the payer top-up the proposal needs to fund this
   * action's USDC: added, or replacing `topUp.replaces` (one of `otherActions`)
   */
  onSubmit: (action: Action, topUp?: { action: PayerTopUpAction; replaces?: PayerTopUpAction }) => void
  onDelete?: () => void
  action?: Action
  title?: string
  onBulkSubmit?: (actions: Action[]) => void
  /** USDC the proposal's other actions already ask the Payer for, 6 decimals */
  pendingUsdc?: bigint
  /**
   * Size a payer top-up for USDC asks the Payer can't cover, and submit it with
   * the action. `otherActions` are the proposal's other actions: their USDC
   * counts, and their top-ups are resized rather than duplicated.
   */
  fundUsdcWithTopUp?: boolean
  otherActions?: Action[]
}

type ActionType = 'one-time-payment' | 'streaming-payment' | 'custom-transaction' | 'treasury-noun-transfer' | 'payer-top-up'

// Top-up fill amounts are padded 5% for price moves before the proposal executes
const FILL_BUFFER_BPS = 500n

const fmt = (value: bigint, decimals: number, digits = 4) =>
  Number(formatUnits(value, decimals)).toLocaleString(undefined, { maximumFractionDigits: digits })


const ActionDialog: React.FC<ActionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  action,
  title = 'Add Action',
  onBulkSubmit,
  pendingUsdc = 0n,
  fundUsdcWithTopUp = false,
  otherActions = [],
}) => {
  const [actionType, setActionType] = useState<ActionType>('one-time-payment')
  const [formData, setFormData] = useState<any>({
    target: '',
    amount: '',
    currency: 'eth',
    contractCallTarget: '',
    contractCallSignature: '',
    contractCallArguments: '',
    contractCallValue: '0',
    nounId: '',
    startTimestamp: Date.now(),
    endTimestamp: Date.now() + 86400000 * 30, // 30 days
  })
  const [jsonInput, setJsonInput] = useState('')
  const [jsonErrors, setJsonErrors] = useState<string[]>([])
  const [showJsonImport, setShowJsonImport] = useState(false)
  const { prices } = useTokenPrices()

  // USDC this action itself asks the Payer for, counted with the rest of the proposal
  const thisActionUsdc = (() => {
    if ((actionType !== 'one-time-payment' && actionType !== 'streaming-payment') || formData.currency !== 'usdc') return 0n
    try {
      return parseUnits(String(formData.amount || '0'), 6)
    } catch {
      return 0n
    }
  })()
  const fundingAvailable = payerFundingAvailable()
  const showPayer =
    isOpen &&
    fundingAvailable &&
    (actionType === 'payer-top-up' ||
      ((actionType === 'one-time-payment' || actionType === 'streaming-payment') && formData.currency === 'usdc'))
  const { data: payerStatus, isLoading: loadingPayer, isError: payerError } = useQuery({
    queryKey: ['payer-status', (pendingUsdc + thisActionUsdc).toString()],
    queryFn: () => getPayerStatus(pendingUsdc + thisActionUsdc, FILL_BUFFER_BPS),
    enabled: showPayer,
    staleTime: 30_000,
  })

  // The top-up this USDC ask needs, if the Payer can't cover the proposal's USDC
  const sizing = fundUsdcWithTopUp && fundingAvailable && thisActionUsdc > 0n
  const plan = sizing && payerStatus ? planTopUp(payerStatus, otherActions) : undefined
  // A USDC ask isn't added until the Payer has been checked, so it can't slip
  // in without the top-up that funds it
  const waitingOnPayer = sizing && !payerStatus

  // Update currency when switching action types
  useEffect(() => {
    setFormData((prev: typeof formData) => {
      if (actionType === 'streaming-payment' && (prev.currency === 'eth' || !['weth', 'usdc', 'steth', 'reth', 'oeth'].includes(prev.currency))) {
        // Streaming payments don't support ETH, convert to WETH
        return { ...prev, currency: 'weth' }
      } else if (actionType === 'one-time-payment' && !['eth', 'weth', 'usdc', 'steth', 'reth', 'oeth'].includes(prev.currency)) {
        // Reset to eth if invalid currency for one-time payment
        return { ...prev, currency: 'eth' }
      } else if (actionType === 'payer-top-up' && !['eth', 'steth'].includes(prev.currency)) {
        // The treasury holds mostly stETH, which TokenBuyerV2 sells directly
        return { ...prev, currency: 'steth' }
      }
      return prev
    })
  }, [actionType])

  useEffect(() => {
    if (action) {
      setActionType(action.type as ActionType)
      // If editing a streaming payment with 'eth', convert to 'weth'
      if (action.type === 'streaming-payment' && (action as any).currency === 'eth') {
        setFormData({ ...action, currency: 'weth' } as any)
      } else {
        setFormData(action as any)
      }
    } else {
      // Reset form when opening without an action
      // Default currency depends on action type
      const defaultCurrency =
        actionType === 'streaming-payment' ? 'weth' : actionType === 'payer-top-up' ? 'steth' : 'eth'
      setFormData({
        target: '',
        amount: '',
        currency: defaultCurrency,
        contractCallTarget: '',
        contractCallSignature: '',
        contractCallArguments: '',
        contractCallValue: '0',
        nounId: '',
        startTimestamp: Date.now(),
        endTimestamp: Date.now() + 86400000 * 30,
      })
    }
  }, [action, isOpen, actionType])

  const handleSubmit = () => {
    let actionData: Action

    switch (actionType) {
      case 'one-time-payment':
        actionData = {
          type: 'one-time-payment',
          target: formData.target,
          amount: formData.amount,
          currency: formData.currency as 'eth' | 'weth' | 'usdc' | 'steth' | 'reth' | 'oeth',
        }
        break
      case 'streaming-payment':
        // Convert 'eth' to 'weth' for streaming payments (ETH not supported)
        const streamingCurrency = formData.currency === 'eth' ? 'weth' : formData.currency
        if (!['weth', 'usdc', 'steth', 'reth', 'oeth'].includes(streamingCurrency)) {
          alert('Streaming payments only support WETH, USDC, stETH, rETH, or OETH. ETH is not supported.')
          return
        }
        actionData = {
          type: 'streaming-payment',
          target: formData.target,
          amount: formData.amount,
          currency: streamingCurrency as 'weth' | 'usdc' | 'steth' | 'reth' | 'oeth',
          startTimestamp: formData.startTimestamp,
          endTimestamp: formData.endTimestamp,
          predictedStreamContractAddress: '0x0000000000000000000000000000000000000000', // Will be calculated
        }
        break
      case 'custom-transaction':
        let args: any[] = []
        try {
          args = formData.contractCallArguments ? JSON.parse(formData.contractCallArguments) : []
        } catch (e) {
          alert('Invalid JSON for arguments')
          return
        }
        actionData = {
          type: 'custom-transaction',
          contractCallTarget: formData.contractCallTarget,
          contractCallSignature: formData.contractCallSignature,
          contractCallArguments: args,
          contractCallValue: formData.contractCallValue,
        }
        break
      case 'treasury-noun-transfer':
        actionData = {
          type: 'treasury-noun-transfer',
          nounId: formData.nounId,
          target: formData.target,
        }
        break
      case 'payer-top-up':
        actionData = {
          type: 'payer-top-up',
          amount: formData.amount,
          currency: formData.currency === 'eth' ? 'eth' : 'steth',
        }
        break
      default:
        return
    }

    onSubmit(actionData, plan?.kind === 'add' ? { action: plan.topUp, replaces: plan.previous } : undefined)
    onClose()
  }

  const isValid = () => {
    switch (actionType) {
      case 'one-time-payment':
      case 'streaming-payment':
        return formData.target && formData.amount && parseFloat(formData.amount) > 0 && !waitingOnPayer
      case 'custom-transaction':
        return formData.contractCallTarget && formData.contractCallSignature
      case 'treasury-noun-transfer':
        return formData.target && formData.nounId
      case 'payer-top-up':
        return formData.amount && parseFloat(formData.amount) > 0
      default:
        return false
    }
  }

  const handleJsonImport = () => {
    setJsonErrors([])

    if (!jsonInput.trim()) {
      setJsonErrors(['Please paste JSON data'])
      return
    }

    const result = parseActionsFromJSON(jsonInput)

    if (!result.success || !result.actions) {
      setJsonErrors(result.errors || ['Failed to parse JSON'])
      return
    }

    // If multiple actions, add them all via bulk submit
    if (result.actions.length > 1) {
      if (onBulkSubmit) {
        onBulkSubmit(result.actions)
        setShowJsonImport(false)
        setJsonInput('')
        setJsonErrors([])
        onClose()
      } else {
        setJsonErrors(['Bulk import requires the onBulkSubmit callback'])
      }
      return
    }

    // Single action - populate the form or submit directly
    const importedAction = result.actions[0]

    // If it's a custom transaction and we're in custom transaction mode, populate the form
    if (importedAction.type === 'custom-transaction' && actionType === 'custom-transaction') {
      setFormData({
        ...formData,
        contractCallTarget: importedAction.contractCallTarget,
        contractCallSignature: importedAction.contractCallSignature,
        contractCallArguments: JSON.stringify(importedAction.contractCallArguments),
        contractCallValue: importedAction.contractCallValue,
      })
      setShowJsonImport(false)
      setJsonInput('')
      setJsonErrors([])
    } else if (importedAction.type === 'custom-transaction') {
      // If not in custom transaction mode, submit directly
      onSubmit(importedAction)
      setShowJsonImport(false)
      setJsonInput('')
      setJsonErrors([])
      onClose()
    } else {
      // For non-custom transaction types, submit directly
      onSubmit(importedAction)
      setShowJsonImport(false)
      setJsonInput('')
      setJsonErrors([])
      onClose()
    }
  }

  return (
    <DrawerDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerDialogContent className="md:max-h-[85vh] md:max-w-[min(95vw,800px)]">
        <VisuallyHidden.Root>
          <DrawerDialogTitle>
            {title}
          </DrawerDialogTitle>
          <DrawerDialogDescription>
            {title === 'Add Action' ? 'Add a new proposal action' : 'Edit proposal action'}
          </DrawerDialogDescription>
        </VisuallyHidden.Root>
        <DrawerDialogContentInner className="p-0 md:flex-row">
          <div className="w-full pl-6 pt-6 heading-1 md:hidden">
            {title}
          </div>
          
          <div className="flex w-full flex-auto flex-col gap-6 overflow-visible px-6 pb-6 scrollbar-track-transparent md:h-full md:overflow-y-auto md:px-8 md:pt-12">
            <h2 className="hidden md:block">{title}</h2>
            
            <div className="space-y-4">
            {/* Action Type Selector */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Type</Label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as ActionType)}
                className="w-full rounded-xl border-2 border-border-primary bg-white px-4 py-3 text-base focus-visible:border-content-primary focus-visible:outline-none transition-colors"
              >
                <option value="one-time-payment">One-time transfer</option>
                <option value="streaming-payment">Streaming payment</option>
                <option value="custom-transaction">Custom transaction</option>
                <option value="treasury-noun-transfer">Treasury Noun transfer</option>
                {fundingAvailable && <option value="payer-top-up">Payer top-up (USDC funding)</option>}
              </select>
            </div>

          {/* One-time Payment Form */}
          {actionType === 'one-time-payment' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="flex gap-2">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="flex-1"
                  />
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="rounded-xl border-2 border-border-primary bg-white px-4 py-3 text-base focus-visible:border-content-primary focus-visible:outline-none transition-colors"
                  >
                    <option value="eth">ETH</option>
                    <option value="weth">WETH</option>
                    <option value="usdc">USDC</option>
                    <option value="steth">stETH</option>
                    <option value="reth">rETH</option>
                    <option value="oeth">OETH</option>
                  </select>
                </div>
                {formData.amount && (
                  <div className="text-xs text-gray-500">
                    {formatUsdConversion(formData.amount, formData.currency, prices)}
                  </div>
                )}
              </div>
              {formData.currency === 'usdc' && fundingAvailable && (
                <PayerNote
                  status={payerStatus}
                  loading={loadingPayer}
                  error={payerError}
                  requested={pendingUsdc + thisActionUsdc}
                  plan={plan}
                />
              )}
              <div className="space-y-2">
                <Label htmlFor="target">Receiver account</Label>
                <Input
                  id="target"
                  placeholder="0x..., vitalik.eth"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                />
                <p className="text-xs text-gray-500">Specify an Ethereum account address or ENS name</p>
              </div>
            </>
          )}

          {/* Streaming Payment Form */}
          {actionType === 'streaming-payment' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="amount-stream">Amount</Label>
                <div className="flex gap-2">
                  <Input
                    id="amount-stream"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="flex-1"
                  />
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="rounded-xl border-2 border-border-primary bg-white px-4 py-3 text-base focus-visible:border-content-primary focus-visible:outline-none transition-colors"
                  >
                    <option value="weth">WETH</option>
                    <option value="usdc">USDC</option>
                    <option value="steth">stETH</option>
                    <option value="reth">rETH</option>
                    <option value="oeth">OETH</option>
                  </select>
                </div>
                {formData.amount && (
                  <div className="text-xs text-gray-500">
                    {formatUsdConversion(formData.amount, formData.currency, prices)}
                  </div>
                )}
              </div>
              {formData.currency === 'usdc' && fundingAvailable && (
                <PayerNote
                  status={payerStatus}
                  loading={loadingPayer}
                  error={payerError}
                  requested={pendingUsdc + thisActionUsdc}
                  plan={plan}
                />
              )}
              <div className="space-y-2">
                <Label htmlFor="target-stream">Receiver account</Label>
                <Input
                  id="target-stream"
                  placeholder="0x..., vitalik.eth"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Start Date</Label>
                  <Input
                    id="start"
                    type="date"
                    value={new Date(formData.startTimestamp).toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, startTimestamp: new Date(e.target.value).getTime() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">End Date</Label>
                  <Input
                    id="end"
                    type="date"
                    value={new Date(formData.endTimestamp).toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, endTimestamp: new Date(e.target.value).getTime() })}
                  />
                </div>
              </div>
            </>
          )}

          {/* Custom Transaction Form */}
          {actionType === 'custom-transaction' && (
            <>
              {/* JSON Import Toggle */}
              <div className="border-b pb-4">
                <button
                  type="button"
                  onClick={() => setShowJsonImport(!showJsonImport)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <FileJson className="w-4 h-4" />
                  {showJsonImport ? 'Hide JSON Import' : 'Import from JSON'}
                </button>
              </div>

              {/* JSON Import Section */}
              {showJsonImport && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <Label className="mb-1">Paste Action JSON</Label>
                    <p className="text-xs text-gray-600 mt-1">
                      Paste a single action or an array of actions. Multiple actions will be added to your proposal automatically.
                    </p>
                  </div>

                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='{"type":"custom-transaction","contractCallTarget":"0x...","contractCallSignature":"transfer(address,uint256)","contractCallArguments":["0x...","1000000"],"contractCallValue":"0"}'
                    className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-xs resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />

                  {jsonErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            {jsonErrors.map((error, index) => (
                              <li key={index} className="text-red-700">
                                {error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Example Format */}
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
                      View JSON format examples
                    </summary>
                    <div className="mt-2 p-3 bg-white border border-gray-200 rounded space-y-3">
                      <div>
                        <p className="text-gray-700 mb-2 font-medium">Supported action types:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 text-[11px]">
                          <li><code className="bg-gray-100 px-1 rounded">one-time-payment</code> - Transfer ETH or tokens</li>
                          <li><code className="bg-gray-100 px-1 rounded">streaming-payment</code> - Stream tokens over time</li>
                          <li><code className="bg-gray-100 px-1 rounded">custom-transaction</code> - Call any contract function</li>
                          <li><code className="bg-gray-100 px-1 rounded">treasury-noun-transfer</code> - Transfer Noun from treasury</li>
                          <li><code className="bg-gray-100 px-1 rounded">payer-top-up</code> - Top up payer contract</li>
                        </ul>
                      </div>

                      <div>
                        <p className="text-gray-700 mb-1 font-medium">Single action example:</p>
                        <pre className="bg-gray-50 p-2 rounded overflow-x-auto text-[10px] leading-tight">
{`{
  "type": "one-time-payment",
  "target": "0x1234...5678",
  "amount": "1.5",
  "currency": "eth"
}`}
                        </pre>
                      </div>

                      <div>
                        <p className="text-gray-700 mb-1 font-medium">Multiple actions example:</p>
                        <pre className="bg-gray-50 p-2 rounded overflow-x-auto text-[10px] leading-tight">
{`[
  {
    "type": "one-time-payment",
    "target": "0x1234...5678",
    "amount": "1.5",
    "currency": "eth"
  },
  {
    "type": "custom-transaction",
    "contractCallTarget": "0xabcd...ef01",
    "contractCallSignature": "transfer(address,uint256)",
    "contractCallArguments": ["0x...", "1000000"],
    "contractCallValue": "0"
  }
]`}
                        </pre>
                      </div>
                    </div>
                  </details>

                  <Button
                    type="button"
                    onClick={handleJsonImport}
                    disabled={!jsonInput.trim()}
                    className={cn(
                      "w-full",
                      !jsonInput.trim()
                        ? "bg-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-300"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    )}
                  >
                    Import Actions
                  </Button>
                </div>
              )}

              {/* Manual Form Fields */}
              <div className="space-y-2">
                <Label htmlFor="contractTarget">Contract Address</Label>
                <Input
                  id="contractTarget"
                  placeholder="0x..."
                  value={formData.contractCallTarget}
                  onChange={(e) => setFormData({ ...formData, contractCallTarget: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signature">Function Signature</Label>
                <Input
                  id="signature"
                  placeholder="transfer(address,uint256)"
                  value={formData.contractCallSignature}
                  onChange={(e) => setFormData({ ...formData, contractCallSignature: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arguments">Arguments (JSON Array)</Label>
                <Input
                  id="arguments"
                  placeholder='["0x...", "1000000000000000000"]'
                  value={formData.contractCallArguments}
                  onChange={(e) => setFormData({ ...formData, contractCallArguments: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">ETH Value (wei)</Label>
                <Input
                  id="value"
                  placeholder="0"
                  value={formData.contractCallValue}
                  onChange={(e) => setFormData({ ...formData, contractCallValue: e.target.value })}
                />
              </div>
            </>
          )}

          {/* Payer Top-up Form */}
          {actionType === 'payer-top-up' && (
            <>
              <p className="text-sm text-content-secondary">
                The Payer pays every USDC grant. When it runs low, the TokenBuyer sells ETH or stETH to bots for
                USDC that goes straight to the Payer. This sends the TokenBuyer what it needs to do that.
              </p>
              <div className="space-y-2">
                <Label htmlFor="amount-topup">Amount</Label>
                <div className="flex gap-2">
                  <Input
                    id="amount-topup"
                    type="number"
                    step="0.0001"
                    placeholder="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="flex-1"
                  />
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="rounded-xl border-2 border-border-primary bg-white px-4 py-3 text-base focus-visible:border-content-primary focus-visible:outline-none transition-colors"
                  >
                    <option value="steth">stETH</option>
                    <option value="eth">ETH</option>
                  </select>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!payerStatus}
                    title="Refill the Payer to its target, plus this proposal's USDC"
                    onClick={() => {
                      if (!payerStatus) return
                      const needed = formData.currency === 'eth' ? payerStatus.ethToFill : payerStatus.stethToFill
                      if (needed === null) return
                      setFormData({ ...formData, amount: roundUpEther(needed) })
                    }}
                  >
                    Fill
                  </Button>
                </div>
                {formData.amount && (
                  <div className="text-xs text-gray-500">
                    {formatUsdConversion(formData.amount, formData.currency, prices)}
                  </div>
                )}
              </div>
              <TopUpStatus
                status={payerStatus}
                loading={loadingPayer}
                pendingUsdc={pendingUsdc}
                currency={formData.currency === 'eth' ? 'eth' : 'steth'}
                amount={formData.amount}
              />
            </>
          )}

          {/* Treasury Noun Transfer Form */}
          {actionType === 'treasury-noun-transfer' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="nounId">Noun ID</Label>
                <Input
                  id="nounId"
                  type="number"
                  placeholder="123"
                  value={formData.nounId}
                  onChange={(e) => setFormData({ ...formData, nounId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Recipient Address</Label>
                <Input
                  id="target"
                  placeholder="0x..."
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                />
              </div>
            </>
          )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center mt-6">
              {/* Delete button - only show when editing */}
              {action && onDelete && (
                <Button 
                  variant="negative" 
                  onClick={() => {
                    onDelete()
                    onClose()
                  }}
                  className="text-sm"
                >
                  Delete
                </Button>
              )}
              
              {/* Action buttons */}
              <div className="flex gap-3 ml-auto">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!isValid()}>
                  {action ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          </div>
        </DrawerDialogContentInner>
      </DrawerDialogContent>
    </DrawerDialog>
  )
}

const symbolOf = (currency: 'eth' | 'steth') => (currency === 'eth' ? 'ETH' : 'stETH')

/** Whether the Payer can pay a USDC request now, or will register it as a debt, and the top-up that funds it. */
function PayerNote({
  status,
  loading,
  error,
  requested,
  plan,
}: {
  status?: PayerStatus
  loading: boolean
  error?: boolean
  requested: bigint
  plan?: TopUpPlan
}) {
  if (error && !status) {
    return (
      <p className="text-xs text-semantic-negative">
        Couldn&apos;t check the Payer, so this USDC ask can&apos;t be added yet. Close and try again.
      </p>
    )
  }
  if (loading || !status) {
    return <p className="text-xs text-content-secondary">Checking the Payer…</p>
  }
  const short = status.askShortfall
  const treasuryHas = (currency: 'eth' | 'steth') => (currency === 'eth' ? status.treasuryEth : status.treasurySteth)
  return (
    <div
      className={cn(
        'rounded-lg border p-3 text-xs',
        short > 0n ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-gray-200 bg-gray-50 text-content-secondary',
      )}
    >
      USDC is paid by the Payer, which holds <b>{fmt(status.payerUsdc, 6, 2)} USDC</b>
      {status.payerDebt > 0n && <> and already owes {fmt(status.payerDebt, 6, 2)}</>}.{' '}
      {short > 0n ? (
        <>
          This proposal asks for {fmt(requested, 6, 2)} USDC, so {fmt(short, 6, 2)} will be registered as a debt and
          paid, in order, once the Payer is topped up.{' '}
          {plan?.kind === 'add' ? (
            plan.previous ? (
              <>
                The proposal&apos;s Payer top-up will be raised from {plan.previous.amount} to{' '}
                <b>
                  {plan.topUp.amount} {symbolOf(plan.topUp.currency)}
                </b>{' '}
                to fund it.
              </>
            ) : (
              <>
                A Payer top-up of{' '}
                <b>
                  {plan.topUp.amount} {symbolOf(plan.topUp.currency)}
                </b>{' '}
                will be added to fund it.
              </>
            )
          ) : plan?.kind === 'unpriced' ? (
            <b className="text-semantic-negative">
              The TokenBuyer&apos;s price feeds can&apos;t be read right now, so the top-up that funds it can&apos;t be
              sized. Add a Payer top-up yourself, or try again shortly.
            </b>
          ) : status.tokenBuyerSpareUsdc >= short ? (
            <>The TokenBuyer already holds enough ETH and stETH to pay it off.</>
          ) : (
            <>The proposal&apos;s Payer top-ups already cover it.</>
          )}
          {plan?.kind === 'add' &&
            treasuryHas(plan.topUp.currency) < parseEther(plan.topUp.amount) && (
              <b className="text-semantic-negative">
                {' '}
                The treasury only holds {fmt(treasuryHas(plan.topUp.currency), 18)} {symbolOf(plan.topUp.currency)}.
              </b>
            )}
        </>
      ) : (
        <>It can pay the {fmt(requested, 6, 2)} USDC this proposal asks for right away.</>
      )}
    </div>
  )
}

/** The Payer's position and the TokenBuyer's, for sizing a top-up. */
function TopUpStatus({
  status,
  loading,
  pendingUsdc,
  currency,
  amount,
}: {
  status?: PayerStatus
  loading: boolean
  pendingUsdc: bigint
  currency: 'eth' | 'steth'
  amount: string
}) {
  if (loading || !status) {
    return <p className="text-xs text-content-secondary">Checking the Payer and TokenBuyer…</p>
  }
  const symbol = symbolOf(currency)
  const fill = currency === 'eth' ? status.ethToFill : status.stethToFill
  const cover = currency === 'eth' ? status.ethToCoverAsk : status.stethToCoverAsk
  const treasuryHas = currency === 'eth' ? status.treasuryEth : status.treasurySteth
  const requested = parseFloat(amount) || 0
  const overTreasury = requested > Number(formatUnits(treasuryHas, 18))
  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-content-secondary">
      <div>
        Payer: <b>{fmt(status.payerUsdc, 6, 2)} USDC</b> held, {fmt(status.payerDebt, 6, 2)} owed, target{' '}
        {fmt(status.baseline, 6, 0)} on top of debts.
      </div>
      <div>
        TokenBuyer: holds {fmt(status.tokenBuyerEth, 18)} ETH and {fmt(status.tokenBuyerSteth, 18)} stETH, and wants{' '}
        <b>{fmt(status.usdcNeeded, 6, 2)} USDC</b> more
        {pendingUsdc > 0n && <>, plus {fmt(pendingUsdc, 6, 2)} for this proposal&apos;s USDC</>}.
        {status.tokenBuyerPaused && <b className="text-semantic-negative"> It&apos;s paused, so it won&apos;t sell until unpaused.</b>}
      </div>
      {(fill === null || cover === null) && (
        <div className="text-semantic-negative">
          The TokenBuyer can&apos;t read the {symbol} price right now, so {symbol} amounts can&apos;t be sized. Try the
          other asset, or again shortly.
        </div>
      )}
      {pendingUsdc > 0n && cover !== null && (
        <div>
          This proposal&apos;s USDC leaves {fmt(status.askShortfall, 6, 2)} USDC as debt, which takes{' '}
          {cover > 0n ? (
            <b>
              {roundUpEther(cover)} {symbol}
            </b>
          ) : (
            <>nothing more — the TokenBuyer already holds enough</>
          )}{' '}
          to pay off.
        </div>
      )}
      {fill !== null && (
        <div>
          <b>Fill</b> refills the Payer to its target as well:{' '}
          {fill > 0n ? (
            <b>
              {roundUpEther(fill)} {symbol}
            </b>
          ) : (
            <>nothing — the TokenBuyer already has enough</>
          )}
          , with a 5% buffer for price moves. Skip it if another proposal is already funding the TokenBuyer.
        </div>
      )}
      {overTreasury && (
        <div className="text-semantic-negative">
          The treasury only holds {fmt(treasuryHas, 18)} {symbol}.
        </div>
      )}
    </div>
  )
}

export default ActionDialog
