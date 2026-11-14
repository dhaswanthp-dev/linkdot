"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import { BrandLogo } from "@/components/brand/brand-logo";
import type { SceneController } from "@/components/scene/scene-controller";
import { playSceneWithFallback } from "@/lib/scene/animations";
import { createClient, setRememberSession } from "@/lib/supabase/client";
import { displayNameSchema, subscriberEmailSchema } from "@/shared/schemas";

const LoginScene = dynamic(() => import("@/components/scene/login-scene"), {
  ssr: false,
});

export type AuthMode = "login" | "signup" | "reset";

interface AuthExperienceProps {
  mode: AuthMode;
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="google-mark" viewBox="0 0 48 48">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.7a12 12 0 0 1 0-7.4V15H5.8a20 20 0 0 0 0 18l6.8-5.3Z"
      />
      <path
        fill="#EA4335"
        d="M24 11.9c3 0 5.7 1 7.8 3.1l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.8 15l6.8 5.3c1.6-4.8 6.1-8.4 11.4-8.4Z"
      />
    </svg>
  );
}

function friendlyAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (
    message.includes("provider is not enabled") ||
    message.includes("unsupported provider")
  ) {
    return "Google sign-in is not enabled for this Linkdot project yet.";
  }
  if (
    message.includes("already registered") ||
    message.includes("already exists")
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (message.includes("invalid login credentials")) {
    return "That email and password do not match. Check them and try again.";
  }
  if (message.includes("user already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  return "We couldn't complete that request. Please try again.";
}

export function AuthExperience({ mode }: AuthExperienceProps) {
  const router = useRouter();
  const sceneRef = useRef<SceneController | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSceneReady = useCallback((controller: SceneController | null) => {
    sceneRef.current = controller;
  }, []);

  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get(
      "authError",
    );
    if (!authError) return;

    const timeoutId = window.setTimeout(() => {
      setFormError(
        authError === "cancelled"
          ? "Google sign-in was cancelled. You can try again."
          : "Google sign-in could not be completed. Please try again.",
      );
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const isSignup = mode === "signup";
  const isReset = mode === "reset";
  const isForgot = mode === "login" && forgotPassword;

  function validateEmail(): boolean {
    const result = subscriberEmailSchema.safeParse(email.trim());
    const message = result.success
      ? ""
      : (result.error.issues[0]?.message ?? "Enter a valid email address.");
    setEmailError(message);
    return result.success;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const validEmail = isReset || validateEmail();
    const needsPassword = !isForgot;
    const nextPasswordError =
      needsPassword && password.length < 8
        ? "Password must be at least 8 characters."
        : "";
    const nextConfirmError =
      (isSignup || isReset) && confirmPassword !== password
        ? "Passwords do not match."
        : "";
    const parsedFullName = isSignup
      ? displayNameSchema.safeParse(fullName.trim())
      : null;
    const nextFullNameError =
      parsedFullName && !parsedFullName.success
        ? "Enter your name (up to 60 characters)."
        : "";
    setFullNameError(nextFullNameError);
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmError);
    setFormError("");
    setStatus("");

    if (
      !validEmail ||
      nextPasswordError ||
      nextConfirmError ||
      nextFullNameError
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      setRememberSession(isSignup || rememberMe);
      const supabase = createClient();
      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
          },
        );
        if (error) throw error;
        setStatus(
          "If an account exists for this email, a reset link is on its way.",
        );
        return;
      }

      if (isReset) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setStatus("Your password has been updated.");
        router.replace("/dashboard");
        return;
      }

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: fullName.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });
        if (error) throw error;
        if (data.session) {
          await playSceneWithFallback(sceneRef.current, "login", 1100);
          router.replace("/dashboard");
        } else {
          setStatus("Check your email to confirm your account and continue.");
        }
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      await playSceneWithFallback(sceneRef.current, "login", 1100);
      router.replace("/dashboard");
    } catch (error) {
      setFormError(friendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleAuth() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFormError("");
    setStatus("");
    try {
      setRememberSession(rememberMe);
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard&remember=${rememberMe ? "1" : "0"}`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch (error) {
      setFormError(friendlyAuthError(error));
      setIsSubmitting(false);
    }
  }

  const title = isReset
    ? "Choose a new password"
    : isSignup
      ? "Create your account"
      : isForgot
        ? "Reset your password"
        : "Welcome Back!";
  const subtitle = isReset
    ? "Choose a new password for your Linkdot account."
    : isSignup
      ? "Build your space and share what you love."
      : isForgot
        ? "We’ll email you a secure password reset link."
        : "Let’s get you connected.";

  return (
    <main className="auth-experience">
      <section className="auth-visual" aria-label="About Linkdot">
        <LoginScene onReady={handleSceneReady} />
        <div className="auth-visual-top">
          <BrandLogo surface />
          <span className="auth-visual-tag">YOUR SPACE, YOUR LINKS</span>
        </div>
        <div className="auth-visual-copy">
          <p className="auth-eyebrow">A home for everything you create</p>
          <h1>
            Connect.
            <br />
            Create.
            <br />
            Share.
          </h1>
          <p>Your world of connections starts here.</p>
        </div>
        <div className="auth-visual-orbits" aria-hidden="true">
          <span className="auth-orbit auth-orbit-one" />
          <span className="auth-orbit auth-orbit-two" />
          <span className="auth-orbit auth-orbit-three" />
        </div>
        <p className="auth-visual-footer">One link can open many doors.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-card" aria-labelledby="auth-heading">
          <div className="auth-card-brand">
            <BrandLogo compact />
          </div>
          <h2 id="auth-heading">{title}</h2>
          <p className="auth-intro">{subtitle}</p>

          {!isReset && !isForgot && (
            <>
              <button
                className="auth-google"
                type="button"
                onClick={handleGoogleAuth}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="auth-spinner" aria-hidden="true" />
                ) : (
                  <GoogleMark />
                )}
                Continue with Google
              </button>
              <div className="auth-divider" aria-hidden="true">
                <span>or</span>
              </div>
            </>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {isSignup && (
              <>
                <label htmlFor="full-name">Full Name</label>
                <input
                  autoComplete="name"
                  id="full-name"
                  name="name"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setFullNameError("");
                  }}
                  placeholder="Your name"
                  aria-invalid={Boolean(fullNameError)}
                  aria-describedby={
                    fullNameError ? "full-name-error" : undefined
                  }
                  disabled={isSubmitting}
                  required
                />
                {fullNameError && (
                  <p className="field-error" id="full-name-error" role="alert">
                    {fullNameError}
                  </p>
                )}
              </>
            )}

            {(!isReset || isForgot) && (
              <>
                <label htmlFor="email">Email Address</label>
                <input
                  autoComplete="email"
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  placeholder="you@studio.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setEmailError("");
                  }}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "email-error" : undefined}
                  disabled={isSubmitting}
                  required
                />
                {emailError && (
                  <p className="field-error" id="email-error" role="alert">
                    {emailError}
                  </p>
                )}
              </>
            )}

            {!isForgot && (
              <>
                <label htmlFor="password">
                  {isReset ? "New Password" : "Password"}
                </label>
                <input
                  autoComplete={
                    isReset
                      ? "new-password"
                      : isSignup
                        ? "new-password"
                        : "current-password"
                  }
                  id="password"
                  name="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setPasswordError("");
                  }}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={
                    passwordError ? "password-error" : undefined
                  }
                  disabled={isSubmitting}
                  required
                />
                {passwordError && (
                  <p className="field-error" id="password-error" role="alert">
                    {passwordError}
                  </p>
                )}
              </>
            )}

            {(isSignup || isReset) && (
              <>
                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  autoComplete="new-password"
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  placeholder="Enter your password again"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setConfirmPasswordError("");
                  }}
                  aria-invalid={Boolean(confirmPasswordError)}
                  aria-describedby={
                    confirmPasswordError ? "confirm-password-error" : undefined
                  }
                  disabled={isSubmitting}
                  required
                />
                {confirmPasswordError && (
                  <p
                    className="field-error"
                    id="confirm-password-error"
                    role="alert"
                  >
                    {confirmPasswordError}
                  </p>
                )}
              </>
            )}

            {!isSignup && !isForgot && !isReset && (
              <div className="auth-options">
                <label className="auth-remember" htmlFor="remember-me">
                  <input
                    checked={rememberMe}
                    id="remember-me"
                    onChange={(event) => setRememberMe(event.target.checked)}
                    type="checkbox"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  className="auth-text-button"
                  type="button"
                  onClick={() => {
                    setForgotPassword(true);
                    setFormError("");
                    setStatus("");
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            {status && (
              <p className="auth-status" role="status">
                {status}
              </p>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Please wait..."
                : isReset
                  ? "Update Password"
                  : isSignup
                    ? "Create Account"
                    : isForgot
                      ? "Send reset link"
                      : "Sign In"}
            </button>
          </form>

          {isForgot ? (
            <button
              className="auth-back-link"
              type="button"
              onClick={() => {
                setForgotPassword(false);
                setFormError("");
                setStatus("");
              }}
            >
              Back to Sign In
            </button>
          ) : isReset ? (
            <p className="auth-switch">
              Return to <Link href="/login">Sign In</Link>
            </p>
          ) : isSignup ? (
            <>
              <p className="auth-legal">
                By creating an account, you agree to our{" "}
                <a href="https://linkdot.co/terms">Terms</a> and{" "}
                <a href="https://linkdot.co/privacy">Privacy Policy</a>.
              </p>
              <p className="auth-switch">
                Already have an account? <Link href="/login">Sign In</Link>
              </p>
            </>
          ) : (
            <p className="auth-switch">
              New to Linkdot? <Link href="/signup">Create Account</Link>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
