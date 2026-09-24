import type { TextField } from 'payload'
import type { GlobalConfig } from 'payload'
import { isAdmin } from '@/access/roles'
import { encryptedField } from '@/fields/encrypted'
import { revalidateAll } from '@/hooks/revalidate'

/**
 * Identifiants des services externes, saisis dans l'admin (réservé au rôle Admin).
 * Les secrets sont chiffrés en base. Si un champ est vide, la variable d'environnement
 * équivalente (voir .env.example) est utilisée en repli.
 */

/**
 * Champ texte pour un identifiant collé depuis un tableau de bord externe (Client ID,
 * nom de chaîne, URL…) : un copier-coller ramène facilement un espace ou un retour à la
 * ligne en trop, invisible à l'écran, qui fait échouer la comparaison exacte attendue par
 * le service externe (ex. Twitch renvoie un 403 sans autre explication). On coupe donc
 * systématiquement les espaces en trop à l'enregistrement.
 */
function trimmedText(field: { name: string; label: string; defaultValue?: string; admin?: TextField['admin'] }): TextField {
  return {
    ...field,
    type: 'text',
    hooks: { beforeChange: [({ value }) => (typeof value === 'string' ? value.trim() : value)] },
  }
}
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
            trimmedText({ name: 'channelLogin', label: 'Identifiant de la chaîne', defaultValue: 'liratsu' }),
            trimmedText({ name: 'clientId', label: 'Client ID' }),
            encryptedField({ name: 'clientSecret', label: 'Client Secret' }),
            { name: 'oauthEnabled', label: 'Connexion viewers via Twitch (Espace communauté)', type: 'checkbox', defaultValue: false },
            encryptedField({
              name: 'broadcasterRefreshToken',
              label: 'Jeton du compte Liratsu (abonnés/followers)',
              description: 'Ne pas remplir à la main — utiliser le bouton ci-dessous.',
            }),
            {
              name: 'connectBroadcaster',
              type: 'ui',
              admin: { components: { Field: '@/components/admin/ConnectTwitchBroadcaster#ConnectTwitchBroadcaster' } },
            },
          ],
        },
        {
          label: 'YouTube',
          name: 'youtube',
          fields: [
            trimmedText({
              name: 'channelId',
              label: 'ID de chaîne (UC…)',
              admin: { description: 'Utilisé pour le flux RSS public : aucune clé API nécessaire.' },
            }),
            trimmedText({
              name: 'vodChannelHandle',
              label: 'Pseudo de la chaîne des rediffs (VOD)',
              defaultValue: 'LiratsuVOD',
              admin: { description: 'Sans le « @ ». Utilisé pour retrouver automatiquement le lien de VOD d’un ancien planning.' },
            }),
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
                trimmedText({ name: 'publishableKey', label: 'Clé publiable (pk_test_…)' }),
                encryptedField({ name: 'secretKey', label: 'Clé secrète (sk_test_…)' }),
                encryptedField({ name: 'webhookSecret', label: 'Secret de webhook (whsec_…)' }),
              ],
            },
            {
              name: 'live',
              label: 'Mode production',
              type: 'group',
              fields: [
                trimmedText({ name: 'publishableKey', label: 'Clé publiable (pk_live_…)' }),
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
                trimmedText({ name: 'clientId', label: 'Client ID' }),
                encryptedField({ name: 'clientSecret', label: 'Secret' }),
                trimmedText({ name: 'webhookId', label: 'Webhook ID' }),
              ],
            },
            {
              name: 'live',
              label: 'Production',
              type: 'group',
              fields: [
                trimmedText({ name: 'clientId', label: 'Client ID' }),
                encryptedField({ name: 'clientSecret', label: 'Secret' }),
                trimmedText({ name: 'webhookId', label: 'Webhook ID' }),
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
                trimmedText({ name: 'host', label: 'Serveur', admin: { width: '50%' } }),
                { name: 'port', label: 'Port', type: 'number', defaultValue: 587, admin: { width: '25%' } },
                { name: 'secure', label: 'TLS direct (465)', type: 'checkbox', admin: { width: '25%' } },
              ],
            },
            trimmedText({ name: 'user', label: 'Utilisateur' }),
            encryptedField({ name: 'password', label: 'Mot de passe' }),
            trimmedText({ name: 'from', label: 'Expéditeur', defaultValue: 'Liratsu <boutique@liratsu.fr>' }),
            { name: 'adminNotify', label: 'Email de notification interne', type: 'email' },
          ],
        },
        {
          label: 'Discord',
          name: 'discord',
          description: 'Webhook envoyé automatiquement à chaque changement du planning (Accueil > bloc Planning).',
          fields: [
            encryptedField({
              name: 'scheduleWebhookUrl',
              label: 'URL du webhook (planning)',
              description: 'Discord : Paramètres du salon > Intégrations > Webhooks > Nouveau webhook > Copier l’URL',
            }),
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
            trimmedText({ name: 'scriptUrl', label: 'URL du script' }),
            trimmedText({ name: 'siteId', label: 'ID du site / domaine' }),
          ],
        },
      ],
    },
  ],
}
