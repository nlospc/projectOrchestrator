import test from "node:test";
import assert from "node:assert/strict";
import { debounce } from "../src/core/utils.js";

// P3: project-search and people-search input handlers re-render on every
// keystroke with no debounce. debounce() is the pure wrapper both handlers
// will use.

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("debounce only invokes the wrapped function once after rapid calls settle", async () => {
  let callCount = 0;
  let lastArg = null;
  const debounced = debounce((arg) => { callCount += 1; lastArg = arg; }, 20);

  debounced("a");
  debounced("b");
  debounced("c");
  assert.equal(callCount, 0, "should not invoke synchronously");

  await wait(60);
  assert.equal(callCount, 1, "should invoke exactly once after the delay settles");
  assert.equal(lastArg, "c", "should invoke with the arguments of the LAST call");
});

test("debounce invokes again for calls made after the previous delay settled", async () => {
  let callCount = 0;
  const debounced = debounce(() => { callCount += 1; }, 20);

  debounced();
  await wait(40);
  assert.equal(callCount, 1);

  debounced();
  await wait(40);
  assert.equal(callCount, 2, "a call after the previous debounce settled should trigger a new invocation");
});
