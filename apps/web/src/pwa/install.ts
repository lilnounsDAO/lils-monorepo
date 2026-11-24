type InstallChoice = 'accepted' | 'dismissed'
type InstallMethod = 'hidden' | 'native' | 'ios-help' | 'mac-help'

interface DeferredInstallPrompt extends Event {
  prompt(): Promise<unknown>
  userChoice: Promise<{ outcome: InstallChoice }>
}

interface InstallNavigator extends Navigator {
  install?: () => Promise<unknown>
  standalone?: boolean
}

const listeners = new Set<() => void>()
let installNavigator: InstallNavigator | undefined
let standalone: MediaQueryList | undefined
let promptEvent: DeferredInstallPrompt | undefined
let installed = false
let appleHelp: InstallMethod = 'hidden'

function notify() {
  for (const listener of listeners) listener()
}

function markInstalled() {
  installed = true
  promptEvent = undefined
  notify()
}

export function startPwa() {
  if (!import.meta.env.PROD || !window.isSecureContext || installNavigator) return

  installNavigator = navigator
  standalone = window.matchMedia('(display-mode: standalone)')
  standalone.addEventListener?.('change', notify)
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (
    navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1
  )) {
    appleHelp = 'ios-help'
  } else if (navigator.userAgent.includes('Macintosh') && navigator.vendor === 'Apple Computer, Inc.') {
    appleHelp = 'mac-help'
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    promptEvent = event as DeferredInstallPrompt
    notify()
  })
  window.addEventListener('appinstalled', markInstalled)

  if ('serviceWorker' in navigator) {
    const register = () => {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch((error) => {
        console.warn('Lil Nouns could not enable offline navigation.', error)
      })
    }
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
  }
}

export function subscribeToInstall(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function getInstallMethod(): InstallMethod {
  if (!installNavigator || installed || standalone?.matches || installNavigator.standalone) return 'hidden'
  if (typeof installNavigator.install === 'function' || promptEvent) return 'native'
  return appleHelp
}

export async function requestInstallation(): Promise<InstallChoice> {
  if (typeof installNavigator?.install === 'function') {
    await installNavigator.install()
    markInstalled()
    return 'accepted'
  }

  // Chromium prompt events may be consumed only once.
  const prompt = promptEvent
  promptEvent = undefined
  notify()
  if (!prompt) return 'dismissed'

  await prompt.prompt()
  const { outcome } = await prompt.userChoice
  if (outcome === 'accepted') markInstalled()
  return outcome
}
