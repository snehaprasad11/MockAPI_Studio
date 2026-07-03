import { describe, expect, it } from "vitest";

import { parseJsonValue } from "./mappers";

describe("mapper helpers", () => {
  it("parses JSON strings from MySQL JSON columns", () => {
    expect(parseJsonValue('{"name":"Launch Kit"}')).toEqual({ name: "Launch Kit" });
  });

  it("returns already parsed values unchanged", () => {
    const value = [{ id: 1 }];

    expect(parseJsonValue(value)).toBe(value);
  });
});
