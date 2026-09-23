import type { Field, GlobalConfig } from 'payload'
import { anyone, isEditor } from '@/access/roles'
import { revalidateAll } from '@/hooks/revalidate'

export const EASTER_EGGS = [
  { key: 'konami', label: 'Konami code → pluie de poissons et de bulles' },
  { key: 'logoPop', label: '7 clics sur le logo → le logo éclate puis se reforme' },
  { key: 'windowClose', label: 'Bouton « fermer » d’une fenêtre → « Tu croyais vraiment pouvoir me fermer ? »' },
  { key: 'wizz', label: 'Taper « lionel » → wizz d’El Technico Lionel' },
  { key: 'footerCredit', label: 'Animation au survol du crédit développeur' },
  { key: 'console', label: 'Message ASCII dans la console du navigateur' },
  { key: 'aquarium404', label: 'Page 404 aquarium' },
  { key: 'secretCode', label: 'Easter egg secret qui révèle un code surprise' },
] as const

export type EasterEggKey = (typeof EASTER_EGGS)[number]['key']

export const EasterEggs: GlobalConfig = {
  slug: 'easter-eggs',
  label: 'Easter eggs',
  admin: { group: 'Réglages' },
  access: { read: anyone, update: isEditor },
  hooks: { afterChange: [revalidateAll] },
  fields: [
    ...EASTER_EGGS.map<Field>((egg) => ({ name: egg.key, label: egg.label, type: 'checkbox', defaultValue: true })),
    {
      name: 'secretHint',
      label: 'Easter egg secret : comment le déclencher',
      type: 'select',
      defaultValue: 'fishClicks',
      options: [
        { label: 'Cliquer 3 fois sur le poisson doré du fond (rare)', value: 'fishClicks' },
        { label: 'Taper « glouglou » n’importe où', value: 'typeGlouglou' },
      ],
    },
    {
      name: 'secretReward',
      label: 'Code surprise révélé',
      type: 'relationship',
      relationTo: 'surprise-codes',
      admin: { description: 'Code donné au visiteur qui trouve l’easter egg secret.' },
    },
  ],
}
