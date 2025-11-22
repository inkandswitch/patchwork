import { describe, it, expect } from "vitest";
import { at, isDynamic } from "../utils";

describe("at()", () => {
  it("should mark a numeric segment as dynamic", () => {
    const dynamic = at(0);

    expect(dynamic).toEqual({ __dynamic: true, value: 0 });
    expect(isDynamic(dynamic)).toBe(true);
  });

  it("should mark an object segment as dynamic", () => {
    const whereClause = { id: "abc" };
    const dynamic = at(whereClause);

    expect(dynamic).toEqual({ __dynamic: true, value: whereClause });
    expect(isDynamic(dynamic)).toBe(true);
  });

  it("should mark a range segment as dynamic", () => {
    const range = [10, 20];
    const dynamic = at(range);

    expect(dynamic).toEqual({ __dynamic: true, value: range });
    expect(isDynamic(dynamic)).toBe(true);
  });
});

describe("isDynamic()", () => {
  it("should return true for dynamic segments", () => {
    expect(isDynamic(at(0))).toBe(true);
    expect(isDynamic(at({ id: "x" }))).toBe(true);
    expect(isDynamic(at([1, 2]))).toBe(true);
  });

  it("should return false for non-dynamic values", () => {
    expect(isDynamic(0)).toBe(false);
    expect(isDynamic("string")).toBe(false);
    expect(isDynamic({ id: "x" })).toBe(false);
    expect(isDynamic([1, 2])).toBe(false);
    expect(isDynamic(null)).toBe(false);
    expect(isDynamic(undefined)).toBe(false);
  });

  it("should return false for objects without __dynamic", () => {
    expect(isDynamic({ value: 0 })).toBe(false);
    expect(isDynamic({ __dynamic: false, value: 0 })).toBe(false);
  });
});
