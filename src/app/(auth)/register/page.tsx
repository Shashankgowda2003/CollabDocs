"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PasswordInput } from "@/components/ui/password-input";

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterPageInner />
    </Suspense>
  );
}

function RegisterFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-8 shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-purple-500/25">C</div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
        </div>
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
        </div>
      </div>
    </div>
  );
}

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = useMemo(() => searchParams.get("invite"), [searchParams]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [inviteData, setInviteData] = useState<{ role: string; documentTitle: string } | null>(null);
  const [touched, setTouched] = useState({ password: false, confirm: false });

  const passwordChecks = useMemo(() => ({
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  }), [password]);

  const passwordStrength = useMemo(() => {
    const checks = Object.values(passwordChecks);
    return checks.filter(Boolean).length;
  }, [passwordChecks]);

  const passwordStrengthLabel = useMemo(() => {
    if (password.length === 0) return "";
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Fair";
    if (passwordStrength <= 4) return "Good";
    return "Strong";
  }, [passwordStrength]);

  const passwordStrengthColor = useMemo(() => {
    if (password.length === 0) return "bg-zinc-700";
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-amber-500";
    if (passwordStrength <= 4) return "bg-blue-500";
    return "bg-green-500";
  }, [passwordStrength]);

  const passwordError = useMemo(() => {
    if (!touched.password && password.length === 0) return "";
    if (password.length === 0) return "";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (passwordStrength < 4) return "Password is too weak";
    return "";
  }, [password, touched.password, passwordStrength]);

  const confirmError = useMemo(() => {
    if (!touched.confirm && confirmPassword.length === 0) return "";
    if (confirmPassword.length === 0) return "";
    if (password !== confirmPassword) return "Passwords do not match";
    return "";
  }, [password, confirmPassword, touched.confirm]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!inviteToken) return;
    fetch(`/api/auth/register/invite?token=${inviteToken}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setInviteData({ role: data.role, documentTitle: data.documentTitle });
          if (data.email) setEmail(data.email);
        }
      })
      .catch(() => {});
  }, [inviteToken]);

  const oauthProviders = [];
  if (process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED === "true") oauthProviders.push({ name: "Google", provider: "google" });
  if (process.env.NEXT_PUBLIC_OAUTH_GITHUB_ENABLED === "true") oauthProviders.push({ name: "GitHub", provider: "github" });

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    setTouched({ password: true, confirm: true });

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (passwordStrength < 4) {
      setError("Please meet all password requirements");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, inviteToken }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Account created but sign-in failed. Try logging in.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-purple-500/25">
              C
            </div>
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-sm text-zinc-400">Start collaborating in seconds</p>
          </div>

          {inviteData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-sm text-blue-400 mb-6"
            >
              You&apos;ve been invited as <strong>{inviteData.role}</strong> to &quot;{inviteData.documentTitle}&quot;.
              Create an account to accept.
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 mb-6"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full h-11 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(v) => { setPassword(v); if (!touched.password) setTouched((t) => ({ ...t, password: true })); }}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                error={passwordError}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              />
              {password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${level <= passwordStrength ? passwordStrengthColor : "bg-zinc-700"}`}
                      />
                    ))}
                  </div>
                  <p className={`text-[11px] font-medium ${passwordStrengthColor.replace("bg-", "text-")}`}>
                    {passwordStrengthLabel}
                  </p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    {[
                      { key: "minLength" as const, label: "8+ characters" },
                      { key: "hasUpper" as const, label: "Uppercase letter" },
                      { key: "hasLower" as const, label: "Lowercase letter" },
                      { key: "hasNumber" as const, label: "Number" },
                      { key: "hasSpecial" as const, label: "Special character" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-1">
                        <svg
                          className={`h-3 w-3 shrink-0 transition-colors ${passwordChecks[key] ? "text-green-400" : "text-zinc-600"}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span className={`text-[10px] transition-colors ${passwordChecks[key] ? "text-green-400" : "text-zinc-500"}`}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Confirm Password
              </label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(v) => { setConfirmPassword(v); if (!touched.confirm) setTouched((t) => ({ ...t, confirm: true })); }}
                required
                minLength={8}
                placeholder="Repeat your password"
                error={confirmError}
                onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-semibold text-white hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/25"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {mounted && oauthProviders.length > 0 && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-xs text-zinc-500">or continue with</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {oauthProviders.map((p) => (
                  <button
                    key={p.provider}
                    onClick={() => signIn(p.provider, { callbackUrl: "/dashboard" })}
                    className="h-11 rounded-xl border border-zinc-700 bg-zinc-800/80 text-sm font-medium text-zinc-300 hover:bg-zinc-700/50 hover:border-zinc-600 transition-all"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
