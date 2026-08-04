"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { prepareSignUp } from "@/lib/actions/signup";
import { sanitizeReturnTo } from "@/lib/navigation";

interface SignUpFormProps {
  returnTo: string;
}

export function SignUpForm({ returnTo }: SignUpFormProps) {
  const safeReturnTo = sanitizeReturnTo(returnTo);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountExists, setAccountExists] = useState(false);

  async function submitSignUp() {
    setError(null);
    setAccountExists(false);
    setSending(true);
    try {
      const prepared = await prepareSignUp({
        email,
        firstName,
        lastName,
      });
      if (!prepared.ok) {
        setError(prepared.error);
        setAccountExists(prepared.code === "account_exists");
        return;
      }

      const result = await signIn("resend", {
        email: prepared.email,
        redirect: false,
        callbackUrl: safeReturnTo,
      });
      if (result?.error) {
        setError(
          "We could not send the sign-up email right now. Please check your email address and try again."
        );
        return;
      }
      setSent(true);
    } catch {
      setError(
        "We could not send the sign-up email right now. Please check your email address and try again."
      );
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitSignUp();
  }

  const signInHref = `/auth/sign-in?returnTo=${encodeURIComponent(safeReturnTo)}`;

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="firstName"
              className="slj-muted mb-1.5 block font-sans text-sm"
            >
              First name{" "}
              <span className="slj-faint font-normal">(optional)</span>
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              disabled={sending || sent}
              className="slj-input w-full px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="slj-muted mb-1.5 block font-sans text-sm"
            >
              Last name{" "}
              <span className="slj-faint font-normal">(optional)</span>
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              disabled={sending || sent}
              className="slj-input w-full px-3 py-2.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="slj-muted mb-1.5 block font-sans text-sm"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            disabled={sending || sent}
            className="slj-input w-full px-3 py-2.5 text-sm"
          />
        </div>

        {error && !sent ? (
          <div className="space-y-2" role="alert">
            <p className="font-sans text-sm text-[var(--slj-text)]">{error}</p>
            {accountExists ? (
              <p className="font-sans text-sm">
                <Link
                  href={signInHref}
                  className="text-[var(--slj-text)] underline underline-offset-2 hover:opacity-80"
                >
                  Go to sign in
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}

        {sent ? (
          <div className="space-y-3">
            <p className="font-sans text-base font-medium text-[var(--slj-text)]">
              Check your email
            </p>
            <p className="slj-muted font-sans text-sm leading-6">
              We emailed{" "}
              <span className="font-medium text-[var(--slj-text)]">{email}</span>{" "}
              a link to finish creating your account.
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setError(null);
              }}
              className="slj-muted font-sans text-sm underline underline-offset-4 hover:text-[var(--slj-text)]"
            >
              Use a different email
            </button>
            <button
              type="button"
              onClick={submitSignUp}
              disabled={sending}
              className="ml-4 slj-muted font-sans text-sm underline underline-offset-4 hover:text-[var(--slj-text)] disabled:opacity-50"
            >
              {sending ? "Sending..." : "Resend email"}
            </button>
          </div>
        ) : (
          <button
            type="submit"
            className="slj-button w-full px-3 py-2.5 text-sm"
            disabled={sending}
          >
            {sending ? "Sending..." : "Create account"}
          </button>
        )}
      </form>

      <p className="slj-muted font-sans text-sm">
        Already have an account?{" "}
        <Link
          href={signInHref}
          className="text-[var(--slj-text)] underline underline-offset-2 hover:opacity-80"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
