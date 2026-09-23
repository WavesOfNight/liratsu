/**
 * Outil de dev : change l'état des sections sans passer par l'admin.
 *   npx payload run scripts/dev-sections.ts -- community=on shop=on
 */
import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })
const site = await payload.findGlobal({ slug: 'site-settings' })
const data: Record<string, unknown> = {}
for (const arg of process.argv.slice(2)) {
  const [key, status] = arg.split('=')
  if (key && ['on', 'off', 'soon'].includes(status)) data[key] = { ...(site as Record<string, object>)[key], status }
}
await payload.updateGlobal({ slug: 'site-settings', data })
console.log('Sections mises à jour :', Object.keys(data).join(', ') || '(aucune)')
process.exit(0)
