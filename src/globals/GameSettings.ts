import type { GlobalConfig } from 'payload'
import { anyone, isEditor } from '@/access/roles'
import { revalidateAll } from '@/hooks/revalidate'

export const GameSettings: GlobalConfig = {
  slug: 'game-settings',
  label: 'Mini-jeux',
  admin: { group: 'Arcade' },
  access: { read: anyone, update: isEditor },
  hooks: { afterChange: [revalidateAll] },
  fields: [
    {
      name: 'saac',
      label: 'The Saac',
      type: 'group',
      fields: [
        { name: 'enabled', label: 'Jeu disponible', type: 'checkbox', defaultValue: true },
        { name: 'leaderboardEnabled', label: 'Classement en ligne', type: 'checkbox', defaultValue: true },
        {
          name: 'difficulty',
          label: 'Difficulté',
          type: 'select',
          defaultValue: 'normal',
          options: [
            { label: 'Douce', value: 'easy' },
            { label: 'Normale', value: 'normal' },
            { label: 'Corsée', value: 'hard' },
          ],
        },
        { name: 'startHearts', label: 'Cœurs au départ', type: 'number', defaultValue: 3, min: 1, max: 12 },
        { name: 'floors', label: 'Nombre d’étages', type: 'number', defaultValue: 5, min: 1, max: 20 },
        {
          name: 'maxScorePerSecond',
          label: 'Anti-triche : score max par seconde de jeu',
          type: 'number',
          defaultValue: 60,
        },
        {
          name: 'unlocks',
          label: 'Déblocages',
          type: 'array',
          admin: { description: 'Défis qui débloquent un code surprise (fond d’écran, pack…) dans l’Espace communauté.' },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'condition',
                  label: 'Condition',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Atteindre l’étage N', value: 'floor' },
                    { label: 'Score ≥ N', value: 'score' },
                    { label: 'Vaincre le boss final', value: 'win' },
                    { label: 'Terminer le défi du jour', value: 'daily' },
                  ],
                },
                { name: 'threshold', label: 'N', type: 'number', defaultValue: 1 },
              ],
            },
            { name: 'reward', label: 'Code surprise', type: 'relationship', relationTo: 'surprise-codes', required: true },
            { name: 'message', label: 'Message affiché', type: 'text' },
          ],
        },
      ],
    },
  ],
}
