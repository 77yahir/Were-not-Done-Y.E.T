import { describe, expect, it } from "vitest";
import {
  isValidUsername,
  isValidAvatar
} from "../utils/profileValidation";

describe("Username validation", () => {
  it("accepts a valid username", () => {
    expect(isValidUsername("boardgamer123")).toBe(true);
  });

  it("rejects a username shorter than 3 characters", () => {
    expect(isValidUsername("ab")).toBe(false);
  });
});

describe("Avatar validation", () => {
  it("accepts a supported avatar", () => {
    expect(isValidAvatar("fox")).toBe(true);
  });

  it("rejects an unsupported avatar", () => {
    expect(isValidAvatar("dragon")).toBe(false);
  });
});
