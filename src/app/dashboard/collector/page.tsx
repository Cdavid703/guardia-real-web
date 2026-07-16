'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Wallet } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import PagosPanel from '@/components/dashboard/PagosPanel'

export default function CollectorPage() {
  const { profile } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (profile && profile.role !== 'collector' && profile.role !== 'admin') router.replace('/dashboard')
  }, [profile, router])

  return (
    <div>
      {/* Encabezado con marca */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-[#0a2350] p-6 sm:p-7 mb-6">
        <div className="absolute -right-6 -bottom-6 opacity-10"><Image src="/images/escudo.png" alt="" width={150} height={150} /></div>
        <div className="absolute right-4 top-4 opacity-90 hidden sm:block"><Image src="/images/mascota.png" alt="" width={64} height={64} className="drop-shadow-lg" /></div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-gold/15 border border-gold/30 text-gold text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            <Wallet size={12} /> Recaudo
          </div>
          <h1 className="font-display text-white text-2xl font-bold uppercase tracking-wider">Panel del recaudador</h1>
          <p className="text-gray-300 text-sm mt-1 max-w-lg">Registra los pagos de cada integrante por mes y por concepto (mensualidad, uniforme, gira…).</p>
        </div>
      </div>
      <PagosPanel />
    </div>
  )
}
