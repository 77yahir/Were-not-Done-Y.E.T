import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Remove the page a test rendered, so the next test starts fresh
afterEach(() => {
  cleanup();
});
