import { describe, expect, it } from "vitest";
import { parseEntryParams } from "./entry-params";

describe("parseEntryParams", () => {
  it("reads safe QR and NFC parameters", () => {
    expect(parseEntryParams("?storeId=liji-main&merchantId=liji&scene=nfc-8")).toEqual({ storeId: "liji-main", merchantId: "liji", scene: "nfc-8" });
  });
  it("drops unsafe values", () => expect(parseEntryParams("?storeId=%3Cscript%3E").storeId).toBeUndefined());
});
