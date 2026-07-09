import { expect, test } from "@playwright/test";

// jsdom's a11y unit tests check DOM structure (tab order via document
// position, ARIA attributes) but can't drive real keyboard focus or read
// computed styles, so they can't confirm focus is actually *visible* or
// that the whole paste-to-download flow is reachable without a mouse.
const FOCUSABLE_IDS = [
  "before-input",
  "after-input",
  "language-select",
  "generate-btn",
  "copy-btn",
  "download-btn",
];

async function activeElementHasVisibleFocusRing(page) {
  return page.evaluate(() => {
    const style = getComputedStyle(document.activeElement);
    return style.outlineStyle !== "none" || style.boxShadow !== "none";
  });
}

test("completes the full paste-to-download flow using only the keyboard", async ({ page }) => {
  await page.goto("/");

  await page.locator("#before-input").focus();
  await page.keyboard.type("function greet(name) {\n  return 'hi ' + name;\n}");
  await page.keyboard.press("Tab");
  await page.keyboard.type("function greet(name) {\n  return `hello, ${name}!`;\n}");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement.id)).toBe("language-select");

  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement.id)).toBe("generate-btn");
  await page.keyboard.press("Enter");

  await expect(page.locator("#output-canvas")).toBeVisible();
  await expect(page.locator("#output-actions")).toBeVisible();

  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement.id)).toBe("copy-btn");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement.id)).toBe("download-btn");
});

test("every focusable control shows a visible focus ring while tabbing", async ({ page }) => {
  await page.goto("/");
  await page.fill("#before-input", "const x = 1;");
  await page.fill("#after-input", "const x = 2;");
  await page.click("#generate-btn");

  // Click the first control directly to establish a known starting point,
  // then Tab through the rest in the same order a keyboard user would.
  await page.click("#before-input");
  expect(
    await activeElementHasVisibleFocusRing(page),
    "#before-input should show a focus ring",
  ).toBe(true);
  for (const id of FOCUSABLE_IDS.slice(1)) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement.id)).toBe(id);
    expect(await activeElementHasVisibleFocusRing(page), `#${id} should show a focus ring`).toBe(
      true,
    );
  }
});
