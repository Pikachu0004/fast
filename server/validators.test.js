import test from "node:test";
import assert from "node:assert/strict";
import { validateConnectionRequest, validateContext, validatePlaceContext } from "./validators.js";

test("validates and normalizes context input", () => {
  const result = validateContext({
    city: "  New   Delhi  ",
    tripDay: 2,
    tripDaysTotal: 4,
    interests: ["food", "food", "art"],
    budget: "$$",
    timeOfDay: "16:30",
    recentCategoriesShown: Array(20).fill("food")
  });
  assert.equal(result.city, "New Delhi");
  assert.deepEqual(result.interests, ["food", "art"]);
  assert.equal(result.timeOfDay, "16:30");
  assert.equal(result.recentCategoriesShown.length, 12);
});

test("rejects malicious and invalid context input", () => {
  assert.throws(() => validateContext({ city: "../etc/passwd", tripDay: 8, tripDaysTotal: 1, interests: ["food"] }), /tripDay/);
  assert.throws(() => validateContext({ city: "Delhi", tripDay: 1, tripDaysTotal: 2, interests: ["<script>"] }), /Unsupported interest/);
  assert.throws(() => validateContext({ city: "Delhi", tripDay: 3, tripDaysTotal: 2, interests: ["food"] }), /greater/);
});

test("bounds place tags to prevent payload bloat", () => {
  const tags = Object.fromEntries(Array.from({ length: 80 }, (_, index) => [`key${index}`, "x".repeat(20)]));
  const result = validatePlaceContext({
    city: "Delhi",
    tripDay: 1,
    tripDaysTotal: 2,
    interests: ["heritage"],
    place: { id: "p1", name: "Museum", category: "heritage", tags }
  });
  assert.equal(Object.keys(result.place.tags).length, 60);
});

test("validates connection requests", () => {
  assert.equal(validateConnectionRequest({
    city: "Delhi",
    hostId: "host-1",
    hostName: "Host",
    travelerName: "Ada",
    email: "ADA@EXAMPLE.COM",
    message: "I want to learn about the local experience."
  }).email, "ada@example.com");
  assert.throws(() => validateConnectionRequest({
    city: "Delhi",
    hostId: "host-1",
    hostName: "Host",
    travelerName: "A",
    email: "bad",
    message: "short"
  }), /travelerName/);
});
