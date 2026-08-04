import {
  magicLinkEmailHtml,
  magicLinkEmailSubject,
  magicLinkEmailText,
} from "@/lib/auth-email";

describe("auth email branding", () => {
  it("uses the course title in the subject", () => {
    expect(magicLinkEmailSubject()).toBe(
      "Sign in to Simplicity Love & Justice"
    );
  });

  it("renders branded html with the sign-in url", () => {
    const url = "https://slj.talksfromthewarehouse.co.uk/api/auth/callback/resend?token=abc";
    const html = magicLinkEmailHtml({ url });
    expect(html).toContain("A Discussion Course");
    expect(html).toContain("Simplicity Love &amp; Justice");
    expect(html).toContain("James Odgers");
    expect(html).toContain("Sign in to the course");
    expect(html).toContain(url);
    expect(html).toContain("private notes");
  });

  it("renders plain text with the sign-in url", () => {
    const url = "https://example.com/auth";
    const text = magicLinkEmailText({ url });
    expect(text).toContain("Simplicity Love & Justice");
    expect(text).toContain(url);
  });
});
