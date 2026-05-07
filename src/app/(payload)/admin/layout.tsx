import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import React from 'react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  // Only master may access the Payload admin panel
  if (user && (user as { role?: string }).role !== 'master') {
    const role = (user as { role?: string }).role
    redirect(role === 'superadmin' ? '/superadmin' : '/')
  }

  return <>{children}</>
}
