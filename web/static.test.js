import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("static app has core accessibility landmarks and labels", async () => {
  const html = await fs.readFile("web/index.html", "utf8");
  assert.match(html, /<main class="shell"/);
  assert.match(html, /<aside class="setup" aria-label="Trip setup"/);
  assert.match(html, /<nav class="tabs" aria-label="Wanderlore sections"/);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-describedby="setupHint"/);
  assert.match(html, /<fieldset>[\s\S]*<legend>Interests<\/legend>/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tab" aria-selected="true"/);
  assert.match(html, /role="tabpanel" aria-live="polite"/);
  assert.match(html, /problem-line/);
  assert.match(html, /answers the challenge directly/);
  assert.match(html, /aria-labelledby="tab-smart"/);
  assert.match(html, /<script type="module" src="\/app.js"><\/script>/);
});

test("static app preserves security and accessible focus styles", async () => {
  const [css, app, dom, views] = await Promise.all([
    fs.readFile("web/app.css", "utf8"),
    fs.readFile("web/app.js", "utf8"),
    fs.readFile("web/js/dom.js", "utf8"),
    fs.readdir("web/js/views")
  ]);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(max-width: 860px\)/);
  assert.match(css, /\.sr-only/);
  assert.doesNotMatch(css, /outline:\s*none/);
  assert.match(app, /initNavigation/);
  assert.match(dom, /escapeHtml/);
  assert.match(app, /setTab\("smart"\)/);
  assert.match(await fs.readFile("web/js/tabKeys.js", "utf8"), /ArrowRight|ArrowLeft|Home|End/);
  assert.ok(views.length >= 7);
  assert.doesNotMatch(`${app}\n${dom}`, /error\.stack/);
});

test("frontend modules keep one responsibility per screen", async () => {
  const expected = ["challenge.js", "common.js", "detail.js", "events.js", "hidden.js", "passport.js", "smart.js", "threads.js"];
  const views = await fs.readdir("web/js/views");
  assert.deepEqual(views.sort(), expected.sort());
});
