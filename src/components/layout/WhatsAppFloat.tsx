'use client'

import { useState } from 'react'
import { MessageCircle, X, Phone } from 'lucide-react'

const CONTACTS = [
  {
    name:    'Dairo Villada',
    role:    'Coordinación general',
    phone:   '573197735052',
    display: '319 773 5052',
  },
  {
    name:    'Sebastián Álvarez',
    role:    'Logística y eventos',
    phone:   '573105094658',
    display: '310 509 4658',
  },
]

const DEFAULT_MESSAGE = 'Hola, me interesa contratar a la Guardia Real de Antioquia. ¿Podrían darme información?'

export default function WhatsAppFloat() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Panel desplegable */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[150] w-80 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <MessageCircle size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Guardia Real de Antioquia</p>
              <p className="text-xs text-white/80">Responde en menos de 24 horas</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white p-1"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Contactos */}
          <div className="p-3 space-y-2 bg-[#ECE5DD]">
            <p className="text-xs text-gray-600 px-2 pb-1">
              Selecciona un contacto:
            </p>

            {CONTACTS.map(c => (
              <div key={c.phone} className="bg-white rounded-xl p-3 shadow-sm">
                <p className="text-sm font-semibold text-dark">{c.name}</p>
                <p className="text-xs text-gray-500 mb-2">{c.role}</p>

                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/${c.phone}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#1ebd5a] rounded-lg text-white text-xs font-semibold transition-colors"
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </a>
                  <a
                    href={`tel:+${c.phone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-navy hover:bg-navy/90 rounded-lg text-white text-xs font-semibold transition-colors"
                  >
                    <Phone size={14} />
                    Llamar
                  </a>
                </div>

                <p className="text-[10px] text-gray-400 text-center mt-2">{c.display}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[150] w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebd5a] shadow-2xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
        aria-label="Contactar por WhatsApp"
      >
        {open ? (
          <X size={26} />
        ) : (
          <>
            <MessageCircle size={28} />
            {/* Pulse animation */}
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
          </>
        )}
      </button>
    </>
  )
}
