import test from "node:test";
import assert from "node:assert/strict";

const { buildTawkPage, cleanAttributes, parseTawkEvent } = await import("../lib/page.js");

const base = { propertyId: "6ae86b25ee2a573c33d327e9", widgetId: "1k6du52tl" };

test("the page loads the right widget and opens it by default", () => {
  const html = buildTawkPage(base);
  assert.match(html, /embed\.tawk\.to\/6ae86b25ee2a573c33d327e9\/1k6du52tl/);
  assert.match(html, /Tawk_API\.maximize\(\)/);
  assert.doesNotMatch(buildTawkPage({ ...base, autoOpen: false }), /maximize\(\)/);
});

test("IDs that are not tawk.to IDs are refused", () => {
  assert.throws(() => buildTawkPage({ ...base, propertyId: 'x"/><script>' }));
  assert.throws(() => buildTawkPage({ ...base, widgetId: "" }));
});

test("a hostile visitor name cannot close the script element", () => {
  const html = buildTawkPage({ ...base, visitor: { name: "</script><script>alert(1)</script>" } });
  assert.equal((html.match(/<\/script>/g) ?? []).length, 2, "only the page's own two scripts close");
  assert.match(html, /\\u003c\/script>/);
});

test("background and language only accept safe values", () => {
  assert.match(buildTawkPage({ ...base, background: "#151515", language: "it" }), /background:#151515.*|lang="it"/s);
  const h = buildTawkPage({ ...base, background: "red;}</style><script>x()</script>", language: '"><x' });
  assert.match(h, /background:transparent/);
  assert.match(h, /lang="en"/);
});

test("attributes follow tawk.to's rules instead of failing the call", () => {
  assert.deepEqual(cleanAttributes({ "piano-pro": "si", "bad key": "x", vuoto: " ", lungo: "a".repeat(300) }), { "piano-pro": "si", lungo: "a".repeat(255) });
});

test("only our own events are accepted from the page", () => {
  assert.deepEqual(parseTawkEvent('{"type":"ready","status":"online"}'), { type: "ready", status: "online" });
  assert.equal(parseTawkEvent('{"type":"evil"}'), null);
  assert.equal(parseTawkEvent("not json"), null);
  assert.equal(parseTawkEvent({ type: "ready" }), null);
});
