import { expect, test } from '@playwright/test'

test.describe('site public', () => {
  test('accueil : logo, navigation et bandeau cookies CNIL', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Liratsu')
    const banner = page.getByRole('dialog', { name: /cookies/i })
    await expect(banner).toBeVisible()
    // Refuser est aussi simple qu'accepter
    await expect(banner.getByRole('button', { name: 'Tout refuser' })).toBeVisible()
    await expect(banner.getByRole('button', { name: 'Tout accepter' })).toBeVisible()
    // Aucun iframe tiers avant consentement
    expect(await page.locator('iframe[src*="twitch.tv"], iframe[src*="youtube"]').count()).toBe(0)
    await banner.getByRole('button', { name: 'Tout refuser' }).click()
    await expect(banner).toBeHidden()
  })

  test('en-têtes de sécurité et CSP', async ({ request }) => {
    const res = await request.get('/')
    expect(res.headers()['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(res.headers()['x-content-type-options']).toBe('nosniff')
  })

  test('404 aquarium avec poisson cliquable', async ({ page }) => {
    await page.goto('/cette-page-nexiste-pas')
    await expect(page.getByText('Le poisson de cette page s’est échappé')).toBeVisible()
    await page.getByRole('link', { name: /Rattraper le poisson/ }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('pages légales accessibles depuis le pied de page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Tout refuser' }).click()
    await page.getByRole('link', { name: 'Mentions légales' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mentions légales')
    await expect(page.getByText('Pages juridiques gérées par Reads Records')).toBeVisible()
  })

  test('sitemap et robots', async ({ request }) => {
    expect((await request.get('/sitemap.xml')).ok()).toBe(true)
    expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /admin')
  })
})
