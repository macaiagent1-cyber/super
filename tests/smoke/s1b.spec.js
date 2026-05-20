import { expect, test } from '@playwright/test';

async function readFps(page) {
  const text = await page.locator('#hud-root').textContent();
  const match = text.match(/FPS\s+(\d+)/);
  return match ? Number(match[1]) : 0;
}

async function readBackend(page) {
  const text = await page.locator('#hud-root').textContent();
  return text.includes('webgpu-high') ? 'webgpu-high' : 'webgl2-low';
}

async function expectFpsAtLeast(page, minimum) {
  await expect.poll(() => readFps(page), { timeout: 5000 }).toBeGreaterThanOrEqual(minimum);
}

async function clickTitlePlay(page) {
  await page.locator('.title-play').click();
}

test('S1B boots 3x3 city on default backend without console errors', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/?slice=S1B&seed=42');
  await clickTitlePlay(page);
  await expect(page.locator('#hud-root')).toContainText(/webgpu-high|webgl2-low/, { timeout: 8000 });
  await page.waitForTimeout(2500);
  const backend = await readBackend(page);
  // Headless Chromium can fall back to WebGL2, so gate against the reported tier.
  await expectFpsAtLeast(page, backend === 'webgpu-high' ? 55 : 30);
  expect(errors).toEqual([]);
});

test('S1B forced WebGL2 stays above low-tier smoke budget', async ({ page }) => {
  await page.goto('/?slice=S1B&seed=42&forceWebGL2=1');
  await clickTitlePlay(page);
  await expect(page.locator('#hud-root')).toContainText('webgl2-low', { timeout: 8000 });
  await page.waitForTimeout(2500);
  await expectFpsAtLeast(page, 30);
});
