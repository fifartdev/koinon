'use client'

import { useRouter } from 'next/navigation'

interface Props { className?: string }

export function SuperadminLogoutButton({ className }: Props) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
    router.push('/superadmin/login')
  }

  return (
    <button type="button" onClick={handleLogout} className={className}>
      Αποσύνδεση
    </button>
  )
}
