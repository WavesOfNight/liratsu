import type { GlobalConfig } from 'payload'
import { anyone, isAdmin } from '@/access/roles'
import { revalidateAll } from '@/hooks/revalidate'

/**
 * Informations légales de l'éditeur (Reads Records) et de l'hébergeur, saisies dans l'admin.
 * Elles alimentent automatiquement les pages juridiques via des variables {{…}}
 * (ex. {{editeur.nom}}) et le bloc d'identification affiché en tête des mentions légales.
 */
export const LegalIdentity: GlobalConfig = {
  slug: 'legal-identity',
  label: 'Identité légale',
  admin: {
    group: 'Légal',
    description:
      'À reprendre à l’identique depuis reads-records.com. Utilisable dans les textes via {{editeur.nom}}, {{editeur.siren}}, {{hebergeur.nom}}, etc.',
  },
  access: { read: anyone, update: isAdmin },
  hooks: { afterChange: [revalidateAll] },
  versions: { max: 50 },
  fields: [
    {
      name: 'editeur',
      label: 'Éditeur du site',
      type: 'group',
      fields: [
        { name: 'nom', label: 'Dénomination', type: 'text', defaultValue: 'Reads Records' },
        { name: 'forme', label: 'Forme juridique', type: 'text', defaultValue: 'SARL' },
        { name: 'capital', label: 'Capital social', type: 'text' },
        { name: 'siege', label: 'Siège social', type: 'textarea' },
        { name: 'rcs', label: 'RCS', type: 'text' },
        { name: 'siren', label: 'SIREN / SIRET', type: 'text' },
        { name: 'tva', label: 'N° TVA intracommunautaire', type: 'text' },
        { name: 'directeur', label: 'Directeur·rice de la publication', type: 'text' },
        { name: 'email', label: 'Email de contact', type: 'email' },
        { name: 'telephone', label: 'Téléphone', type: 'text' },
        { name: 'site', label: 'Site web', type: 'text', defaultValue: 'https://reads-records.com/' },
      ],
    },
    {
      name: 'hebergeur',
      label: 'Hébergeur',
      type: 'group',
      admin: { description: 'IONOS : coordonnées à vérifier sur ionos.fr avant mise en ligne.' },
      fields: [
        { name: 'nom', label: 'Nom', type: 'text', defaultValue: 'IONOS SARL' },
        { name: 'adresse', label: 'Adresse', type: 'textarea', defaultValue: '[À VÉRIFIER]' },
        { name: 'telephone', label: 'Téléphone', type: 'text', defaultValue: '[À VÉRIFIER]' },
        { name: 'site', label: 'Site web', type: 'text', defaultValue: 'https://www.ionos.fr' },
      ],
    },
    {
      name: 'mediateur',
      label: 'Médiateur de la consommation',
      type: 'group',
      fields: [
        { name: 'nom', label: 'Nom', type: 'text', defaultValue: '[À RENSEIGNER]' },
        { name: 'site', label: 'Site / adresse', type: 'text', defaultValue: '[À RENSEIGNER]' },
      ],
    },
    { name: 'dpoEmail', label: 'Email pour les demandes RGPD', type: 'email' },
    { name: 'developpeur', label: 'Crédit conception', type: 'text', defaultValue: 'Site conçu et développé par El Technico Lionel' },
  ],
}
