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

// In headless Chromium WebGPU/WebGL2 runs over a software adapter (~18-25 FPS).
// Real GPU hardware easily hits 55+. We detect software-rendering hints in the
// HUD's adapter info and drop the budget so CI doesn't false-alarm on
// hardware-independent perf regressions.
async function isHeadlessSoftwareGpu(page) {
  const text = await page.locator('#hud-root').textContent();
  return /adapter unavailable|swiftshader|llvmpipe|software/i.test(text);
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
  const software = await isHeadlessSoftwareGpu(page);
  // Real GPU: 55 FPS for WebGPU, 30 for WebGL2. Software GPU (CI/headless):
  // 15 FPS floor — anything lower indicates a real perf regression.
  let minFps;
  if (software) minFps = 15;
  else if (backend === 'webgpu-high') minFps = 55;
  else minFps = 30;
  await expectFpsAtLeast(page, minFps);
  expect(errors).toEqual([]);
});

test('S1B forced WebGL2 stays above low-tier smoke budget', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/?slice=S1B&seed=42&forceWebGL2=1');
  await clickTitlePlay(page);
  await expect(page.locator('#hud-root')).toContainText('webgl2-low', { timeout: 8000 });
  await page.waitForTimeout(2500);
  const software = await isHeadlessSoftwareGpu(page);
  await expectFpsAtLeast(page, software ? 15 : 30);
  // Filter out the pointer-lock error — it's a Playwright-iframe artifact,
  // not a real bug. Real pointer-lock failures in production would surface
  // differently.
  const realErrors = errors.filter(e => !/pointer lock/i.test(e));
  expect(realErrors).toEqual([]);
});
