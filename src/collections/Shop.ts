/**
 * Boutique : produits (avec variantes), catégories, commandes, clients, bons de réduction,
 * zones de livraison et journal des webhooks (idempotence).
 */
import type { CollectionConfig } from 'payload'
import { anyone, hasRole, isAdmin, isEditor } from '@/access/roles'
import { revalidateCollection } from '@/hooks/revalidate'
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '@/lib/shop/orderStatus'

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Catégorie', plural: 'Catégories' },
  admin: { group: 'Boutique', useAsTitle: 'title' },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  hooks: { afterChange: [revalidateCollection] },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      hooks: { beforeValidate: [({ value, data }) => value || (data?.title ? slugify(data.title) : value)] },
    },
    { name: 'order', label: 'Ordre', type: 'number', defaultValue: 0 },
  ],
}

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Produit', plural: 'Produits' },
  admin: { group: 'Boutique', useAsTitle: 'title', defaultColumns: ['title', 'fulfillment', 'price', '_status'] },
  access: {
    read: ({ req }) => (hasRole(req, 'editor') ? true : { _status: { equals: 'published' } }),
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  versions: { drafts: true, maxPerDoc: 20 },
  hooks: { afterChange: [revalidateCollection] },
  fields: [
    { name: 'title', label: 'Nom', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
      hooks: { beforeValidate: [({ value, data }) => value || (data?.title ? slugify(data.title) : value)] },
    },
    { name: 'categories', label: 'Catégories', type: 'relationship', relationTo: 'categories', hasMany: true, admin: { position: 'sidebar' } },
    {
      name: 'fulfillment',
      label: 'Type de produit',
      type: 'radio',
      required: true,
      defaultValue: 'gelato',
      options: [
        { label: 'Print-on-demand (Gelato)', value: 'gelato' },
        { label: 'Stock propre (expédition manuelle)', value: 'stock' },
      ],
    },
    { name: 'badge', label: 'Sticker (ex. « nouveau », « édition limitée »)', type: 'text' },
    { name: 'shortDescription', label: 'Description courte', type: 'textarea' },
    { name: 'description', label: 'Description', type: 'richText' },
    {
      name: 'images',
      type: 'array',
      minRows: 1,
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
    {
      type: 'row',
      fields: [
        { name: 'price', label: 'Prix TTC (€)', type: 'number', required: true, min: 0, admin: { step: 0.01 } },
        { name: 'compareAtPrice', label: 'Ancien prix (€)', type: 'number', min: 0, admin: { step: 0.01 } },
        { name: 'vatKey', label: 'TVA (clé des paramètres)', type: 'text', defaultValue: 'standard' },
      ],
    },
    { name: 'personalized', label: 'Produit personnalisé (exclu du droit de rétractation)', type: 'checkbox' },
    {
      name: 'variants',
      label: 'Variantes',
      type: 'array',
      minRows: 1,
      admin: { description: 'Au moins une variante (ex. « Unique » pour un produit sans taille). Le SKU doit être unique.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', label: 'Libellé', type: 'text', required: true, admin: { placeholder: 'M / Bleu aero' } },
            { name: 'sku', label: 'SKU', type: 'text', required: true },
            { name: 'size', label: 'Taille', type: 'text' },
            { name: 'color', label: 'Couleur', type: 'text' },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'price', label: 'Prix spécifique (€, sinon prix du produit)', type: 'number', min: 0, admin: { step: 0.01 } },
            {
              name: 'stock',
              label: 'Stock (produits en stock propre)',
              type: 'number',
              min: 0,
              admin: { condition: (data) => data?.fulfillment === 'stock' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'gelatoProductUid',
              label: 'Gelato productUid',
              type: 'text',
              admin: { condition: (data) => data?.fulfillment === 'gelato' },
            },
            {
              name: 'gelatoFileUrl',
              label: 'URL publique du fichier d’impression',
              type: 'text',
              admin: { condition: (data) => data?.fulfillment === 'gelato' },
            },
          ],
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
      ],
    },
  ],
}

