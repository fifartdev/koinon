'use client'

import { useState, useEffect } from 'react'
import React from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPWA() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('pwa-dismissed')) {
      setDismissed(true)
      return
    }
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!prompt || dismissed) return null

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'dismissed') {
      localStorage.setItem('pwa-dismissed', '1')
    }
    setPrompt(null)
  }

  function dismiss() {
    localStorage.setItem('pwa-dismissed', '1')
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 px-5 py-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm">
          Add to Home Screen
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          Install Koinon for quick access
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={dismiss}
          className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
        >
          Later
        </button>
        <button
          onClick={install}
          className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
        >
          Install
        </button>
      </div>
    </div>
  )
}
