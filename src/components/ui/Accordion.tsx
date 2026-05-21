'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface AccordionItem {
  id:      string
  title:   string
  content: ReactNode
  badge?:  string
}

interface AccordionProps {
  items:           AccordionItem[]
  /** Si true, solo uno puede estar abierto a la vez */
  singleOpen?:     boolean
  /** IDs abiertos por defecto */
  defaultOpenIds?: string[]
}

export default function Accordion({ items, singleOpen = true, defaultOpenIds = [] }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(defaultOpenIds))

  const toggle = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(singleOpen ? [] : prev)
      if (prev.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-3">
      {items.map(item => {
        const isOpen = openIds.has(item.id)
        return (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {item.badge && (
                  <span className="font-display text-gold text-lg font-bold shrink-0">
                    {item.badge}
                  </span>
                )}
                <span className="font-serif font-bold text-navy text-base">
                  {item.title}
                </span>
              </div>
              <ChevronDown
                size={20}
                className={`text-gray-400 shrink-0 transition-transform duration-300 ${
                  isOpen ? 'rotate-180 text-navy' : ''
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5 pt-1 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
