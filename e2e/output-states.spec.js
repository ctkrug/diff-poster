import { expect, test } from "@playwright/test";

// jsdom-based unit tests check the `hidden` DOM attribute, but jsdom never
// computes CSS, so it can't catch an author stylesheet rule (e.g. an
// explicit `display: flex`) overriding the browser's default
// `[hidden] { display: none }` UA rule. Only a real rendered page can.
async function isVisible(page, id) {
  return page.locator(`#${id}`).isVisible();
}

test("only the empty-state message is visible on first load", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#output-empty")).toBeVisible();
  expect(await isVisible(page, "output-error")).toBe(false);
  expect(await isVisible(page, "output-canvas")).toBe(false);
  expect(await isVisible(page, "output-actions")).toBe(false);
});

test("only the error message is visible after an invalid generate", async ({ page }) => {
  await page.goto("/");
  await page.fill("#before-input", "const x = 1;");
  await page.click("#generate-btn");

  await expect(page.locator("#output-error")).toBeVisible();
  expect(await isVisible(page, "output-empty")).toBe(false);
  expect(await isVisible(page, "output-canvas")).toBe(false);
  expect(await isVisible(page, "output-actions")).toBe(false);
});

test("only the canvas and actions are visible after a valid generate", async ({ page }) => {
  await page.goto("/");
  await page.fill("#before-input", "const x = 1;");
  await page.fill("#after-input", "const x = 2;");
  await page.click("#generate-btn");

  await expect(page.locator("#output-canvas")).toBeVisible();
  await expect(page.locator("#output-actions")).toBeVisible();
  expect(await isVisible(page, "output-empty")).toBe(false);
  expect(await isVisible(page, "output-error")).toBe(false);
});

test("no viewport overflows horizontally after a generate", async ({ page }) => {
  await page.goto("/");
  await page.fill("#before-input", "function greet(name) {\n  return 'hi ' + name;\n}");
  await page.fill("#after-input", "function greet(name) {\n  return `hello, ${name}!`;\n}");
  await page.click("#generate-btn");
  await page.waitForTimeout(200);

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
});

test("prefers-reduced-motion disables the ink-blot reveal animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.fill("#before-input", "const x = 1;");
  await page.fill("#after-input", "const x = 2;");
  await page.click("#generate-btn");

  const animationName = await page.evaluate(
    () => getComputedStyle(document.querySelector(".output-canvas")).animationName,
  );
  expect(animationName).toBe("none");
});

test("repeated generate cycles produce no console errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");
  await page.fill("#before-input", "const x = 1;");
  await page.fill("#after-input", "const x = 2;");

  for (let i = 0; i < 20; i++) {
    await page.click("#generate-btn");
  }

  expect(errors).toEqual([]);
});
