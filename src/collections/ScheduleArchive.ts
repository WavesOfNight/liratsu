import type { CollectionConfig } from 'payload'
import { anyone, isEditor } from '@/access/roles'

/**
 * Historique des cases du planning une fois la semaine passée : alimenté automatiquement
 * quand le planning change (voir le hook sur la page Accueil), et complétable à la main.
 * Le lien de VOD est recherché automatiquement sur la chaîne de rediffs (bouton dans
 * l'admin, ou tenté une première fois à l'archivage) ; sinon, à coller soi-même.
 */
export const ScheduleArchive: CollectionConfig = {
  slug: 'schedule-archive',
  labels: { singular: 'Ancien créneau', plural: 'Anciens plannings' },
  admin: { group: 'Pages', useAsTitle: 'title', defaultColumns: ['date', 'title', 'game', 'vodFound'] },
  defaultSort: '-date',
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  fields: [
    { name: 'date', label: 'Date du stream', type: 'date', required: true, index: true, admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } } },
    { name: 'title', label: 'Programme', type: 'text', required: true },
    { name: 'game', label: 'Jeu', type: 'text' },
    { name: 'boxArtUrl', label: 'Jaquette (auto)', type: 'text' },
    {
      name: 'kind',
      label: 'Type',
      type: 'select',
      defaultValue: 'game',
      options: [
        { label: 'Jeu vidéo', value: 'game' },
        { label: 'Dessin', value: 'art' },
        { label: 'Musique', value: 'music' },
        { label: 'Discussion', value: 'chat' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'vodUrl', label: 'Lien de la VOD (YouTube)', type: 'text', admin: { width: '70%' } },
        { name: 'vodFound', label: 'Trouvée automatiquement', type: 'checkbox', admin: { width: '30%', readOnly: true } },
      ],
    },
    { name: 'vodTitle', label: 'Titre de la vidéo (info)', type: 'text', admin: { readOnly: true } },
    {
      name: 'findVod',
      type: 'ui',
      admin: { components: { Field: '@/components/admin/FindVodButton#FindVodButton' } },
    },
  ],
}
