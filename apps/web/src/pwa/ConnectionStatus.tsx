import { useSyncExternalStore } from 'react'

function subscribe(listener: () => void) {
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)
  return () => {
    window.removeEventListener('online', listener)
    window.removeEventListener('offline', listener)
  }
}

export default function ConnectionStatus() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
  return (
    <div role="status">
      {!online && (
        <p className="border-b bg-background-secondary px-4 py-2 text-center text-xs font-bold text-content-primary md:text-sm">
          You’re offline. Live governance and wallet actions require a connection.
        </p>
      )}
    </div>
  )
}
