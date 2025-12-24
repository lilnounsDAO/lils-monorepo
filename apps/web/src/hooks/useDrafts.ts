/**
 * Drafts Hook
 * Local storage-based draft management
 */

import { useState, useCallback, useEffect } from 'react'
import { useAccount } from 'wagmi'
import type { Draft, DraftStore } from '@/types/proposal-editor'
import { messageUtils } from '@/utils/message-utils'
import { objectUtils } from '@/utils/common'

const SCHEMA_VERSION = 1

/**
 * Create localStorage key for a wallet address
 */
const createCacheKey = (address?: string): string | null => {
  if (!address) return null
  return `${address.toLowerCase()}-proposal-drafts`
}

/**
 * Create an empty draft item
 */
const createEmptyItem = (): Draft => ({
  id: String(Date.now()),
  name: '',
  body: [messageUtils.createEmptyParagraphElement()],
  actions: [],
  createdAt: Date.now(),
  updatedAt: Date.now()
})

/**
 * Load drafts from localStorage
 */
const loadDrafts = (address?: string): DraftStore => {
  const key = createCacheKey(address)
  if (!key) {
    return { schema: SCHEMA_VERSION, entriesById: {} }
  }

  try {
    const stored = localStorage.getItem(key)
    if (!stored) {
      return { schema: SCHEMA_VERSION, entriesById: {} }
    }

    const parsed = JSON.parse(stored) as DraftStore
    return parsed
  } catch (error) {
    console.error('Failed to load drafts:', error)
    return { schema: SCHEMA_VERSION, entriesById: {} }
  }
}

/**
 * Save drafts to localStorage
 */
const saveDrafts = (address: string | undefined, store: DraftStore): void => {
  const key = createCacheKey(address)
  if (!key) return

  try {
    localStorage.setItem(key, JSON.stringify(store))
  } catch (error) {
    console.error('Failed to save drafts:', error)
  }
}

/**
 * Hook to manage all drafts for the connected wallet
 */
export const useCollection = () => {
  const { address } = useAccount()
  const [store, setStore] = useState<DraftStore>(() => loadDrafts(address))

  // Load drafts when address changes
  useEffect(() => {
    setStore(loadDrafts(address))
  }, [address])

  // Save to localStorage whenever store changes
  useEffect(() => {
    if (address) {
      saveDrafts(address, store)
    }
  }, [address, store])

  const items = Object.values(store.entriesById)

  const createItem = useCallback(
    (values?: Partial<Draft>): Draft => {
      console.log('createItem called with address:', address, 'values:', values)
      const item: Draft = { ...createEmptyItem(), ...values }
      const newStore = {
        ...store,
        entriesById: {
          ...store.entriesById,
          [item.id]: item
        }
      }
      console.log('createItem: setting store with new draft:', item.id)
      setStore(newStore)
      // Immediately save to localStorage so useSingleItem can pick it up
      if (address) {
        console.log('createItem: saving to localStorage for', address)
        saveDrafts(address, newStore)
      } else {
        console.warn('createItem: NO ADDRESS - draft will not be saved to localStorage!')
      }
      console.log('createItem: returning draft:', item)
      return item
    },
    [address, store]
  )

  const deleteItem = useCallback((id: string) => {
    setStore((prev) => ({
      ...prev,
      entriesById: objectUtils.omitKey(id, prev.entriesById)
    }))
  }, [])

  return { items, createItem, deleteItem }
}

/**
 * Hook to manage a single draft
 */
export const useSingleItem = (id: string | null | undefined) => {
  const { address } = useAccount()
  const [store, setStore] = useState<DraftStore>(() => {
    console.log('useSingleItem initial load for address:', address)
    const drafts = loadDrafts(address)
    console.log('Loaded drafts:', drafts)
    return drafts
  })

  // Load drafts when address changes OR when id changes
  useEffect(() => {
    console.log('useSingleItem: address or id changed', { address, id })
    const drafts = loadDrafts(address)
    console.log('Loaded drafts:', drafts)
    setStore(drafts)
  }, [address, id])

  // Save to localStorage whenever store changes
  useEffect(() => {
    if (address) {
      console.log('Saving drafts to localStorage for', address, store)
      saveDrafts(address, store)
    }
  }, [address, store])

  const item = id ? store.entriesById[id] ?? null : null
  console.log('useSingleItem looking for id:', id, 'found:', item, 'available drafts:', Object.keys(store.entriesById))

  const updateItem = useCallback(
    (updates: Partial<Draft>) => {
      if (!id) return

      setStore((prev) => {
        const currentItem = prev.entriesById[id]
        if (!currentItem) return prev

        return {
          ...prev,
          entriesById: {
            ...prev.entriesById,
            [id]: {
              ...currentItem,
              ...updates,
              updatedAt: Date.now()
            }
          }
        }
      })
    },
    [id]
  )

  const setName = useCallback(
    (name: string) => {
      updateItem({ name })
    },
    [updateItem]
  )

  const setBody = useCallback(
    (body: Draft['body']) => {
      updateItem({ body })
    },
    [updateItem]
  )

  const setActions = useCallback(
    (actions: Draft['actions'] | ((prev: Draft['actions']) => Draft['actions'])) => {
      if (!id) return

      setStore((prev) => {
        const currentItem = prev.entriesById[id]
        if (!currentItem) return prev

        const newActions = typeof actions === 'function' ? actions(currentItem.actions) : actions

        return {
          ...prev,
          entriesById: {
            ...prev.entriesById,
            [id]: {
              ...currentItem,
              actions: newActions,
              updatedAt: Date.now()
            }
          }
        }
      })
    },
    [id]
  )

  return [
    item,
    {
      setName,
      setBody,
      setActions
    }
  ] as const
}
