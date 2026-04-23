import React from 'react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <span className="text-6xl mb-4">📡</span>
      <h1 className="text-2xl font-bold text-slate-800">Δεν υπάρχει σύνδεση</h1>
      <p className="text-slate-500 mt-2">
        Ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.
      </p>
    </div>
  )
}
