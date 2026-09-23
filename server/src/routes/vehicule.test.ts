import { describe, expect, it } from "@jest/globals";
import { pickDefined } from "./vehicule.ts";

describe("pickDefined", () => {
  it("drops keys whose value is undefined, keeping null and other falsy values", () => {
    expect(pickDefined({ model: undefined, dataInstalarii: "2026-01-01", normaLuni: 0 })).toEqual({
      dataInstalarii: "2026-01-01",
      normaLuni: 0,
    });
    expect(pickDefined({ model: null, dataInstalarii: undefined })).toEqual({ model: null });
  });

  it("keeps every key when nothing is undefined", () => {
    const fields = { model: "Michelin", dataInstalarii: "2026-01-01", normaLuni: 12 };
    expect(pickDefined(fields)).toEqual(fields);
  });

  it("returns an empty object when everything is undefined", () => {
    expect(pickDefined({ model: undefined, normaLuni: undefined })).toEqual({});
  });
});
