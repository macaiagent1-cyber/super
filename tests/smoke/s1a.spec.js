import { expect, test } from '@playwright/test';

test('S1A boots and exposes perf HUD on default backend', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/');
  await expect(page.locator('#hud-root')).toContainText(/webgpu-high|webgl2-low/, { timeout: 8000 });
  await expect(page.locator('#hud-root')).toContainText('FPS');
  expect(errors).toEqual([]);
});

test('S1A boots with forced WebGL2', async ({ page }) => {
  await page.goto('/?forceWebGL2=1');
  await expect(page.locator('#hud-root')).toContainText('webgl2-low', { timeout: 8000 });
});
