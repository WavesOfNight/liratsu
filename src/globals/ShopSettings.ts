import type { GlobalConfig } from 'payload'
import { adminFieldOnly, anyone, isEditor } from '@/access/roles'
import { revalidateAll } from '@/hooks/revalidate'

export const ShopSettings: GlobalConfig = {
  slug: 'shop-settings',
  label: 'Paramètres boutique',
  admin: { group: 'Boutique' },
  access: { read: anyone, update: isEditor },
  hooks: { afterChange: [revalidateAll] },
  fields: [
    {
      name: 'testMode',
      label: 'Mode test / sandbox (Stripe test + PayPal sandbox, bandeau visible sur le site)',
      type: 'checkbox',
      defaultValue: true,
      access: { update: adminFieldOnly },
    },
    { name: 'currency', label: 'Devise', type: 'select', defaultValue: 'EUR', options: [{ label: 'Euro (€)', value: 'EUR' }] },
    {
      name: 'vatRates',
      label: 'Taux de TVA',
      type: 'array',
      admin: { description: 'Les prix saisis sont TTC ; la TVA est extraite pour les factures.' },
      defaultValue: [
        { key: 'standard', label: 'Taux normal', rate: 20 },
        { key: 'reduced', label: 'Taux réduit', rate: 5.5 },
      ],
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'key', label: 'Clé', type: 'text', required: true },
            { name: 'label', label: 'Libellé', type: 'text', required: true },
            { name: 'rate', label: 'Taux (%)', type: 'number', required: true, min: 0, max: 100 },
          ],
        },
      ],
    },
    {
      name: 'enabledPayments',
      label: 'Moyens de paiement actifs',
      type: 'select',
      hasMany: true,
      defaultValue: ['stripe', 'paypal'],
      options: [
        { label: 'Stripe (CB, Apple Pay, Google Pay)', value: 'stripe' },
        { label: 'PayPal', value: 'paypal' },
      ],
    },
    {
      name: 'invoice',
      label: 'Factures',
      type: 'group',
      admin: { description: 'Informations de l’émetteur des factures (Reads Records). À compléter/vérifier.' },
      fields: [
        { name: 'issuerName', label: 'Raison sociale', type: 'text', defaultValue: 'Reads Records' },
        { name: 'issuerDetails', label: 'Adresse, SIREN, TVA intracom (une info par ligne)', type: 'textarea' },
        { name: 'prefix', label: 'Préfixe de numérotation', type: 'text', defaultValue: 'LIR' },
        { name: 'footer', label: 'Pied de facture', type: 'textarea', defaultValue: 'Merci pour ton soutien ! Boutique officielle Liratsu, éditée par Reads Records.' },
      ],
    },
    { name: 'freeShippingThreshold', label: 'Livraison offerte dès (€, 0 = jamais)', type: 'number', defaultValue: 0, min: 0 },
    { name: 'checkoutNotice', label: 'Message au paiement', type: 'textarea' },
  ],
}
