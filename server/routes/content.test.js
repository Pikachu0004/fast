import test from "node:test";
import assert from "node:assert/strict";
import { heritageNote, storyMode } from "./content.js";

test("heritage route uses Gemini output when configured", async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = "test-key";
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: "Heritage note generated from provided facts." }]
            }
          }
        ]
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );

  try {
    const result = await heritageNote({
      city: "New Delhi",
      tripDay: 2,
      tripDaysTotal: 4,
      interests: ["heritage"],
      place: {
        id: "place-1",
        name: "Old Fort",
        category: "heritage",
        tags: { historic: "fort" }
      }
    });
    assert.equal(result.source, "gemini");
    assert.match(result.note, /Heritage note generated/);
  } finally {
    process.env.GEMINI_API_KEY = originalKey;
    globalThis.fetch = originalFetch;
  }
});

test("story route uses Gemini transcript output when configured", async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = "test-key";
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: "Story transcript generated from provided facts." }]
            }
          }
        ]
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );

  try {
    const result = await storyMode({
      city: "New Delhi",
      tripDay: 2,
      tripDaysTotal: 4,
      interests: ["heritage"],
      place: {
        id: "place-2",
        name: "City Museum",
        category: "heritage",
        tags: { tourism: "museum" }
      }
    });
    assert.equal(result.source, "gemini");
    assert.match(result.transcript, /Story transcript generated/);
  } finally {
    process.env.GEMINI_API_KEY = originalKey;
    globalThis.fetch = originalFetch;
  }
});

test("content routes fail safely when Gemini is unavailable", async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  await assert.rejects(
    heritageNote({
      city: "New Delhi",
      tripDay: 2,
      tripDaysTotal: 4,
      interests: ["heritage"],
      place: {
        id: "place-3",
        name: "Old Fort",
        category: "heritage",
        tags: { historic: "fort" }
      }
    }),
    (error) => error.code === "GEMINI_NOT_CONFIGURED" && error.status === 503
  );
  process.env.GEMINI_API_KEY = originalKey;
});
