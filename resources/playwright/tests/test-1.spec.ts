import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://hzd.chromosoft.de/login');
  await page.locator('input[name="username"]').click();
  await page.locator('input[name="username"]').fill('<username>');
  await page.locator('input[name="password"]').click();
  await page.locator('input[name="password"]').fill('<password>');
  await page.getByRole('button', { name: 'anmelden' }).click();
  await page.getByRole('link', { name: 'Suche' }).click();
  await page.getByRole('link', { name: 'Powersuche' }).click();
  await page.locator('input[name="fertile"]').check();
  await page.getByRole('listitem').filter({ hasText: 'Befunde & Berichte' }).click();
  await page.locator('#fld_287').check();
  await page.locator('#fld_282').check();
  await page.getByRole('img').nth(3).click();
  await page.locator('input[name="chk_all_sel_reslts"]').check();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('img', { name: 'speichere ausgewählte als' }).nth(1).click();
  const download = await downloadPromise;
  await page.getByRole('link', { name: 'abmelden' }).click();
});