"use client";

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { generateCaptcha } from "@/lib/captcha";

interface CaptchaState {
  question: string;
  token: string;
  answer: "";
}

export default function ComplaintPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaState | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [complaintNumber, setComplaintNumber] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    fullAddress: "",
    dateOfBirth: "",
    title: "",
    category: "OTHER",
    description: "",
    city: "",
    district: "",
    preferredLanguage: "en",
  });

  useEffect(() => {
    const c = generateCaptcha();
    setCaptcha({ ...c, answer: "" });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleCaptchaChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (captcha) {
      setCaptcha((prev) => ({
        ...prev!,
        answer: e.target.value,
      }));
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          captchaToken: captcha?.token,
          captchaAnswer: parseInt(captcha?.answer || "0"),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Submission failed");
        return;
      }

      setComplaintNumber(data.complaintNumber);
      setTrackingCode(data.trackingCode);
      setSubmitted(true);
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-paper px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-[18px] border border-line bg-white p-8 text-center shadow-sm">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-3xl mx-auto">
            ✓
          </div>
          <h1 className="font-display text-4xl text-ink">Report submitted</h1>
          <p className="mt-4 text-slate-700">Thank you. Your complaint has been safely recorded.</p>

          <div className="mt-8 space-y-3 rounded-xl bg-teal-50 p-6 text-left">
            <p className="text-sm text-slate-600">Save these details to track your case:</p>
            <p className="font-mono text-lg font-bold text-teal-700">{complaintNumber}</p>
            <p className="font-mono text-lg font-bold text-teal-700">{trackingCode}</p>
            <p className="text-xs text-slate-500">Never share your tracking code. It cannot be recovered if lost.</p>
          </div>

          <Link href="/" className="mt-8 inline-block rounded-full bg-teal-600 px-6 py-3 font-semibold text-white">
            Back home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.14em] text-teal-700">Step {step} of 4</p>
            <h1 className="mt-2 font-display text-4xl text-ink">Make a complaint</h1>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 w-8 rounded-full ${
                  s <= step ? "bg-teal-600" : "bg-line"
                }`}
              />
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-[18px] border border-line bg-white p-8 shadow-sm"
        >
          {error && (
            <div className="rounded-lg border border-coral-100 bg-coral-100 p-3 text-sm text-coral-600">
              {error}
            </div>
          )}

          {/* Step 1: Your Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">First name (optional)</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-line bg-paper p-3"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Last name (optional)</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-line bg-paper p-3"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email (optional)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-line bg-paper p-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Phone (optional)</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-line bg-paper p-3"
                />
              </div>

              <div className="text-xs text-slate-500">
                All personal information stays private and is never public.
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Full address (optional)</label>
                <input
                  type="text"
                  name="fullAddress"
                  value={formData.fullAddress}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-line bg-paper p-3"
                  placeholder="123 Main St, City, State 12345"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-line bg-paper p-3"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">District</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-line bg-paper p-3"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Complaint Details */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-line bg-paper p-3"
                  placeholder="Brief summary"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full rounded-xl border border-line bg-paper p-3">
                  <option value="HOUSING">Housing</option>
                  <option value="WORKPLACE">Workplace</option>
                  <option value="COMMUNITY_SAFETY">Community safety</option>
                  <option value="PUBLIC_SERVICE">Public service</option>
                  <option value="HEALTHCARE">Healthcare</option>
                  <option value="EDUCATION">Education</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  className="w-full rounded-xl border border-line bg-paper p-3"
                  placeholder="What happened? Please be specific."
                  required
                />
              </div>
            </div>
          )}

          {/* Step 4: Verify */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="rounded-lg border border-line bg-teal-50 p-4">
                <p className="text-sm font-medium text-slate-700">Before you submit:</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>✓ You understand this report is submitted anonymously by default</li>
                  <li>✓ All information stays private and is never publicly visible</li>
                  <li>✓ You can track status using your complaint number and tracking code</li>
                  <li>✓ Officers can only message you via this secure platform</li>
                </ul>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Security: {captcha?.question}</label>
                <input
                  type="number"
                  value={captcha?.answer || ""}
                  onChange={handleCaptchaChange}
                  className="w-full rounded-xl border border-line bg-paper p-3"
                  placeholder="Your answer"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => setStep(Math.max(1, step - 1))}
              className="rounded-full border border-line bg-white px-6 py-3 font-semibold text-ink"
              disabled={step === 1}
            >
              Back
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="ml-auto rounded-full bg-teal-600 px-6 py-3 font-semibold text-white"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="ml-auto rounded-full bg-teal-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
