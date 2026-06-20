'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function IntegrantesRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/admin?tab=solicitudes') }, [router])
  return null
}
