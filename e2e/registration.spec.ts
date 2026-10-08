import { expect, test, type Page } from '@playwright/test'

const unique = () => Math.floor(Math.random() * 1e7).toString().padStart(7, '0')

async function fillRequired(page: Page, phone: string, email: string) {
  await page.getByLabel('Full name').fill('E2E Tester')
  await page.getByText('Female', { exact: true }).click()
  await page.getByLabel('Institution', { exact: true }).selectOption('University of Ilorin')
  await page.getByLabel('Department').fill('Computer Science')
  await page.getByLabel('Level', { exact: true }).selectOption('100 Level')
  await page.getByLabel('Phone (WhatsApp)').fill(phone)
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByText('No', { exact: true }).click()
  await page.getByRole('checkbox').nth(0).check()
  await page.getByRole('checkbox').nth(1).check()
}

// The server treats sub-3-second submits as bots; real people are never that fast.
const submitLikeAPerson = async (page: Page) => {
  await page.waitForTimeout(3_100)
  await page.getByRole('button', { name: 'Get my ticket' }).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/?src=e2e')
  await expect(page.getByLabel('Full name')).toBeVisible()
})

test('happy path: register and see the raffle ticket', async ({ page }) => {
  const id = unique()
  await fillRequired(page, `0905${id}`, `e2e-${id}@example.invalid`)
  await submitLikeAPerson(page)
  await expect(page.getByRole('heading', { name: "You're plugged in, E2E!" })).toBeVisible()
  await expect(page.getByText('E2E Tester')).toBeVisible()
  await expect(page.getByLabel(/^Your raffle code is [2-9A-HJKMNP-Z]( [2-9A-HJKMNP-Z]){3}$/)).toBeVisible()

  // Back to home: poster again, with an empty form ready for the next person
  await page.getByRole('button', { name: '← Back to home' }).click()
  await expect(page.getByRole('heading', { name: 'Register now' })).toBeVisible()
  await expect(page.getByLabel('Full name')).toHaveValue('')
})

test('bus = Yes reveals area and address, which become required', async ({ page }) => {
  await expect(page.getByLabel('Area')).toHaveCount(0)
  await page.getByText('Yes', { exact: true }).click()
  await expect(page.getByLabel('Area')).toBeVisible()
  await expect(page.getByLabel('Address')).toBeVisible()
  await page.getByRole('button', { name: 'Get my ticket' }).click()
  await expect(page.getByText('Tell us your area, e.g. Tanke')).toBeVisible()
  await expect(page.getByText('Add your address so we can plan the bus')).toBeVisible()
})

test('duplicate phone shows "already registered" and never the code', async ({ page }) => {
  const id = unique()
  await fillRequired(page, `0906${id}`, `e2e-a-${id}@example.invalid`)
  await submitLikeAPerson(page)
  const code = (await page.getByLabel(/^Your raffle code is/).innerText()).trim()

  await page.goto('/?src=e2e')
  await fillRequired(page, `+234 906 ${id.slice(0, 3)} ${id.slice(3)}`, `e2e-b-${id}@example.invalid`)
  await submitLikeAPerson(page)
  await expect(page.getByRole('heading', { name: "You're already registered!" })).toBeVisible()
  expect(await page.content()).not.toContain(code)
})

test('answers survive a page refresh', async ({ page }) => {
  await page.getByLabel('Full name').fill('Refresh Survivor')
  await page.getByLabel('Department').fill('Law')
  await page.reload()
  await expect(page.getByLabel('Full name')).toHaveValue('Refresh Survivor')
  await expect(page.getByLabel('Department')).toHaveValue('Law')
})

test('closed and "opens soon" replace the form', async ({ page }) => {
  await page.route('**/api/status', (r) => r.fulfill({ json: { state: 'closed', opensAt: null } }))
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Registration is closed' })).toBeVisible()
  await expect(page.getByLabel('Full name')).toHaveCount(0)

  await page.route('**/api/status', (r) => r.fulfill({ json: { state: 'not_open', opensAt: '2026-10-13T08:00:00+01:00' } }))
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Registration opens soon' })).toBeVisible()
  await expect(page.getByText('Tuesday, 13 October')).toBeVisible()
})

test('privacy notice is linked from the consent and loads', async ({ page }) => {
  const [privacy] = await Promise.all([page.waitForEvent('popup'), page.getByRole('link', { name: 'Read the privacy notice' }).click()])
  await expect(privacy.getByRole('heading', { name: 'Privacy notice' })).toBeVisible()
  await expect(privacy.getByText('clcchurchmedia@gmail.com').first()).toBeVisible()
})
