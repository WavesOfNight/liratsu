/**
 * Empreinte visuelle (« average hash » 8×8) : deux images identiques — même
 * redimensionnées, recompressées ou converties — donnent la même empreinte.
 * Sert à repérer les fanarts envoyés plusieurs fois.
 */
import sharp from 'sharp'

export async function averageHash(image: Buffer): Promise<string | null> {
  try {
    const px = await sharp(image, { animated: false }).flatten({ background: '#ffffff' }).greyscale().resize(8, 8, { fit: 'fill' }).raw().toBuffer()
    const avg = px.reduce((s, v) => s + v, 0) / px.length
    let bits = ''
    for (const v of px) bits += v >= avg ? '1' : '0'
    return BigInt(`0b${bits}`).toString(16).padStart(16, '0')
  } catch {
    return null
  }
}
