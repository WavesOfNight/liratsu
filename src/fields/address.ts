import type { Field } from 'payload'

/** Sous-champs d'une adresse postale, partagés entre la commande boutique et l'adresse enregistrée d'un membre. */
export const addressFields: Field[] = [
  {
    type: 'row',
    fields: [
      { name: 'firstName', label: 'Prénom', type: 'text' },
      { name: 'lastName', label: 'Nom', type: 'text' },
    ],
  },
  { name: 'line1', label: 'Adresse', type: 'text' },
  { name: 'line2', label: 'Complément', type: 'text' },
  {
    type: 'row',
    fields: [
      { name: 'postalCode', label: 'Code postal', type: 'text' },
      { name: 'city', label: 'Ville', type: 'text' },
      { name: 'country', label: 'Pays (ISO)', type: 'text' },
    ],
  },
  { name: 'phone', label: 'Téléphone', type: 'text' },
]
