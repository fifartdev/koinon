import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import React from 'react'

interface Props {
  children: React.ReactNode
  params: Promise<{ 'club-slug': string }>
}

export default async function ClubLayout({ children, params }: Props) {
  const { 'club-slug': slug } = await params

  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: slug }, isActive: { equals: true } },
    limit: 1,
    depth: 0,
  })

  if (!docs.length) notFound()

  return <>{children}</>
}
