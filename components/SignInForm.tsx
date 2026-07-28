"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { sanitizeReturnTo } from "@/lib/navigation";

interface SignInFormProps {
  returnTo: string;
  initialError?: string | null;
  initialSent?: boolean;
  allowDevLogin?: boolean;
}

export function SignInForm({
  returnTo,
  initialError = null,
  initialSent = false,
  allowDevLogin = false,
}: SignInFormProps) {
  const safeReturnTo = sanitizeReturnTo(returnTo);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(initialSent);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [devSecret, setDevSecret] = useState("");
  const [devSigningIn, setDevSigningIn] = useState(false);

  async function sendLink() {
    setError(null);
    setSending(true);
    try {
      const result = await signIn("resend", {
        email: email.trim(),
        redirect: false,
        callbackUrl: safeReturnTo,
      });
      if (result?.error) {
        setError(
          "We could not send the sign-in email right now. Please check your email address and try again."
        );
        return;
      }
      setSent(true);
    } catch {
      setError(
        "We could not send the sign-in email right now. Please check your email address and try again."
      );
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendLink();
  }

  async function handleDevLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDevSigningIn(true);
    try {
      const result = await signIn("e2e", {
        email: email.trim(),
        secret: devSecret,
        redirect: false,
        callbackUrl: safeReturnTo,
      });
      if (result?.error) {
        setError("Dev sign-in failed. Check email and secret.");
        return;
      }
      window.location.href = safeReturnTo;
    } catch {
      setError("Dev sign-in failed.");
    } finally {
      setDevSigningIn(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-5">
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
          </div>
        ) : null}

        {sent ? (
          <div className="space-y-3">
            <p className="font-sans text-base font-medium text-[var(--slj-text)]">
              Check your email
            </p>
            <p className="slj-muted font-sans text-sm leading-6">
              We emailed{" "}
              <span className="font-medium text-[var(--slj-text)]">{email}</span>.
              Open the message and click the sign-in link.
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
              onClick={sendLink}
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
            {sending ? "Sending..." : "Send sign-in email"}
          </button>
        )}
      </form>

      {allowDevLogin ? (
        <form
          onSubmit={handleDevLogin}
          className="space-y-3 border-t border-[var(--slj-border)] pt-5"
        >
          <p className="slj-faint font-sans text-xs uppercase tracking-[0.18em]">
            Local / staging test sign-in
          </p>
          <input
            type="password"
            value={devSecret}
            onChange={(e) => setDevSecret(e.target.value)}
            placeholder="E2E secret"
            className="slj-input w-full px-3 py-2.5 text-sm"
            aria-label="E2E secret"
          />
          <button
            type="submit"
            className="slj-button w-full px-3 py-2.5 text-sm"
            disabled={devSigningIn || !email.trim()}
          >
            {devSigningIn ? "Signing in..." : "Sign in with test secret"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
