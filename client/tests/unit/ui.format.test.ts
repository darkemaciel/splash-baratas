import { describe, expect, test } from "bun:test";
import { formatClock, formatThousands } from "../../src/ui/format";

// specs/017-design-system-grotesco (contracts/ui-kit.md § ui/format.ts, FR-024): números com ponto
// de milhar e tempo em m:ss.

describe("formatThousands", () => {
  test.each([
    [0, "0"],
    [999, "999"],
    [1250, "1.250"],
    [12345, "12.345"],
    [1234567, "1.234.567"],
  ])("%p → %p", (value, expected) => {
    expect(formatThousands(value)).toBe(expected);
  });
});

describe("formatClock", () => {
  test.each([
    [0, "0:00"],
    [45_000, "0:45"],
    [59_999, "0:59"],
    [723_000, "12:03"],
    [-500, "0:00"],
  ])("%p ms → %p", (ms, expected) => {
    expect(formatClock(ms)).toBe(expected);
  });
});
