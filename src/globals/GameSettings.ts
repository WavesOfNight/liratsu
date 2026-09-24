import type { GlobalConfig } from 'payload'
import { anyone, isEditor } from '@/access/roles'
import { revalidateAll } from '@/hooks/revalidate'

/** Éléments visuels personnalisables (sprites & tileset). Si aucune image n'est fournie pour
 * une clé, le moteur dessine son art pixel intégré (aucune casse possible). */
export const SPRITE_KEYS = [
  { value: 'player', label: 'Personnage (Liratsu chibi)' },
  { value: 'floorTile', label: 'Sol de la salle (texture, répétée)' },
  { value: 'wallTile', label: 'Mur / bordure (texture, répétée)' },
  { value: 'rockTile', label: 'Obstacle dans la salle' },
  { value: 'pickupCoin', label: 'Coquillage (monnaie)' },
  { value: 'pickupHeart', label: 'Cœur (vie)' },
  { value: 'enemyGoldfish', label: 'Ennemi : poisson rouge' },
  { value: 'enemyBubble', label: 'Ennemi : bulle' },
  { value: 'enemyPopup', label: 'Ennemi : pop-up d’erreur' },
  { value: 'enemyCursor', label: 'Ennemi : curseur fou' },
  { value: 'enemyLag', label: 'Ennemi : lag' },
  { value: 'enemyTroll', label: 'Ennemi : troll de chat' },
  { value: 'bossPopup', label: 'Boss : Méga Pop-up d’erreur' },
  { value: 'bossSun', label: 'Boss : Poisson-lune géant' },
] as const
export type SpriteKey = (typeof SPRITE_KEYS)[number]['value']

export const GameSettings: GlobalConfig = {
  slug: 'game-settings',
  label: 'Mini-jeux',
  admin: { group: 'Arcade' },
  access: { read: anyone, update: isEditor },
  hooks: { afterChange: [revalidateAll] },
  fields: [
    {
      name: 'ratsu',
      label: 'The Ratsu',
      type: 'group',
      fields: [
        {
          type: 'tabs',
          tabs: [
            {
              label: 'Réglages',
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
            {
              label: 'Sprites & tileset',
              description: 'Remplace un élément du jeu par ta propre image. Laisse vide pour garder le pixel art intégré.',
              fields: [
                {
                  name: 'spriteOverrides',
                  label: 'Sprites personnalisés',
                  type: 'array',
                  labels: { singular: 'Sprite', plural: 'Sprites' },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'key', label: 'Élément', type: 'select', required: true, options: [...SPRITE_KEYS] },
                        { name: 'image', label: 'Image (PNG conseillé, fond transparent)', type: 'upload', relationTo: 'game-assets', required: true, filterOptions: { kind: { equals: 'sprite' } } },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              label: 'Musique d’ambiance',
              fields: [
                {
                  name: 'musicTracks',
                  label: 'Pistes',
                  type: 'array',
                  labels: { singular: 'Piste', plural: 'Pistes' },
                  admin: { description: 'Jouées en boucle pendant la partie (coupées par défaut, un bouton 🎵 permet de les activer). Sans piste : silence.' },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'title', label: 'Titre', type: 'text', required: true },
                        { name: 'file', label: 'Fichier audio (mp3/ogg/wav)', type: 'upload', relationTo: 'game-assets', required: true, filterOptions: { kind: { equals: 'music' } } },
                        {
                          name: 'floorFrom',
                          label: 'À partir de l’étage',
                          type: 'number',
                          min: 1,
                          admin: { description: '1 = dès le début. Utilisé pour changer de piste en montant d’étage.' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
