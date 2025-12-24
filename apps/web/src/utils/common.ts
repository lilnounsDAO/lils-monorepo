/**
 * Common utility functions
 * Replacement for @shades/common/utils
 */

// Array utilities
export const arrayUtils = {
  unique: <T>(arr: T[]): T[] => [...new Set(arr)],

  groupBy: <T>(arr: T[], keyFn: (item: T) => string | number): Record<string, T[]> => {
    return arr.reduce((acc, item) => {
      const key = String(keyFn(item))
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {} as Record<string, T[]>)
  },

  sortBy: <T>(arr: T[], keyFn: (item: T) => any, order: 'asc' | 'desc' = 'asc'): T[] => {
    return [...arr].sort((a, b) => {
      const aVal = keyFn(a)
      const bVal = keyFn(b)
      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
      return 0
    })
  }
}

// Object utilities
export const objectUtils = {
  omitKey: <T extends Record<string, any>>(key: string, obj: T): Omit<T, typeof key> => {
    const { [key]: _, ...rest } = obj
    return rest as Omit<T, typeof key>
  },

  mapValues: <T, U>(fn: (value: T, key: string) => U, obj: Record<string, T>): Record<string, U> => {
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = fn(obj[key], key)
      return acc
    }, {} as Record<string, U>)
  },

  traverse: (obj: any, fn: (val: any) => any): any => {
    if (obj === null || obj === undefined) return obj

    if (Array.isArray(obj)) {
      return obj.map(item => objectUtils.traverse(item, fn))
    }

    if (typeof obj === 'object') {
      const result: any = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          result[key] = objectUtils.traverse(obj[key], fn)
        }
      }
      return result
    }

    return fn(obj)
  },

  pick: <T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    return keys.reduce((acc, key) => {
      if (key in obj) {
        acc[key] = obj[key]
      }
      return acc
    }, {} as Pick<T, K>)
  }
}

// Function utilities
export const functionUtils = {
  pipe: <T>(...fns: Array<(arg: T) => T>) => (value: T): T => {
    return fns.reduce((acc, fn) => fn(acc), value)
  },

  compose: <T>(...fns: Array<(arg: T) => T>) => (value: T): T => {
    return fns.reduceRight((acc, fn) => fn(acc), value)
  },

  retryAsync: async <T>(
    fn: () => Promise<T>,
    options: { retries: number; delay?: number } = { retries: 3 }
  ): Promise<T> => {
    let lastError: Error

    for (let i = 0; i <= options.retries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        if (i < options.retries) {
          const delay = options.delay ?? Math.min(1000 * Math.pow(2, i), 10000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError!
  },

  debounce: <T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn(...args), delay)
    }
  },

  throttle: <T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastCall = 0
    return (...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        fn(...args)
      }
    }
  }
}

// Ethereum utilities
export const ethereumUtils = {
  isAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  },

  truncateAddress: (address: string, start = 6, end = 4): string => {
    if (!address) return ''
    if (address.length <= start + end) return address
    return `${address.slice(0, start)}...${address.slice(-end)}`
  },

  compareAddresses: (a: string, b: string): boolean => {
    return a?.toLowerCase() === b?.toLowerCase()
  }
}

// String utilities
export const stringUtils = {
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  },

  slugify: (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  },

  truncate: (str: string, length: number, suffix = '...'): string => {
    if (str.length <= length) return str
    return str.slice(0, length - suffix.length) + suffix
  }
}
