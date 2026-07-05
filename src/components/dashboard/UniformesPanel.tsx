'use client'

import Image from 'next/image'
import {
  Phone, MessageCircle, ShieldCheck, Star,
  AlertCircle, CheckCircle2, Shirt,
} from 'lucide-react'
import Accordion from '@/components/ui/Accordion'
import ChaquetaConfirmacion from '@/components/dashboard/ChaquetaConfirmacion'

// ── Types ──────────────────────────────────────────────────────────
interface UniformItem {
  name: string
  source: 'corporacion' | 'integrante' | 'contacto'
  contact?: { name: string; phone: string }
  note?: string
}

// ── Data ───────────────────────────────────────────────────────────
const UNIFORM_ITEMS: UniformItem[] = [
  { name: 'Chaqueta Negra y Chaqueta Negra con Azul',  source: 'corporacion' },
  { name: 'Quepis',                                     source: 'corporacion' },
  { name: 'Faldón',                                     source: 'corporacion' },
  {
    name: 'Pantalón Overol Negro y Blanco',
    source: 'contacto',
    contact: { name: 'Esneider Maldonado', phone: '3164477395' },
    note:  'Contactar para fabricación a medida',
  },
  {
    name: 'Zapatos Negros',
    source: 'contacto',
    contact: { name: 'Calzado Ángel', phone: '3242363591' },
    note: 'Proveedor oficial de la corporación',
  },
  { name: 'Puños Negros',    source: 'contacto', contact: { name: 'Corporación Guardia Real', phone: '3197735052' }, note: 'Adquiridos a través de directivas de la corporación' },
  { name: 'Guantes Blancos', source: 'contacto', contact: { name: 'Corporación Guardia Real', phone: '3197735052' }, note: 'Adquiridos a través de directivas de la corporación' },
  { name: 'Pluma Blanca',        source: 'integrante', note: '2 plumas por quepis — adquiridas por el integrante' },
  { name: 'Camiseta Interior Blanca', source: 'integrante', note: 'Sin estampado, impresión ni color adicional' },
  { name: 'Ropa Interior y Medias',   source: 'integrante', note: 'Blancas y negras según el uniforme del día' },
]

