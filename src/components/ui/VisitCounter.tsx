'use client'

import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'

export default function VisitCounter() {
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    const key = 'gra_visit_logged'
    const alreadyLogged = sessionStorage.getItem(key)
    const method = alreadyLogged ? 'GET' : 'POST'
    if (!alreadyLogged) sessionStorage.setItem(key, '1')

    fetch('/api/visits', { method })
      .then(r => r.json())
      .then(data => setTotal(typeof data.total === 'number' ? data.total : null))
      .catch(() => {})
  }, [])

  if (total === null) return null

  return (
    <div className="inline-flex items-center gap-1.5 text-gray-400 text-xs">
      <Eye size={13} />
      <span>{total.toLocaleString('es-CO')} visitas</span>
    </div>
  )
}
