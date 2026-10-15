"use client";
import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GymLogo } from "@/components/GymLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CheckCircle2, ArrowRight, ShieldCheck, Eye } from "@/components/icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthProvider";
function AccountEntry() {
  const params = useSearchParams();
  const router = useRouter();
  const { setAuthFromLogin } = useAuth();
  const signup = params.get("mode") === "signup";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    gymName: "",
    gymSlug: "",
  });
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await api.authenticate(
        signup ? "signup" : "login",
        signup ? form : { email: form.email, password: form.password },
      );
      if (!response.token || !response.user)
        throw new Error(
          "The server did not return an account session. Please try again.",
        );
      setAuthFromLogin({
        ...response,
        gymId: response.user.gymId,
        gymName: response.user.gymName,
        gymSlug: response.user.gymSlug,
      });
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "We couldn’t connect to the account service. Please try again shortly."
          : err instanceof Error
            ? err.message
            : "Could not sign in.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="account-shell">
      <aside className="account-story">
        <Link href="/" className="flex items-center gap-3">
          <GymLogo size={36} />
          <span className="text-xl font-semibold tracking-tight">
            GymRetain
          </span>
        </Link>
        <div>
          <p className="premium-eyebrow">Built for the business of belonging</p>
          <h1>
            Great gyms don’t
            <br />
            leave loyalty
            <br />
            <em>to chance.</em>
          </h1>
          <p>
            Bring your members, money and daily operations together. Give every
            member a reason to return.
          </p>
          <div className="account-promises">
            {[
              "A clear view of your gym, every morning",
              "A thoughtful follow-up before a member slips away",
              "One workspace for the whole team",
            ].map((item) => (
              <span key={item}>
                <CheckCircle2 className="w-4 h-4" />
                {item}
              </span>
            ))}
          </div>
        </div>
        <p className="text-xs opacity-70">
          Attendance. Memberships. Operations. Retention.
        </p>
      </aside>
      <main className="account-form-panel">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-content-secondary">
            ← Explore the demo
          </Link>
          <ThemeToggle />
        </div>
        <form onSubmit={submit} className="account-form">
          <p className="premium-eyebrow">
            {signup ? "Your next chapter starts here" : "Welcome back"}
          </p>
          <h2>
            {signup ? "Make room for growth." : "Your gym. In good hands."}
          </h2>
          <p>
            {signup
              ? "Start your 14-day trial. No card details required."
              : "Sign in to your gym’s secure workspace."}
          </p>
          {signup && (
            <>
              <label className="studio-field">
                <span>Your name</span>
                <input
                  className="studio-input"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </label>
              <label className="studio-field">
                <span>Gym name</span>
                <input
                  className="studio-input"
                  required
                  maxLength={100}
                  value={form.gymName}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      gymName: event.target.value,
                      gymSlug: event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, ""),
                    })
                  }
                />
              </label>
              <label className="studio-field">
                <span>Workspace address</span>
                <input
                  className="studio-input"
                  required
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  maxLength={100}
                  value={form.gymSlug}
                  onChange={(event) =>
                    setForm({ ...form, gymSlug: event.target.value })
                  }
                />
              </label>
              <label className="studio-field">
                <span>Phone</span>
                <input
                  className="studio-input"
                  type="tel"
                  autoComplete="tel"
                  pattern="\+?[0-9 ()-]{7,24}"
                  required
                  maxLength={24}
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                />
              </label>
            </>
          )}
          <label className="studio-field">
            <span>Email address</span>
            <input
              className="studio-input"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
          </label>
          <label className="studio-field">
            <span>Password</span>
            <div className="relative">
              <input
                className="studio-input pr-12"
                type={visible ? "text" : "password"}
                autoComplete={signup ? "new-password" : "current-password"}
                minLength={signup ? 8 : 1}
                maxLength={128}
                required
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
              />
              <button
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
                onClick={() => setVisible(!visible)}
                className="absolute right-2 top-2 p-2 rounded-lg"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </label>
          {error && (
            <p role="alert" className="studio-alert" data-tone="danger">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="studio-button studio-button-primary w-full justify-center py-3.5"
          >
            {busy
              ? "Connecting…"
              : signup
                ? "Create my gym workspace"
                : "Sign in"}
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-center text-sm">
            {signup ? "Already have a workspace?" : "New to GymRetain?"}{" "}
            <Link
              className="font-semibold underline underline-offset-4"
              onClick={() => setError("")}
              href={signup ? "/login" : "/login?mode=signup"}
            >
              {signup ? "Sign in" : "Start a free trial"}
            </Link>
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-content-tertiary">
            <ShieldCheck className="w-3.5 h-3.5" />
            Your gym’s workspace is scoped to your account.
          </div>
        </form>
      </main>
    </div>
  );
}
export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading account…</p>}>
      <AccountEntry />
    </Suspense>
  );
}
