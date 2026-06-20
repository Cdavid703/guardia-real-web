'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MapaRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/admin?tab=integrantes') }, [router])
  return null
}
