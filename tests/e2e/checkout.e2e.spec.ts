/**
 * Parcours d'achat complet en mode SANDBOX Stripe.
 * Prérequis :
 *  - boutique activée, mode test, clés Stripe TEST saisies dans l'admin ;
 *  - webhooks relayés en local :  stripe listen --forward-to localhost:3000/api/site/webhooks/stripe
 *  - lancer avec  E2E_STRIPE=1 npm run test:e2e -- checkout
 */
import { expect, test } from '@playwright/test'

test.skip(process.env.E2E_STRIPE !== '1', 'Parcours Stripe sandbox : définir E2E_STRIPE=1 (voir en-tête du fichier)')

test('achat d’un produit test avec code promo, paiement Stripe sandbox, validation par webhook', async ({ page }) => {
  await page.goto('/boutique')
  await page.getByRole('button', { name: 'Tout refuser' }).click()
  await page.getByRole('link', { name: /Pack de stickers/ }).click()
  await page.getByRole('button', { name: /Ajouter au panier/ }).click()
  await page.getByRole('link', { name: /Voir mon panier/ }).click()

  await page.getByPlaceholder('Code promo').fill('TEST5')
  await page.getByRole('button', { name: 'Appliquer' }).click()

  await page.getByLabel('Email').fill(`e2e+${Date.now()}@example.com`)
  await page.getByLabel('Prénom').fill('Bulle')
  await page.getByLabel('Nom', { exact: true }).fill('Test')
  await page.getByLabel('Adresse', { exact: true }).fill('1 rue des Poissons')
  await page.getByLabel('Code postal').fill('75001')
  await page.getByLabel('Ville').fill('Paris')
  await page.getByRole('checkbox', { name: /CGV/ }).check()
  await page.getByRole('button', { name: /^Payer/ }).click()

  // Page Stripe Checkout (hébergée par Stripe)
  await page.waitForURL(/checkout\.stripe\.com/)
  await page.getByLabel(/Numéro de carte|Card number/).fill('4242424242424242')
  await page.getByLabel(/Expiration/).fill('12 / 34')
  await page.getByLabel(/CVC|Code de sécurité/).fill('123')
  await page.getByLabel(/Nom du titulaire|Cardholder name/).fill('Bulle Test')
  await page.getByTestId('hosted-payment-submit-button').click()

  // Retour sur le site : la commande n'est validée qu'après réception du webhook
  await page.waitForURL(/\/commande\/\d+\?t=/, { timeout: 60_000 })
  await expect(page.getByText('Merci pour ta commande')).toBeVisible({ timeout: 60_000 })
  await expect(page.getByRole('link', { name: /facture/ })).toBeVisible()
})
