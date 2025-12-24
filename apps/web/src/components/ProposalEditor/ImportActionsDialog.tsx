import React, { useState } from 'react'
import {
  DrawerDialog,
  DrawerDialogContent,
  DrawerDialogContentInner,
  DrawerDialogTitle,
} from '@/components/ui/DrawerDialog'
import { Button } from '@/components/ui/button'
import { parseActionsFromJSON, exampleJSON } from '@/utils/action-json-parser'
import type { Action } from '@/types/proposal-editor'
import { AlertCircle, CheckCircle, Upload, FileJson } from 'lucide-react'

interface ImportActionsDialogProps {
  isOpen: boolean
  onClose: () => void
  onImport: (actions: Action[]) => void
}

const ImportActionsDialog: React.FC<ImportActionsDialogProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [jsonInput, setJsonInput] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [showExample, setShowExample] = useState(false)

  const handleImport = () => {
    setErrors([])

    if (!jsonInput.trim()) {
      setErrors(['Please paste JSON data'])
      return
    }

    const result = parseActionsFromJSON(jsonInput)

    if (!result.success || !result.actions) {
      setErrors(result.errors || ['Failed to parse JSON'])
      return
    }

    // Success - import the actions
    onImport(result.actions)
    setJsonInput('')
    setErrors([])
    onClose()
  }

  const handleCancel = () => {
    setJsonInput('')
    setErrors([])
    setShowExample(false)
    onClose()
  }

  const handleLoadExample = () => {
    setJsonInput(exampleJSON)
    setErrors([])
  }

  const handleClearExample = () => {
    setShowExample(false)
  }

  return (
    <DrawerDialog open={isOpen} onOpenChange={handleCancel}>
      <DrawerDialogContent>
        <DrawerDialogContentInner className="max-w-3xl">
          <DrawerDialogTitle className="flex items-center gap-2 mb-2">
            <FileJson className="w-5 h-5" />
            Import Actions from JSON
          </DrawerDialogTitle>
          <p className="text-sm text-gray-600 mb-6">
            Paste JSON data to bulk import transaction actions into your proposal or candidate.
          </p>

          <div className="space-y-4">
          {/* JSON Input Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              JSON Data
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste your JSON here..."
              className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-800 mb-2">
                    Validation Errors
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Example Section */}
          <div className="border border-gray-200 rounded-md">
            <button
              onClick={() => setShowExample(!showExample)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                View Example JSON Format
              </span>
              <span className="text-gray-400">
                {showExample ? '−' : '+'}
              </span>
            </button>

            {showExample && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Supported Action Types
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li><code className="text-xs bg-gray-200 px-1 py-0.5 rounded">one-time-payment</code> - Transfer ETH or ERC20 tokens</li>
                    <li><code className="text-xs bg-gray-200 px-1 py-0.5 rounded">streaming-payment</code> - Create a token stream over time</li>
                    <li><code className="text-xs bg-gray-200 px-1 py-0.5 rounded">custom-transaction</code> - Call any contract function</li>
                    <li><code className="text-xs bg-gray-200 px-1 py-0.5 rounded">treasury-noun-transfer</code> - Transfer a Noun from treasury</li>
                    <li><code className="text-xs bg-gray-200 px-1 py-0.5 rounded">payer-top-up</code> - Top up the payer contract</li>
                  </ul>
                </div>

                <pre className="bg-white border border-gray-200 rounded p-3 overflow-x-auto text-xs font-mono">
                  {exampleJSON}
                </pre>

                <Button
                  onClick={handleLoadExample}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Load This Example
                </Button>
              </div>
            )}
          </div>

          {/* Field Reference */}
          <details className="border border-gray-200 rounded-md">
            <summary className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
              Field Reference
            </summary>
            <div className="border-t border-gray-200 p-4 bg-gray-50 text-sm space-y-3">
              <div>
                <h5 className="font-semibold text-gray-800 mb-1">One-Time Payment</h5>
                <code className="text-xs block bg-white p-2 rounded border">
                  {`{ type: "one-time-payment", target: "0x...", amount: "1.5", currency: "eth"|"weth"|"usdc"|"steth"|"reth"|"oeth" }`}
                </code>
              </div>
              <div>
                <h5 className="font-semibold text-gray-800 mb-1">Streaming Payment</h5>
                <code className="text-xs block bg-white p-2 rounded border">
                  {`{ type: "streaming-payment", target: "0x...", amount: "100", currency: "weth"|"usdc"|"steth"|"reth"|"oeth", startTimestamp: 1234567890, endTimestamp: 1234567890, predictedStreamContractAddress: "0x..." }`}
                </code>
              </div>
              <div>
                <h5 className="font-semibold text-gray-800 mb-1">Custom Transaction</h5>
                <code className="text-xs block bg-white p-2 rounded border">
                  {`{ type: "custom-transaction", contractCallTarget: "0x...", contractCallSignature: "transfer(address,uint256)", contractCallArguments: ["0x...", "1000000"], contractCallValue: "0" }`}
                </code>
              </div>
              <div>
                <h5 className="font-semibold text-gray-800 mb-1">Treasury Noun Transfer</h5>
                <code className="text-xs block bg-white p-2 rounded border">
                  {`{ type: "treasury-noun-transfer", nounId: "42", target: "0x..." }`}
                </code>
              </div>
              <div>
                <h5 className="font-semibold text-gray-800 mb-1">Payer Top-Up</h5>
                <code className="text-xs block bg-white p-2 rounded border">
                  {`{ type: "payer-top-up", amount: "10", currency: "eth"|"steth"|"reth"|"oeth" }`}
                </code>
              </div>
            </div>
          </details>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-4 border-t mt-6">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!jsonInput.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Actions
            </Button>
          </div>
        </DrawerDialogContentInner>
      </DrawerDialogContent>
    </DrawerDialog>
  )
}

export default ImportActionsDialog
