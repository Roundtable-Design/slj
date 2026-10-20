import { decideTftwSubscribeAction } from "@/lib/mailchimp";

describe("decideTftwSubscribeAction", () => {
  it("adds only brand-new addresses (404)", () => {
    expect(
      decideTftwSubscribeAction({ httpStatus: 404 })
    ).toBe("add_new");
  });

  it("leaves subscribed / pending alone", () => {
    expect(
      decideTftwSubscribeAction({
        httpStatus: 200,
        memberStatus: "subscribed",
      })
    ).toBe("already_subscribed");
    expect(
      decideTftwSubscribeAction({
        httpStatus: 200,
        memberStatus: "pending",
      })
    ).toBe("already_subscribed");
  });

  it("never resubscribes past opt-outs (James Oct 2026)", () => {
    for (const memberStatus of [
      "unsubscribed",
      "cleaned",
      "archived",
      "transactional",
      "weird",
      "",
      null,
    ]) {
      expect(
        decideTftwSubscribeAction({ httpStatus: 200, memberStatus })
      ).toBe("skipped");
    }
  });

  it("surfaces other HTTP errors", () => {
    expect(
      decideTftwSubscribeAction({ httpStatus: 403, memberStatus: "subscribed" })
    ).toBe("error");
  });
});
