import { test, expect } from './checkoutGuard';
import { publicApiAnswer } from './doors';

// Business Name Generator door. R2 + R5: BNG has no availability call of its own; it lists what
// suggest-domains returns for a generated name. So every domain it offers must be free per the public API.
// Generated names differ on every run (expected), so the test reads them from the response, never hard-codes them.

test('domains offered by BNG are on the page and free per the public API', async ({ page, request }) => {
  test.setTimeout(60_000); // name generation is AI-backed; one headed run took over 30 s
  await page.goto('/tools/business-name-generator');
  const suggestions = page.waitForResponse((r) => r.url().includes('/domain-search/v2/suggest-domains'), {
    timeout: 45_000,
  });
  const prompt = 'A small bakery that sells sourdough bread';
  const box = page.getByPlaceholder(/catering company/);
  const generate = page.getByRole('button', { name: 'Generate Names', exact: true });
  // Precondition: the form is on screen and usable. Not enough on its own: Wix renders the HTML on
  // the server, so the box is visible before the page's scripts handle input (seen in our runs).
  await expect(box).toBeVisible();
  await expect(box).toBeEditable();
  await expect(generate).toBeEnabled();
  // So the action is retried until its outcome (the results page) appears, as in typeAndSubmit.
  await expect(async () => {
    await box.fill(prompt);
    await expect(box).toHaveValue(prompt, { timeout: 1000 });
    await generate.click({ timeout: 3000 });
    await expect(page).toHaveURL(/\/domain\/result\/bng\?query=/, { timeout: 5000 });
  }).toPass({ timeout: 30_000 });

  const res = await suggestions;
  expect(res.status()).toBe(200);
  const offered: string[] = (await res.json()).suggestions.map((s: { domain: string }) => s.domain);
  expect(offered.length).toBeGreaterThan(0);

  const list = page.locator('[data-hook="recommendations-content-list"]');
  await expect(list).toContainText(offered[0]);

  // 2 public API calls: enough to catch "offered but taken" without spending the budget.
  for (const domain of offered.slice(0, 2)) {
    expect.soft((await publicApiAnswer(request, domain)).available, `${domain} offered by BNG but not free`).toBe(true);
  }
});
