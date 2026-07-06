"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PasswordInput } from "@/components/ui/password-input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await res.json();
        setTokenValid(data.valid);
      } catch {
        setTokenValid(false);
      }
      setValidating(false);
    }
    validate();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }
    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage({ type: "error", text: data.error });
      } else {
        setMessage({ type: "success", text: "Password reset! Redirecting to login..." });
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Try again." });
    }
    setLoading(false);
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
            <h1 className="text-2xl font-bold text-white">Reset password</h1>
          </div>

          {validating && (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
            </div>
          )}

          {!validating && !tokenValid && (
            <div className="text-center py-4">
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 mb-4">
                This reset link is invalid or has expired.
              </div>
              <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300 text-sm">
                Request a new one
              </Link>
            </div>
          )}

          {!validating && tokenValid && (
            <>
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className={`rounded-xl p-3 text-sm mb-6 ${
                    message.type === "success"
                      ? "bg-green-500/10 border border-green-500/20 text-green-400"
                      : "bg-red-500/10 border border-red-500/20 text-red-400"
                  }`}
                >
                  {message.text}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">New Password</label>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={setPassword}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-zinc-300 mb-1.5">Confirm Password</label>
                  <PasswordInput
                    id="confirm"
                    value={confirm}
                    onChange={setConfirm}
                    required
                    placeholder="Re-enter password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-semibold text-white hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/25"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-zinc-500">
            <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
              Back to sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
