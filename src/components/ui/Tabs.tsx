'use client'

import type { ElementType } from 'react'
import { cn } from '@/lib/utils'

export interface TabItem {
  id:    string
  label: string
  icon?: ElementType
}

interface TabsProps {
  tabs:      TabItem[]
  activeTab: string
  onChange:  (id: string) => void
  className?: string
}

export default function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2 justify-center', className)}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-200',
              isActive
                ? 'bg-gradient-primary text-white shadow-lg shadow-royal/20'
                : 'bg-white text-navy border border-gray-200 hover:border-royal hover:text-royal'
            )}
          >
            {Icon && <Icon size={16} />}
            {label}
          </button>
        )
      })}
    </div>
  )
}
