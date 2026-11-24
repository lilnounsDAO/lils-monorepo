import { useContext, useState, useSyncExternalStore } from 'react'
import { ToastContext, ToastType } from '@/providers/toast'
import { getInstallMethod, requestInstallation, subscribeToInstall } from './install'

const buttonClass =
  'min-h-11 shrink-0 whitespace-nowrap rounded-md px-2 text-xs font-bold text-content-primary hover:bg-background-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:text-sm'

const dismissalKey = 'lil-nouns:install-instructions-dismissed'

function InstallInstructions({ isIOS }: { isIOS: boolean }) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(dismissalKey) === 'true'
    } catch {
      return false
    }
  })

  if (dismissed) return null

  function dismiss() {
    setDismissed(true)
    try {
      window.localStorage.setItem(dismissalKey, 'true')
    } catch {
      // The prompt still closes when browser storage is unavailable.
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[110] flex justify-end md:inset-x-8 md:bottom-6">
      <aside
        aria-label="Install Lil Nouns"
        className="pointer-events-auto w-full max-w-xs rounded-xl border bg-white px-4 pb-4 pt-2 text-sm text-content-primary shadow-lg"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            dismiss()
          }
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold">Install Lil Nouns</p>
          <button type="button" className={buttonClass} onClick={dismiss}>
            Close
          </button>
        </div>
        <p>
          {isIOS
            ? 'In Safari, open Share, then choose Add to Home Screen. If you see Open as Web App, leave it on, then tap Add.'
            : 'In Safari, open the File menu and choose Add to Dock if the option is available.'}
        </p>
      </aside>
    </div>
  )
}

export function InstallPrompt() {
  const method = useSyncExternalStore(subscribeToInstall, getInstallMethod, () => 'hidden')
  if (method !== 'ios-help' && method !== 'mac-help') return null
  return <InstallInstructions isIOS={method === 'ios-help'} />
}

export default function InstallApp() {
  const method = useSyncExternalStore(subscribeToInstall, getInstallMethod, () => 'hidden')
  const { addToast } = useContext(ToastContext)
  const [installing, setInstalling] = useState(false)
  const [message, setMessage] = useState('')

  async function install() {
    if (installing) return
    setInstalling(true)
    setMessage('')
    try {
      const choice = await requestInstallation()
      if (choice === 'accepted') setMessage('Lil Nouns is ready to open.')
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        const failure = 'Installation could not start. Check your browser menu for installation options.'
        setMessage(failure)
        addToast?.({ type: ToastType.Failure, content: <span aria-hidden="true">{failure}</span> })
      }
    } finally {
      setInstalling(false)
    }
  }

  return (
    <>
      {method === 'native' || installing ? (
        <button type="button" className={buttonClass} aria-disabled={installing} onClick={install}>
          Install app
        </button>
      ) : null}
      <span role="status" className="sr-only">{message}</span>
    </>
  )
}
