"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [csrfToken, setCSRFToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCSRFToken = async () => {
      const res = await fetch("/api/auth/csrf");
      const data = await res.json();
      setCSRFToken(data.token);
    };
    fetchCSRFToken();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (data.requires2FA) {
        router.push(`/admin/2fa?userId=${data.userId}`);
      } else {
        router.push("/admin");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-md rounded-[18px] border border-line bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-2xl font-bold text-white mx-auto">
            H
          </div>
          <h1 className="mt-4 font-display text-3xl text-ink">Admin Sign In</h1>
          <p className="mt-2 text-sm text-slate-500">HelpHub Operations</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-coral-100 bg-coral-100 p-3 text-sm text-coral-600">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper p-3 outline-none ring-0"
              placeholder="admin@helphub.local"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper p-3 outline-none ring-0"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Demo credentials: admin@helphub.local / admin123
        </p>

        <div className="mt-6 border-t border-line pt-6">
          <Link href="/" className="text-sm text-teal-700 hover:text-teal-800">
            ← Back to HelpHub
          </Link>
        </div>
      </div>
    </div>
  );
}
