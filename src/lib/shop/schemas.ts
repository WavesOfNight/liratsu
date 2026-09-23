/** Schémas zod partagés par les routes boutique. */
import { z } from 'zod'

export const cartSchema = z
  .array(
    z.object({
      productId: z.string().regex(/^\d+$/),
      sku: z.string().min(1).max(64),
      quantity: z.number().int().min(1).max(20),
    }),
  )
  .min(1, 'Ton panier est vide.')
  .max(30)

export const countrySchema = z
  .string()
  .length(2)
  .transform((s) => s.toUpperCase())

export const addressSchema = z.object({
  firstName: z.string().trim().min(1, 'Prénom requis.').max(60),
  lastName: z.string().trim().min(1, 'Nom requis.').max(60),
  line1: z.string().trim().min(3, 'Adresse requise.').max(120),
  line2: z.string().trim().max(120).optional().or(z.literal('')),
  postalCode: z.string().trim().min(2, 'Code postal requis.').max(12),
  city: z.string().trim().min(1, 'Ville requise.').max(80),
  country: countrySchema,
  phone: z.string().trim().max(30).optional().or(z.literal('')),
})

export const quoteSchema = z.object({
  cart: cartSchema,
  country: countrySchema.default('FR'),
  coupon: z.string().trim().max(40).optional().or(z.literal('')),
  email: z.email().optional().or(z.literal('')),
})

export const checkoutSchema = z.object({
  cart: cartSchema,
  email: z.email('Email invalide.').max(200),
  address: addressSchema,
  coupon: z.string().trim().max(40).optional().or(z.literal('')),
  provider: z.enum(['stripe', 'paypal']),
  acceptCgv: z.literal(true, { error: 'Merci d’accepter les CGV.' }),
  acknowledgeCustom: z.boolean().optional(),
})
