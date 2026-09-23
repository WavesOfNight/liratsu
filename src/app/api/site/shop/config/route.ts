import { guard, json } from '@/lib/api'
import { getSiteData } from '@/lib/site'

/** Configuration publique de la boutique (identifiants publics uniquement, jamais de secret). */
export async function GET(req: Request) {
  const blocked = guard(req, 'shop-config', 60, 60_000)
  if (blocked) return blocked
  const { integrations, shop } = await getSiteData()
  const enabled = shop.enabledPayments ?? ['stripe', 'paypal']
  return json({
    testMode: integrations.testMode,
    stripe: enabled.includes('stripe') && Boolean(integrations.stripe.secretKey),
    paypalClientId: enabled.includes('paypal') && integrations.paypal.clientSecret ? integrations.paypal.clientId : null,
    notice: shop.checkoutNotice ?? null,
  })
}
