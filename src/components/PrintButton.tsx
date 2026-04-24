'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-indigo-700 transition"
    >
      Εκτύπωση / Αποθήκευση PDF
    </button>
  )
}
