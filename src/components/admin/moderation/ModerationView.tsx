/**
 * Vue d'admin « Modération » (/admin/moderation) : file de validation des fanarts et
 * des messages du livre d'or. Réservée aux modérateurs et admins (2FA respectée).
 */
import { DefaultTemplate } from '@payloadcms/next/templates'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'
import { hasRole } from '@/access/roles'
import { DEFAULT_REJECTION_REASONS } from '@/globals/ModerationSettings'
import { ModerationQueue } from './ModerationQueue'

export async function ModerationView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  if (!req.user) redirect('/admin/login?redirect=%2Fadmin%2Fmoderation')
  const allowed = hasRole(req, 'moderator')
  const settings = allowed ? await req.payload.findGlobal({ slug: 'moderation-settings', depth: 0 }) : null
  const reasons = settings?.rejectionReasons?.map((r) => r.label).filter(Boolean) ?? DEFAULT_REJECTION_REASONS

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <div className="gutter--left gutter--right" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <h1 style={{ marginBottom: 4 }}>🛡️ Modération</h1>
        <p style={{ opacity: 0.75, marginTop: 0 }}>
          Fanarts et messages du livre d’or envoyés par le public. Rien n’est visible sur le site avant validation. Les alertes ⚠️ viennent du filtre
          automatique (réglages : Communauté › Réglages de modération).
        </p>
        {allowed ? <ModerationQueue reasons={reasons} /> : <p>Accès réservé aux modérateurs.</p>}
      </div>
    </DefaultTemplate>
  )
}
