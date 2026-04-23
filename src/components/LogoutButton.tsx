'use client'

import { useRouter } from 'next/navigation'
import React from 'react'

interface Props {
  slug: string
  className?: string
}

export function LogoutButton({ slug, className }: Props) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
    router.push(`/${slug}/login`)
  }

  return (
    <button type="button" onClick={handleLogout} className={className}>
      Αποσύνδεση
    </button>
  )
}