function WhatsAppBtn({ phone, name }: { phone: string; name: string }) {
  const msg = encodeURIComponent(`Hola ${name}, soy integrante de la Guardia Real de Antioquia. Quisiera información sobre los uniformes.`)
  return (
    <a
      href={`https://wa.me/57${phone}?text=${msg}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors"
      style={{ backgroundColor: '#22c55e' }}
    >
      <MessageCircle size={13} />
      WhatsApp
    </a>
  )
}

function CallBtn({ phone }: { phone: string }) {
  return (
    <a
      href={`tel:+57${phone}`}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy hover:bg-royal text-white text-xs font-semibold transition-colors"
    >
      <Phone size={13} />
      Llamar
    </a>
  )
}

function SourceBadge({ source }: { source: UniformItem['source'] }) {
  if (source === 'corporacion') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 rounded-full px-2 py-0.5">
      <ShieldCheck size={10} /> Corporación
    </span>
  )
  if (source === 'integrante') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
      <Star size={10} /> Integrante
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 rounded-full px-2 py-0.5">
      <Phone size={10} /> Proveedor
    </span>
  )
}

// ── Panel ─────────────────────────────────────────────────────────
export default function UniformesPanel() {
  const items = [
    {
      id:    'lista',
      title: 'Lista de Prendas y Contactos',
      badge: '👕',
      content: (
        <div className="space-y-3">
          {/* Uniform photos */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-gray-100">
              <Image
                src="/images/Uniformes/uniforme-viento-masculino.jpeg"
                alt="Uniforme — Sección de Vientos (masculino)"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-navy/80 to-transparent p-3">
                <p className="text-white text-xs font-semibold">Sección de Vientos</p>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-gray-100">
              <Image
                src="/images/Uniformes/uniforme-viento-femenino.jpeg"
                alt="Uniforme — Sección de Vientos (femenino)"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-navy/80 to-transparent p-3">
                <p className="text-white text-xs font-semibold">Sección de Vientos</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-3 flex items-center gap-1.5 flex-wrap">
            <ShieldCheck size={12} className="text-blue-600" /> <strong>Corporación</strong>: suministrado por la banda ·
            <Star size={12} className="text-amber-600" /> <strong>Integrante</strong>: adquirido por el integrante ·
            <Phone size={12} className="text-green-600" /> <strong>Proveedor</strong>: contactar directamente
          </div>

          {UNIFORM_ITEMS.map((item, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-semibold text-dark">{item.name}</p>
                  <SourceBadge source={item.source} />
                </div>
                {item.note && (
                  <p className="text-xs text-gray-500">{item.note}</p>
                )}
                {item.contact && (
                  <p className="text-xs text-gray-600 font-medium mt-0.5">{item.contact.name}</p>
                )}
              </div>
              {item.contact && (
                <div className="flex gap-2 shrink-0">
                  <WhatsAppBtn phone={item.contact.phone} name={item.contact.name} />
                  <CallBtn phone={item.contact.phone} />
                </div>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      id:    'responsabilidad',
      title: 'Responsabilidad sobre el Uniforme',
      badge: '🛡️',
      content: (
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>
            La corporación suministrará las <strong>chaquetas y los quepis</strong>. Es responsabilidad exclusiva
            de cada integrante la adquisición de los demás elementos del uniforme, tales como: pantalón, zapatos,
            plumas, guantes y puños, así como los elementos de uso personal como medias y ropa interior.
          </p>
          <div className="space-y-2">
            {[
              'Cada uniforme deberá portarse con camiseta interior completamente blanca, sin ningún tipo de estampado, impresión o color adicional.',
              'La ropa interior deberá estar acorde con el color del pantalón del uniforme. No se permite el uso de pantalonetas, shorts o leggins visibles.',
              'Ejemplo: si el pantalón del uniforme es blanco, la ropa interior deberá ser completamente blanca.',
              'No se permite el uso de medias tobilleras, taloneras ni medias deportivas. Las medias deberán ser formales, completamente lisas y sin estampados.',
            ].map((text, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <CheckCircle2 size={15} className="text-royal shrink-0 mt-0.5" />
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id:    'accesorios',
      title: 'Accesorios y Presentación Personal',
      badge: '⭐',
      content: (
        <div className="space-y-5 text-sm text-gray-700">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="font-semibold text-red-800 mb-1 flex items-center gap-1.5">
              <AlertCircle size={15} /> Prohibido
            </p>
            <p className="text-red-700">
              Por ningún motivo se permitirá el uso de: piercings, expansores, topitos, aretas no autorizadas,
              manillas, cadenas o cualquier accesorio que altere la uniformidad de la banda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-bold text-navy mb-2">Presentación — Niños</p>
              <ul className="space-y-1.5">
                {[
                  'Corte de cabello corto o bajo.',
                  'En caso de cabello largo: recogido o trenzado.',
                  'Barba y bigote afeitados o debidamente perfilados.',
                  'Uñas cortas y aseadas.',
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <CheckCircle2 size={13} className="text-navy shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-navy mb-2">Presentación — Niñas</p>
              <ul className="space-y-1.5">
                {[
                  'Aretas de perla blanca obligatorias.',
                  'Maquillaje asignado por la dirección.',
                  'Uñas transparentes con delineado blanco.',
                  'Cabello limpio y completamente recogido.',
                  'Contar con dona, ganchos y gel para el peinado.',
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <CheckCircle2 size={13} className="text-navy shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id:    'estado',
      title: 'Estado del Uniforme',
      badge: '✅',
      content: (
        <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
          {[
            'La chaqueta y el pantalón deberán estar completamente limpios y debidamente planchados para cada presentación.',
            'Las chaquetas deben plancharse colocando previamente un trapo o tela encima, ya que el material es sublimado y podría sufrir daños al exponerse directamente al calor de la plancha.',
            'Se solicita a todos los integrantes procurar el adecuado cuidado y buen uso de los uniformes.',
          ].map((text, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <CheckCircle2 size={15} className="text-royal shrink-0 mt-0.5" />
              <p>{text}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id:    'entrega',
      title: 'Entrega y Cuidado de los Elementos',
      badge: '⚠️',
      content: (
        <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
          <div className="bg-navy/5 rounded-lg p-4 border border-navy/10">
            <p className="font-semibold text-navy mb-1">Entrega de chaquetas</p>
            <p>
              La corporación entregará con anticipación las chaquetas correspondientes para cada presentación
              o para los días establecidos.
            </p>
          </div>
          <div className="flex gap-2.5 items-start">
            <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p>
              Cada integrante será el único responsable del cuidado, protección y correcta conservación
              de los elementos entregados. Cualquier daño o pérdida deberá ser reportado inmediatamente a la dirección.
            </p>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-navy text-xl font-bold uppercase tracking-wider flex items-center gap-2">
          <Shirt size={20} className="text-royal" />
          Uniformes
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Guía de uniformes, proveedores y normas de presentación — personal de la banda
        </p>
      </div>

      {/* Solicitud de confirmación de chaqueta (solo si la administración la pidió) */}
      <ChaquetaConfirmacion />

      <Accordion items={items} singleOpen defaultOpenIds={['lista']} />

      <p className="text-xs text-gray-400 text-center mt-8">
        Esta información es exclusiva para el personal de la Corporación Musical Guardia Real de Antioquia.
      </p>
    </div>
  )
}