export const ShippingZones: CollectionConfig = {
  slug: 'shipping-zones',
  labels: { singular: 'Zone de livraison', plural: 'Frais de port' },
  admin: { group: 'Boutique', useAsTitle: 'name', defaultColumns: ['name', 'countries', 'base'] },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  fields: [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    {
      name: 'countries',
      label: 'Pays (codes ISO séparés par des virgules, * = reste du monde)',
      type: 'text',
      required: true,
      admin: { placeholder: 'FR, MC' },
    },
    {
      type: 'row',
      fields: [
        { name: 'base', label: 'Tarif 1er article (€)', type: 'number', required: true, min: 0, admin: { step: 0.01 } },
        { name: 'perExtraItem', label: 'Par article supplémentaire (€)', type: 'number', defaultValue: 0, min: 0, admin: { step: 0.01 } },
        { name: 'freeFrom', label: 'Offerte dès (€)', type: 'number', min: 0, admin: { step: 0.01 } },
      ],
    },
    { name: 'delay', label: 'Délai indicatif', type: 'text', admin: { placeholder: '3 à 7 jours ouvrés après fabrication' } },
  ],
}

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  labels: { singular: 'Bon de réduction', plural: 'Bons de réduction' },
  admin: {
    group: 'Boutique',
    useAsTitle: 'code',
    defaultColumns: ['code', 'type', 'value', 'usageCount', 'batch', 'active'],
    listSearchableFields: ['code', 'batch'],
    components: { beforeList: ['@/components/admin/CouponBatchGenerator#CouponBatchGenerator'] },
  },
  access: { read: isEditor, create: isEditor, update: isEditor, delete: isEditor },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: { beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value)] },
    },
    { name: 'active', label: 'Actif', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'batch', label: 'Lot (génération groupée)', type: 'text', index: true, admin: { position: 'sidebar' } },
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'percent',
          options: [
            { label: 'Pourcentage', value: 'percent' },
            { label: 'Montant fixe (€)', value: 'fixed' },
            { label: 'Livraison offerte', value: 'freeShipping' },
          ],
        },
        {
          name: 'value',
          label: 'Valeur (% ou €)',
          type: 'number',
          defaultValue: 10,
          min: 0,
          admin: { condition: (_, s) => s?.type !== 'freeShipping' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'startsAt', label: 'Début', type: 'date' },
        { name: 'endsAt', label: 'Fin', type: 'date' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'maxUses', label: 'Utilisations max (global)', type: 'number', min: 0 },
        { name: 'maxUsesPerCustomer', label: 'Max par client', type: 'number', min: 0, defaultValue: 1 },
        { name: 'minAmount', label: 'Panier minimum (€)', type: 'number', min: 0 },
      ],
    },
    { name: 'products', label: 'Limité aux produits', type: 'relationship', relationTo: 'products', hasMany: true },
    { name: 'categories', label: 'Limité aux catégories', type: 'relationship', relationTo: 'categories', hasMany: true },
    { name: 'note', label: 'Note interne (ex. giveaway du 12/10)', type: 'text' },
    {
      name: 'usageCount',
      label: 'Utilisations',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'revenue',
      label: 'CA généré (€)',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}

export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Client', plural: 'Clients' },
  admin: { group: 'Boutique', useAsTitle: 'email', defaultColumns: ['email', 'name', 'ordersCount', 'totalSpent'] },
  access: { read: isEditor, create: isEditor, update: isEditor, delete: isAdmin },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true, index: true },
    { name: 'name', label: 'Nom', type: 'text' },
    { name: 'phone', label: 'Téléphone', type: 'text' },
    { name: 'ordersCount', label: 'Commandes', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'totalSpent', label: 'Total dépensé (€)', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
}

