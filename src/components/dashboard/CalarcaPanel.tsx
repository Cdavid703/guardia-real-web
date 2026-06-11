'use client'

import {
  Download, MapPin, Calendar, Heart, ShieldCheck, Users,
  Shirt, Backpack, Building2, UtensilsCrossed, AlertCircle,
  CheckCircle2, Music2, Phone, Mail,
} from 'lucide-react'
import Accordion from '@/components/ui/Accordion'

const SCHEDULE = [
  {
    day: 'Sábado 13 de junio',
    items: [
      { time: '9:00 a.m.',  desc: 'Salida del primer grupo hacia Calarcá' },
      { time: '3:00 p.m.',  desc: 'Llegada del primer grupo' },
      { time: '4:00 p.m.',  desc: 'Salida del segundo grupo hacia Calarcá' },
      { time: '10:00 p.m.', desc: 'Llegada del segundo grupo' },
      { time: '10:30 p.m.', desc: 'Cena del segundo grupo' },
    ],
  },
  {
    day: 'Domingo 14 de junio',
    items: [
      { time: '7:30 a.m.',  desc: 'Inicio de la jornada' },
      { time: '8:00 a.m.',  desc: 'Desayuno' },
      { time: '8:30 a.m.',  desc: 'Alistamiento' },
      { time: '10:30 a.m.', desc: 'Desplazamiento al punto de desfile' },
      { time: '11:30 a.m.', desc: 'Desfile (punto de partida: Jardín Infantil Las Amapolas)' },
      { time: '12:30 p.m.', desc: 'Almuerzo' },
      { time: '4:00 p.m.',  desc: 'Exhibición / concurso (Polideportivo El Cacique)' },
      { time: '5:30 p.m.',  desc: 'Desplazamiento al hotel' },
      { time: '7:00 p.m.',  desc: 'Cena' },
    ],
  },
  {
    day: 'Lunes 15 de junio',
    items: [
      { time: '8:00 a.m.',  desc: 'Desayuno' },
      { time: '9:00 a.m.',  desc: 'Salida a actividad turística (destino por confirmar)' },
      { time: '12:30 p.m.', desc: 'Almuerzo' },
      { time: '2:00 p.m.',  desc: 'Retorno a Medellín' },
    ],
  },
]

