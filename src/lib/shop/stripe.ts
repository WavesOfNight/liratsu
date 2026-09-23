/** Client Stripe configuré selon le mode (test/live) choisi dans l'admin. */
import Stripe from 'stripe'
import { getIntegrations } from '../settings'

const clients = new Map<string, Stripe>()

export async function getStripe(): Promise<{ stripe: Stripe; webhookSecret: string; publishableKey: string }> {
  const { stripe } = await getIntegrations()
  if (!stripe.secretKey) throw new Error('Stripe non configuré')
  let client = clients.get(stripe.secretKey)
  if (!client) {
    client = new Stripe(stripe.secretKey, { appInfo: { name: 'liratsu.fr' } })
    clients.set(stripe.secretKey, client)
  }
  return { stripe: client, webhookSecret: stripe.webhookSecret, publishableKey: stripe.publishableKey }
}
