import test from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { handleApiRequest } from "./api.js";

test("smart picks route resolves with deterministic mocked live data", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("nominatim")) {
      return jsonResponse([{ display_name: "New Delhi, Delhi, India", lat: "28.6", lon: "77.2" }]);
    }
    if (url.includes("open-meteo")) {
      return jsonResponse({ current: { weather_code: 3, temperature_2m: 31, time: "2026-07-04T12:00" } });
    }
    if (url.includes("overpass-api")) {
      return jsonResponse({
        elements: [
          { type: "node", id: 1, lat: 28.61, lon: 77.21, tags: { tourism: "museum", name: "City Museum" } },
          { type: "node", id: 2, lat: 28.62, lon: 77.22, tags: { historic: "monument", name: "Old Fort Marker" } }
        ]
      });
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  try {
    const response = await invoke({
      method: "POST",
      url: "/api/context/smart-picks",
      body: {
        city: "New Delhi",
        tripDay: 2,
        tripDaysTotal: 4,
        interests: ["food", "heritage", "art"],
        budget: "$$",
        recentCategoriesShown: []
      }
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.city.city, "New Delhi");
    assert.equal(response.body.picks.length, 2);
    assert.equal(response.body.hiddenGems.length, 2);
    assert.equal(response.body.sources[0], "Nominatim");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

function invoke({ method, url, headers = {}, body }) {
  const request = new PassThrough();
  request.method = method;
  request.url = url;
  request.headers = headers;
  request.socket = { remoteAddress: "127.0.0.1" };

  const response = {
    status: 0,
    headers: {},
    payload: "",
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
    },
    writeHead(status, headersToWrite = {}) {
      this.status = status;
      for (const [key, value] of Object.entries(headersToWrite)) this.setHeader(key, value);
    },
    end(chunk = "") {
      this.payload += chunk;
      this.resolve({
        status: this.status,
        headers: this.headers,
        body: this.payload ? JSON.parse(this.payload) : null
      });
    }
  };

  const done = new Promise((resolve) => {
    response.resolve = resolve;
  });
  handleApiRequest(request, response);
  request.end(body === undefined ? "" : JSON.stringify(body));
  return done;
}
