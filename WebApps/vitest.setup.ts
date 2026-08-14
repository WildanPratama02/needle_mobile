import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement the Pointer Events API Radix's Select/Dropdown/Tooltip
// primitives rely on for open/close and scroll behavior — no-op polyfills so
// interacting with them in tests doesn't throw. Not app behavior, purely a
// jsdom gap: https://github.com/radix-ui/primitives/issues/1822
if (typeof window !== "undefined") {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
}
