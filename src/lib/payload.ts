import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

/** Client Payload (Local API) partagé côté serveur. */
export async function getPayloadClient(): Promise<Payload> {
  return getPayload({ config })
}
