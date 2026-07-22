'use client'

// El gestor de repertorio antiguo fue reemplazado por la pestaña Partituras
// de /integrantes (RepertorioPanel), donde admin y director gestionan todo.
// Esta ruta queda como redirección para no romper enlaces ni el aterrizaje.
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DirectorRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/director/events') }, [router])
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
    </div>
  )
}
