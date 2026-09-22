"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPublicEnv } from "@/lib/public-env";

const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–1,000", "1,000+"];
const MAU_RANGES = [
  "Less than 1,000",
  "1,000 – 10,000",
  "10,000 – 100,000",
  "100,000 – 1M",
  "More than 1M",
];
const INTERESTS = [
  "Evaluating AuthEngine",
  "Integration / implementation help",
  "Migrating from Auth0 / Okta / Cognito",
  "Enterprise / SSO requirements",
  "Self-hosting & deployment",
  "Other",
];

const EMPTY = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  jobTitle: "",
  company: "",
  companySize: "",
  country: "",
  mau: "",
  interest: "",
  message: "",
  consent: false,
};

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function ContactForm() {
  const [form, setForm] = useState({ ...EMPTY });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof typeof EMPTY, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email || !form.company) {
      toast.error("Please fill in your name, work email and company.");
      return;
    }
    if (!form.consent) {
      toast.error("Please agree to be contacted before submitting.");
      return;
    }

    const apiBase = getPublicEnv().API_URL || "http://localhost:8000/api/v1";

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/public/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          phone: form.phone || null,
          job_title: form.jobTitle || null,
          company: form.company,
          company_size: form.companySize || null,
          country: form.country || null,
          mau: form.mau || null,
          interest: form.interest || null,
          message: form.message || null,
          consent: form.consent,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        detail?: string;
        message?: string;
      };

      if (!res.ok) {
        const detail =
          typeof data.detail === "string"
            ? data.detail
            : "Could not submit your request. Please try again.";
        toast.error(detail);
        return;
      }

      setForm({ ...EMPTY });
      toast.success(
        data.message || "Thanks! Our team will reach out within 1 business day."
      );
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name *</Label>
          <Input
            id="firstName"
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            placeholder="Jane"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name *</Label>
          <Input
            id="lastName"
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            placeholder="Doe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work email *</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="jane@company.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+1 555 000 0000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company *</Label>
          <Input
            id="company"
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            placeholder="Acme Inc."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jobTitle">Job title</Label>
          <Input
            id="jobTitle"
            value={form.jobTitle}
            onChange={(e) => update("jobTitle", e.target.value)}
            placeholder="Head of Engineering"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companySize">Company size</Label>
          <select
            id="companySize"
            className={fieldClass}
            value={form.companySize}
            onChange={(e) => update("companySize", e.target.value)}
          >
            <option value="">Select…</option>
            {COMPANY_SIZES.map((s) => (
              <option key={s} value={s}>
                {s} employees
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={form.country}
            onChange={(e) => update("country", e.target.value)}
            placeholder="United States"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mau">Expected monthly active users</Label>
          <select
            id="mau"
            className={fieldClass}
            value={form.mau}
            onChange={(e) => update("mau", e.target.value)}
          >
            <option value="">Select…</option>
            {MAU_RANGES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="interest">What can we help with?</Label>
          <select
            id="interest"
            className={fieldClass}
            value={form.interest}
            onChange={(e) => update("interest", e.target.value)}
          >
            <option value="">Select…</option>
            {INTERESTS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Tell us about your project</Label>
        <Textarea
          id="message"
          rows={4}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Which login methods do you need, how many tenants, timelines, current stack…"
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => update("consent", e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-input accent-primary"
        />
        <span>
          I agree to be contacted by the AuthEngine team about my request and
          accept the privacy policy.
        </span>
      </label>

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="h-12 px-8 rounded-xl text-base font-bold w-full sm:w-auto"
      >
        {isSubmitting ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Send className="mr-2 h-5 w-5" />
        )}
        Contact us
      </Button>
    </form>
  );
}
