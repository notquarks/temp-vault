import { describe, expect, it } from "bun:test";
import {
  createShareCapability,
  hashShareCapability,
  safeShareCapabilityEquals,
} from "../lib/share-access";

describe("share capabilities", () => {
  it("creates high-entropy capabilities and hashes them", () => {
    const capability = createShareCapability();
    expect(capability.length).toBeGreaterThan(30);
    expect(hashShareCapability(capability)).not.toBe(capability);
    expect(safeShareCapabilityEquals(hashShareCapability(capability), capability)).toBe(true);
  });

  it("rejects missing, altered, and unrelated capabilities", () => {
    const capability = createShareCapability();
    const hash = hashShareCapability(capability);
    expect(safeShareCapabilityEquals(hash, undefined)).toBe(false);
    expect(safeShareCapabilityEquals(hash, `${capability}x`)).toBe(false);
    expect(safeShareCapabilityEquals(hash, createShareCapability())).toBe(false);
  });
});
