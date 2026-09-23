import type { GlobalConfig } from 'payload'
import { isAdmin } from '@/access/roles'
import { encryptedField } from '@/fields/encrypted'
import { revalidateAll } from '@/hooks/revalidate'

/**
 * Identifiants des services externes, saisis dans l'admin (réservé au rôle Admin).
 * Les secrets sont chiffrés en base. Si un champ est vide, la variable d'environnement
 * équivalente (voir .env.example) est utilisée en repli.
 */
export const Integrations: GlobalConfig = {
  slug: 'integrations',
  label: 'Clés API & services',
  admin: { group: 'Réglages', description: 'Réservé aux admins. Les secrets ne sont jamais réaffichés en clair.' },
  access: { read: isAdmin, update: isAdmin },
  hooks: { afterChange: [revalidateAll] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Twitch',
          name: 'twitch',
          description: 'Application à créer sur https://dev.twitch.tv/console/apps',
          fields: [
            { name: 'channelLogin', label: 'Identifiant de la chaîne', type: 'text', defaultValue: 'liratsu' },
            { name: 'clientId', label: 'Client ID', type: 'text' },
            encryptedField({ name: 'clientSecret', label: 'Client Secret' }),
            { name: 'oauthEnabled', label: 'Connexion viewers via Twitch (Espace communauté)', type: 'checkbox', defaultValue: false },
          ],
        },
        {
          label: 'YouTube',
          name: 'youtube',
          fields: [
            {
              name: 'channelId',
              label: 'ID de chaîne (UC…)',
              type: 'text',
              admin: { description: 'Utilisé pour le flux RSS public : aucune clé API nécessaire.' },
            },
          ],
        },
        {
          label: 'Stripe',
          name: 'stripe',
          description: 'https://dashboard.stripe.com/apikeys (le mode test/live se bascule dans « Paramètres boutique »).',
          fields: [
            {
              name: 'test',
              label: 'Mode test',
              type: 'group',
              fields: [
                { name: 'publishableKey', label: 'Clé publiable (pk_test_…)', type: 'text' },
                encryptedField({ name: 'secretKey', label: 'Clé secrète (sk_test_…)' }),
                encryptedField({ name: 'webhookSecret', label: 'Secret de webhook (whsec_…)' }),
              ],
            },
            {
              name: 'live',
              label: 'Mode production',
              type: 'group',
              fields: [
                { name: 'publishableKey', label: 'Clé publiable (pk_live_…)', type: 'text' },
                encryptedField({ name: 'secretKey', label: 'Clé secrète (sk_live_…)' }),
                encryptedField({ name: 'webhookSecret', label: 'Secret de webhook (whsec_…)' }),
              ],
            },
          ],
        },
        {
          label: 'PayPal',
          name: 'paypal',
          description: 'https://developer.paypal.com/dashboard/applications',
          fields: [
            {
              name: 'sandbox',
              label: 'Sandbox',
              type: 'group',
              fields: [
                { name: 'clientId', label: 'Client ID', type: 'text' },
                encryptedField({ name: 'clientSecret', label: 'Secret' }),
                { name: 'webhookId', label: 'Webhook ID', type: 'text' },
              ],
            },
            {
              name: 'live',
              label: 'Production',
              type: 'group',
              fields: [
                { name: 'clientId', label: 'Client ID', type: 'text' },
                encryptedField({ name: 'clientSecret', label: 'Secret' }),
                { name: 'webhookId', label: 'Webhook ID', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Gelato',
          name: 'gelato',
          description: 'https://dashboard.gelato.com/keys',
          fields: [
            encryptedField({ name: 'apiKey', label: 'Clé API' }),
            encryptedField({
              name: 'webhookToken',
              label: 'Jeton secret des webhooks',
              description: 'Chaîne aléatoire ajoutée à l’URL du webhook (?token=…)',
            }),
          ],
        },
        {
          label: 'Emails (SMTP)',
          name: 'smtp',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'host', label: 'Serveur', type: 'text', admin: { width: '50%' } },
                { name: 'port', label: 'Port', type: 'number', defaultValue: 587, admin: { width: '25%' } },
                { name: 'secure', label: 'TLS direct (465)', type: 'checkbox', admin: { width: '25%' } },
              ],
            },
            { name: 'user', label: 'Utilisateur', type: 'text' },
            encryptedField({ name: 'password', label: 'Mot de passe' }),
            { name: 'from', label: 'Expéditeur', type: 'text', defaultValue: 'Liratsu <boutique@liratsu.fr>' },
            { name: 'adminNotify', label: 'Email de notification interne', type: 'email' },
          ],
        },
        {
          label: 'Statistiques',
          name: 'analytics',
          description: 'Solution auto-hébergée optionnelle (Umami ou Plausible), chargée uniquement après consentement.',
          fields: [
            {
              name: 'provider',
              label: 'Outil',
              type: 'select',
              defaultValue: 'none',
              options: [
                { label: 'Aucun', value: 'none' },
                { label: 'Umami', value: 'umami' },
                { label: 'Plausible', value: 'plausible' },
              ],
            },
            { name: 'scriptUrl', label: 'URL du script', type: 'text' },
            { name: 'siteId', label: 'ID du site / domaine', type: 'text' },
          ],
        },
      ],
    },
  ],
}