const accordionItems = [
  {
    id: 'preparacion',
    badge: '01',
    title: 'Preparación física e hidratación',
    content: (
      <div className="space-y-2">
        <p>
          Desde el <strong>jueves 11 de junio</strong> es importante comenzar la preparación del cuerpo
          para el viaje y las presentaciones:
        </p>
        <ul className="space-y-1.5 mt-2">
          {[
            'Mantener una alimentación balanceada, evitando comidas pesadas o irritantes.',
            'Hidratarse constantemente con agua durante todo el día.',
            'Evitar el consumo de bebidas alcohólicas y exceso de azúcar.',
            'Procurar un buen descanso y dormir las horas necesarias antes del viaje.',
          ].map((t, i) => (
            <li key={i} className="flex gap-2 items-start">
              <CheckCircle2 size={15} className="text-royal shrink-0 mt-0.5" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: 'instrucciones',
    badge: '02',
    title: 'Cumplimiento de instrucciones',
    content: (
      <p>
        Todos los integrantes deberán acatar en todo momento las instrucciones de la
        <strong> Junta Directiva</strong> y del cuerpo de dirección, así como cumplir estrictamente
        el cronograma establecido y los horarios de cada actividad. La puntualidad es
        fundamental para el buen desarrollo del viaje.
      </p>
    ),
  },
  {
    id: 'documento',
    badge: '03',
    title: 'Documento de identidad',
    content: (
      <p>
        Es <strong>obligatorio</strong> portar el documento de identidad físico (Tarjeta de Identidad
        o Cédula de Ciudadanía) durante todo el viaje. Este documento puede ser solicitado
        en cualquier momento por organizadores del evento, transporte o autoridades.
      </p>
    ),
  },
  {
    id: 'convivencia',
    badge: '04',
    title: 'Respeto y convivencia',
    content: (
      <p>
        Se debe mantener una actitud de respeto hacia los espacios, las pertenencias de los
        demás y las instalaciones que se utilicen durante el viaje (transporte, hotel,
        restaurante y lugares de presentación). El buen comportamiento de cada integrante
        representa a toda la corporación.
      </p>
    ),
  },
  {
    id: 'instrumentos',
    badge: '05',
    title: 'Cuidado de instrumentos y elementos institucionales',
    content: (
      <div className="space-y-2">
        <p>
          Cada integrante es responsable del cuidado de los instrumentos, uniformes y
          accesorios institucionales que tenga a su cargo durante el viaje.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2.5 items-start">
          <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-800">
            Los costos por daño o pérdida de instrumentos, uniformes o accesorios de la
            corporación correrán a cargo del integrante responsable.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'personales',
    badge: '06',
    title: 'Cuidado de elementos personales',
    content: (
      <p>
        Cada integrante es responsable de sus elementos personales: celular, documentos,
        dinero y demás pertenencias. La Corporación <strong>no se hace responsable</strong> por
        pérdidas ocasionadas por descuido.
      </p>
    ),
  },
  {
    id: 'salud',
    badge: '07',
    title: 'Condiciones de salud',
    content: (
      <p>
        Si algún integrante tiene una condición de salud particular (alergias, tratamientos,
        enfermedades), debe informarlo previamente a la Junta Directiva y portar consigo
        los medicamentos que requiera durante el viaje.
      </p>
    ),
  },
  {
    id: 'menores',
    badge: '08',
    title: 'Responsabilidad sobre menores de edad',
    content: (
      <p>
        La responsabilidad legal sobre los integrantes menores de edad durante el viaje
        recae sobre la representante legal de la Corporación, <strong>Sra. Nubia Otálvaro</strong>,
        quien estará a cargo junto con la Junta Directiva de su cuidado y bienestar.
      </p>
    ),
  },
  {
    id: 'uniforme',
    badge: '09',
    title: 'Uniforme oficial para el viaje',
    content: (
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {[
          'Pantalón overol blanco (planchado, sin quiebre)',
          'Chaqueta nueva azul y negra',
          'Camiseta blanca',
          'Zapatos negros',
          'Ropa interior blanca',
          'Medias blancas',
          'Guantes blancos',
          'Quepis con pluma blanca (2 plumas)',
          'Puños negros',
          'Faldón',
        ].map((t, i) => (
          <li key={i} className="flex gap-2 items-start">
            <Shirt size={14} className="text-royal shrink-0 mt-0.5" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: 'presentacion',
    badge: '10',
    title: 'Presentación personal',
    content: (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <p className="font-bold text-navy mb-2">Caballeros</p>
          <ul className="space-y-1.5">
            {[
              'Barba afeitada o debidamente perfilada',
              'Uñas cortas y limpias',
              'Cabello limpio, motilado o recogido',
            ].map((t, i) => (
              <li key={i} className="flex gap-2 items-start">
                <CheckCircle2 size={13} className="text-navy shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-bold text-navy mb-2">Damas</p>
          <ul className="space-y-1.5">
            {[
              'Aretes de perla blanca',
              'Maquillaje institucional',
              'Uñas transparentes con delineado blanco',
              'Cabello recogido, con dona o gel',
            ].map((t, i) => (
              <li key={i} className="flex gap-2 items-start">
                <CheckCircle2 size={13} className="text-navy shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="sm:col-span-2 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2.5 items-start">
          <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-red-700">
            Prohibido el uso de piercings, expansores, topos, manillas, cadenas o cualquier
            accesorio visible que altere la uniformidad del grupo.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'institucional',
    badge: '11',
    title: 'Comportamiento institucional',
    content: (
      <p>
        Durante todo el viaje se espera de cada integrante respeto, disciplina, compañerismo
        y responsabilidad, tanto dentro como fuera de las presentaciones. El comportamiento
        de cada integrante refleja la imagen de la Corporación Musical Guardia Real de Antioquia.
      </p>
    ),
  },
  {
    id: 'tips',
    badge: '12',
    title: 'Tips para el viajero',
    content: (
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {[
          'Frazada o cobija',
          'Toalla',
          'Sandalias para la ducha',
          'Zapatos cómodos',
          'Ropa cómoda',
          'Gorra, sombrero o gafas de sol',
          'Jabón y crema corporal',
          'Protector solar',
          'Cepillo y crema dental',
          'Shampoo',
          'Desodorante',
          'Talco para pies',
        ].map((t, i) => (
          <li key={i} className="flex gap-2 items-start">
            <Backpack size={14} className="text-royal shrink-0 mt-0.5" />
            <span>{t}</span>
          </li>
        ))}
        <li className="sm:col-span-2 flex gap-2 items-start mt-1">
          <Users size={14} className="text-royal shrink-0 mt-0.5" />
          <span>Desplazarse siempre en grupo, nunca solos.</span>
        </li>
      </ul>
    ),
  },
  {
    id: 'hospedaje',
    badge: '13',
    title: 'Hospedaje y alimentación',
    content: (
      <div className="space-y-3">
        <div className="flex gap-2.5 items-start">
          <Building2 size={16} className="text-royal shrink-0 mt-0.5" />
          <p>
            Hospedaje en el <strong>Hotel Davinci</strong> (Cra. 27 #39-22, Calarcá), en habitaciones
            grupales o compartidas. Se solicita respeto, tolerancia, solidaridad y aseo de los
            espacios compartidos.
          </p>
        </div>
        <div className="flex gap-2.5 items-start">
          <UtensilsCrossed size={16} className="text-royal shrink-0 mt-0.5" />
          <p>
            La alimentación se brindará en un restaurante cercano al hotel. Se debe cumplir
            estrictamente con los horarios establecidos para cada comida.
          </p>
        </div>
      </div>
    ),
  },
]

export default function CalarcaPanel() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-display text-navy text-xl font-bold uppercase tracking-wider flex items-center gap-2">
          <MapPin size={20} className="text-royal" />
          Viaje a Calarcá 2026
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          XV Concurso y Festival Nacional de Bandas de Marcha &ldquo;Paisaje Cultural Cafetero&rdquo;
          — Calarcá, Quindío · 13 al 15 de junio de 2026
        </p>
      </div>

      {/* Download CTA */}
      <div className="bg-gold rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-display text-near-black text-lg font-bold uppercase tracking-wider">
            Instructivo oficial del viaje
          </h3>
          <p className="text-near-black/70 text-sm mt-1">
            Descarga el documento completo en PDF con todas las indicaciones
          </p>
        </div>
        <a
          href="/docs/instructivo-calarca-2026.pdf"
          download="Instructivo-Viaje-Calarca-2026.pdf"
          className="btn btn-md bg-near-black text-white hover:bg-navy transition-colors flex items-center gap-2 shrink-0"
        >
          <Download size={18} />
          Descargar instructivo (PDF)
        </a>
      </div>

      {/* Cronograma */}
      <div>
        <h3 className="font-serif font-bold text-navy text-lg mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-royal" />
          Cronograma general
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SCHEDULE.map(({ day, items }) => (
            <div key={day} className="card p-5">
              <p className="font-display text-navy text-sm font-bold uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
                {day}
              </p>
              <ul className="space-y-2.5">
                {items.map((it, i) => (
                  <li key={i} className="flex gap-2.5 text-sm">
                    <span className="font-bold text-gold shrink-0 w-20">{it.time}</span>
                    <span className="text-gray-600">{it.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Información detallada */}
      <div>
        <h3 className="font-serif font-bold text-navy text-lg mb-4 flex items-center gap-2">
          <ShieldCheck size={18} className="text-royal" />
          Recomendaciones e instrucciones generales
        </h3>
        <Accordion items={accordionItems} singleOpen={false} />
      </div>

      {/* Footer contacto */}
      <div className="bg-navy rounded-2xl p-6 text-center text-white">
        <p className="font-serif italic text-gold mb-3">
          &ldquo;Disciplina, progreso y honor&rdquo;
        </p>
        <p className="text-sm text-gray-300 mb-4">
          Cualquier duda sobre el viaje, comunícate con la Junta Directiva:
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
          <a href="tel:+573197735052" className="flex items-center gap-2 justify-center text-blue-100 hover:text-gold transition-colors">
            <Phone size={15} /> 319 773 4052 — 310 509 4658
          </a>
          <a href="mailto:bandashowguardiareal@outlook.com" className="flex items-center gap-2 justify-center text-blue-100 hover:text-gold transition-colors">
            <Mail size={15} /> bandashowguardiareal@outlook.com
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1.5">
          <Music2 size={12} /> Carrera 48a #73-36, Campo Valdés, Medellín
        </p>
      </div>

      <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
        <Heart size={12} className="text-gold" />
        Información exclusiva para integrantes, junta directiva y cuerpo administrativo de la Corporación.
      </p>
    </div>
  )
}
