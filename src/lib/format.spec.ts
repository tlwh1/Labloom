import { describe, expect, it } from "vitest";
import { formatBytes } from "./format";

describe("formatBytes", () => {
  it("returns 0 B for invalid inputs", () => {
    expect(formatBytes(NaN)).toBe("0 B");
    expect(formatBytes(-10)).toBe("0 B");
  });

  it("formats bytes and kilobytes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.00 KB");
  });

  it("formats megabytes with two decimals", () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB");
  });
});

