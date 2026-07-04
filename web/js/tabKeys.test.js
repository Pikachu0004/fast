import test from "node:test";
import assert from "node:assert/strict";
import { getNextTabIndex } from "./tabKeys.js";

test("tab keyboard helper cycles logically", () => {
  assert.equal(getNextTabIndex("ArrowRight", 0, 4), 1);
  assert.equal(getNextTabIndex("ArrowLeft", 0, 4), 3);
  assert.equal(getNextTabIndex("Home", 2, 4), 0);
  assert.equal(getNextTabIndex("End", 1, 4), 3);
  assert.equal(getNextTabIndex("Enter", 1, 4), -1);
});
