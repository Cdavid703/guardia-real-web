'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Bell, ExternalLink } from 'lucide-react'
import { cn, getRoleLabel, getRoleBadgeColor } from '@/lib/utils'
import type { UserProfile } from '@/types'

export default function DashboardTopbar({ profile }: { profile: UserProfile }) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
      {/* Left */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Portal Interno</p>
        <p className="text-sm font-semibold text-dark truncate max-w-[200px]">
          Bienvenido, {profile.displayName.split(' ')[0]}
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 hover:text-navy transition-colors"
        >
          <ExternalLink size={13} />
          Sitio público
        </Link>

        <button className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors relative">
          <Bell size={17} className="text-gray-500" />
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold" />
        </button>

        <div className="flex items-center gap-2">
          {profile.photoURL ? (
            <Image src={profile.photoURL} alt={profile.displayName} width={36} height={36}
              className="rounded-full border-2 border-gray-200" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center text-white text-sm font-bold">
              {profile.displayName[0].toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-dark leading-none">{profile.displayName}</p>
            <span className={cn('badge text-[10px] mt-0.5', getRoleBadgeColor(profile.role))}>
              {getRoleLabel(profile.role)}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
