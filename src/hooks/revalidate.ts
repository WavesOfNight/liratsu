/**
 * Invalide le cache Next.js après une modification dans l'admin, pour que le site
 * reflète immédiatement les changements.
 */
import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from 'payload'
import { invalidateSettingsCache } from '@/lib/settingsCache'

async function revalidateEverything(): Promise<void> {
  invalidateSettingsCache()
  try {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/', 'layout')
  } catch {
    // Hors contexte Next (seed, CLI) : rien à invalider.
  }
}

export const revalidateAll: GlobalAfterChangeHook = async ({ doc }) => {
  await revalidateEverything()
  return doc
}

export const revalidateCollection: CollectionAfterChangeHook = async ({ doc }) => {
  await revalidateEverything()
  return doc
}
