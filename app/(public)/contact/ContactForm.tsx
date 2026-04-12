"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

type FormStatus = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <CheckCircle size={48} className="text-primary" />
        <h3 className="mt-4 font-display text-2xl font-semibold text-primary-dark">
          Message Sent!
        </h3>
        <p className="mt-2 text-text-secondary">
          Thank you for reaching out. I&apos;ll get back to you soon.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-medium text-gold-dark transition-colors hover:text-gold"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-primary-dark"
        >
          Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 block w-full rounded-lg border border-sage bg-cream/50 px-4 py-3 text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Your name"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-primary-dark"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 block w-full rounded-lg border border-sage bg-cream/50 px-4 py-3 text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-primary-dark"
        >
          Message
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-2 block w-full rounded-lg border border-sage bg-cream/50 px-4 py-3 text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          placeholder="What's on your mind?"
        />
      </div>

      {status === "error" && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:bg-primary-light disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Sending...
          </>
        ) : (
          <>
            <Send size={16} />
            Send Message
          </>
        )}
      </button>
    </form>
  );
}