const addressFields = [
  {
    type: 'row' as const,
    fields: [
      { name: 'firstName', label: 'Prénom', type: 'text' as const },
      { name: 'lastName', label: 'Nom', type: 'text' as const },
    ],
  },
  { name: 'line1', label: 'Adresse', type: 'text' as const },
  { name: 'line2', label: 'Complément', type: 'text' as const },
  {
    type: 'row' as const,
    fields: [
      { name: 'postalCode', label: 'Code postal', type: 'text' as const },
      { name: 'city', label: 'Ville', type: 'text' as const },
      { name: 'country', label: 'Pays (ISO)', type: 'text' as const },
    ],
  },
  { name: 'phone', label: 'Téléphone', type: 'text' as const },
]

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Commande', plural: 'Commandes' },
  admin: {
    group: 'Boutique',
    useAsTitle: 'number',
    defaultColumns: ['number', 'email', 'status', 'total', 'provider', 'createdAt'],
    listSearchableFields: ['number', 'email', 'providerRef'],
  },
  access: { read: isEditor, create: () => false, update: isEditor, delete: isAdmin },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'number', label: 'N°', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
        {
          name: 'status',
          label: 'Statut',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          index: true,
          options: ORDER_STATUSES.map((s) => ({ label: ORDER_STATUS_LABELS[s], value: s })),
        },
        { name: 'testMode', label: 'Commande de test', type: 'checkbox', admin: { readOnly: true } },
      ],
    },
    {
      name: 'actions',
      type: 'ui',
      admin: { components: { Field: '@/components/admin/OrderActions#OrderActions' } },
    },
    { name: 'email', type: 'email', required: true, index: true },
    { name: 'customer', type: 'relationship', relationTo: 'customers' },
    {
      type: 'row',
      fields: [
        {
          name: 'provider',
          label: 'Paiement',
          type: 'select',
          required: true,
          options: [
            { label: 'Stripe', value: 'stripe' },
            { label: 'PayPal', value: 'paypal' },
          ],
          admin: { readOnly: true },
        },
        { name: 'providerRef', label: 'Réf. session/commande', type: 'text', index: true, admin: { readOnly: true } },
        { name: 'paymentId', label: 'Réf. paiement (PaymentIntent / capture)', type: 'text', admin: { readOnly: true } },
      ],
    },
    {
      name: 'items',
      label: 'Articles',
      type: 'array',
      admin: { readOnly: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'title', type: 'text' },
            { name: 'variantLabel', label: 'Variante', type: 'text' },
            { name: 'sku', type: 'text' },
            { name: 'quantity', label: 'Qté', type: 'number' },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'unitPrice', label: 'PU TTC (cts)', type: 'number' },
            { name: 'discount', label: 'Remise (cts)', type: 'number' },
            { name: 'vatRate', label: 'TVA %', type: 'number' },
            { name: 'fulfillment', type: 'text' },
          ],
        },
        { name: 'product', type: 'relationship', relationTo: 'products' },
        { name: 'gelatoProductUid', type: 'text' },
        { name: 'gelatoFileUrl', type: 'text' },
      ],
    },
    {
      name: 'amounts',
      label: 'Montants (centimes)',
      type: 'group',
      admin: { readOnly: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'subtotal', type: 'number' },
            { name: 'discount', type: 'number' },
            { name: 'shipping', type: 'number' },
            { name: 'vat', type: 'number' },
          ],
        },
        { name: 'vatBreakdown', type: 'json' },
      ],
    },
    { name: 'total', label: 'Total TTC (€)', type: 'number', admin: { readOnly: true } },
    { name: 'coupon', type: 'relationship', relationTo: 'coupons', admin: { readOnly: true } },
    { name: 'couponCode', label: 'Code promo', type: 'text', admin: { readOnly: true } },
    { name: 'shippingZone', type: 'relationship', relationTo: 'shipping-zones', admin: { readOnly: true } },
    { name: 'shippingAddress', label: 'Adresse de livraison', type: 'group', fields: addressFields },
    {
      name: 'fulfillment',
      label: 'Expédition',
      type: 'group',
      fields: [
        { name: 'gelatoOrderId', label: 'Commande Gelato', type: 'text', admin: { readOnly: true } },
        { name: 'gelatoStatus', label: 'Statut Gelato', type: 'text', admin: { readOnly: true } },
        { name: 'gelatoError', label: 'Erreur Gelato', type: 'textarea', admin: { readOnly: true } },
        {
          type: 'row',
          fields: [
            { name: 'carrier', label: 'Transporteur', type: 'text' },
            { name: 'trackingNumber', label: 'N° de suivi', type: 'text' },
            { name: 'trackingUrl', label: 'Lien de suivi', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'refunds',
      label: 'Remboursements',
      type: 'array',
      admin: { readOnly: true },
      fields: [
        { name: 'amount', label: 'Montant (cts)', type: 'number' },
        { name: 'reference', type: 'text' },
        { name: 'at', type: 'date' },
        { name: 'by', type: 'text' },
      ],
    },
    { name: 'invoiceNumber', label: 'N° de facture', type: 'text', unique: true, admin: { readOnly: true, position: 'sidebar' } },
    { name: 'paidAt', label: 'Payée le', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'accessToken', type: 'text', hidden: true },
    { name: 'emailsSent', type: 'json', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'notes', label: 'Notes internes', type: 'textarea' },
  ],
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        // Expédition manuelle (stock propre) : l'éditrice saisit le suivi et passe le statut à « Expédiée »
        // → email automatique au client.
        if (operation !== 'update' || !previousDoc || previousDoc.status === doc.status) return doc
        if (req.context?.skipStatusEmail) return doc
        const { sendOrderStatusEmail } = await import('@/lib/shop/emails')
        await sendOrderStatusEmail(req.payload, doc, doc.status).catch((err) => req.payload.logger.error(err))
        return doc
      },
    ],
  },
}

export const WebhookEvents: CollectionConfig = {
  slug: 'webhook-events',
  labels: { singular: 'Événement webhook', plural: 'Journal webhooks' },
  admin: { group: 'Réglages', useAsTitle: 'eventId', defaultColumns: ['source', 'type', 'eventId', 'createdAt'] },
  access: { read: isAdmin, create: () => false, update: () => false, delete: isAdmin },
  fields: [
    { name: 'eventId', type: 'text', required: true, unique: true, index: true },
    { name: 'source', type: 'text', required: true },
    { name: 'type', type: 'text' },
    { name: 'order', type: 'relationship', relationTo: 'orders' },
    { name: 'note', type: 'text' },
  ],
}
