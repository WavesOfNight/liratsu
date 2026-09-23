'use client'
/** Lien « Modération » dans le menu de l'admin, avec le nombre d'éléments en attente. */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useAuth } from '@payloadcms/ui'

export function ModerationNavLink() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [count, setCount] = useState<number | null>(null)
  const roles = (user as { roles?: string[] } | null)?.roles ?? []
  const allowed = roles.includes('admin') || roles.includes('moderator')

  useEffect(() => {
    if (!allowed) return
    const load = () =>
      fetch('/api/site/admin/moderation?type=fanarts&status=pending', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { counts?: { fanarts: number; guestbook: number } } | null) => d?.counts && setCount(d.counts.fanarts + d.counts.guestbook))
        .catch(() => null)
    void load()
    const t = window.setInterval(load, 60_000)
    return () => window.clearInterval(t)
  }, [allowed, pathname])

  if (!allowed) return null
  const active = pathname?.startsWith('/admin/moderation')
  return (
    <Link
      href="/admin/moderation"
      className="nav__link"
      style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: active ? 700 : 500, margin: '8px 0 16px' }}
      aria-current={active ? 'page' : undefined}
    >
      🛡️ Modération
      {!!count && (
        <span style={{ minWidth: 20, padding: '0 6px', borderRadius: 999, background: '#ff5a7a', color: '#fff', fontSize: 12, textAlign: 'center' }} aria-label={`${count} en attente`}>
          {count}
        </span>
      )}
    </Link>
  )
}
