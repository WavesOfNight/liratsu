import type { Field, GlobalConfig } from 'payload'
import { anyone, isEditor } from '@/access/roles'
import { revalidateAll } from '@/hooks/revalidate'

export const DEFAULT_PALETTE = {
  aero: '#3FA9F5',
  deep: '#1E6FD9',
  lagoon: '#2EC4C9',
  candy: '#FF7EB6',
  lime: '#9BE15D',
  star: '#FFD35C',
  ink: '#1B2240',
  cloud: '#F4F8FF',
}

const color = (name: keyof typeof DEFAULT_PALETTE, label: string): Field => ({
  name,
  label,
  type: 'text',
  defaultValue: DEFAULT_PALETTE[name],
  validate: (v: string | null | undefined) => !v || /^#[0-9a-fA-F]{6}$/.test(v) || 'Format attendu : #RRGGBB',
  admin: { width: '25%', components: { Field: '@/components/admin/ColorField#ColorField' } },
})

export const Theme: GlobalConfig = {
  slug: 'theme',
  label: 'Thème',
  admin: { group: 'Réglages' },
  access: { read: anyone, update: isEditor },
  hooks: { afterChange: [revalidateAll] },
  fields: [
    {
      name: 'palette',
      label: 'Palette',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [color('aero', 'Bleu aero'), color('deep', 'Bleu profond'), color('lagoon', 'Turquoise lagon'), color('candy', 'Rose bonbon')],
        },
        {
          type: 'row',
          fields: [color('lime', 'Vert aero'), color('star', 'Jaune étoile'), color('ink', 'Encre (texte)'), color('cloud', 'Blanc nuage')],
        },
      ],
    },
    {
      name: 'effects',
      label: 'Effets',
      type: 'group',
      admin: {
        description: 'Les visiteurs peuvent aussi couper animations et sons ; prefers-reduced-motion est toujours respecté.',
      },
      fields: [
        { name: 'bubbles', label: 'Bulles animées en fond', type: 'checkbox', defaultValue: true },
        { name: 'soundsAvailable', label: 'Proposer les sons rétro (OFF par défaut chez le visiteur)', type: 'checkbox', defaultValue: true },
        { name: 'customCursors', label: 'Curseurs personnalisés (étoile / bulle)', type: 'checkbox', defaultValue: false },
        {
          name: 'defaultMode',
          label: 'Mode par défaut',
          type: 'select',
          defaultValue: 'auto',
          options: [
            { label: 'Suivre le système', value: 'auto' },
            { label: 'Ciel (clair)', value: 'light' },
            { label: 'Aquarium de nuit (sombre)', value: 'dark' },
          ],
        },
      ],
    },
  ],
}
