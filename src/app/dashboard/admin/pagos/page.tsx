'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import PagosPanel from '@/components/dashboard/PagosPanel'

export default function PagosAdminPage() {
  const { profile } = useAuth()
  const router = useRouter()
  useEffect(() => { if (profile && profile.role !== 'admin') router.replace('/dashboard') }, [profile, router])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider flex items-center gap-2"><Wallet size={22} className="text-royal" /> Pagos y mensualidades</h1>
        <p className="text-gray-400 text-sm mt-1">Marca los pagos por mes y por concepto; recordatorios por WhatsApp y exportación</p>
      </div>
      <PagosPanel />
    </div>
  )
}
