// src/state/app-state.js reads `window.location` at module-eval time.
// This project has no test infrastructure and is browser-only; importing
// any module that transitively pulls in app-state.js in Node requires a
// minimal window/document stand-in. Import this file FIRST in any test
// that touches src/state or src/core/selectors.js.
globalThis.window = globalThis.window || {
  location: { hash: "", search: "" },
  dispatchEvent: () => {},
};
globalThis.document = globalThis.document || {
  querySelector: () => null,
};
