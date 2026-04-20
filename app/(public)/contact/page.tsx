import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import { MapPin, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact — David Schaldach",
  description: "Keep in touch with David Schaldach. Based in Boulder, CO.",
};

async function getContactPhoto(): Promise<string | null> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    if (!supabase) return null;

    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "contact_photo")
      .single();

    return data?.value || null;
  } catch {
    return null;
  }
}

export default async function ContactPage() {
  const contactPhoto = await getContactPhoto();
  return (
    <div className="pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Left column — info */}
          <div>
            <h1 className="font-display text-4xl font-bold text-primary-dark sm:text-5xl">
              Keep in Touch
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-text-secondary">
              Have a question, want to collaborate, or just want to say hello?
              I&apos;d love to hear from you. Fill out the form and I&apos;ll
              get back to you as soon as I can.
            </p>

            <div className="mt-10 space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium text-primary-dark">Location</p>
                  <p className="mt-1 text-text-secondary">Boulder, CO</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Mail size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium text-primary-dark">Email</p>
                  <p className="mt-1 text-text-secondary">
                    Use the form to send a message
                  </p>
                </div>
              </div>
            </div>

            {/* Photo or decorative card */}
            {contactPhoto ? (
              <div className="mt-12 overflow-hidden rounded-2xl">
                <img
                  src={contactPhoto}
                  alt="David Schaldach"
                  className="w-full object-cover"
                />
              </div>
            ) : (
              <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-8">
                <p className="font-display text-xl italic text-cream/90">
                  &ldquo;Every great piece starts with a conversation — between
                  the artist and the world.&rdquo;
                </p>
                <p className="mt-4 text-sm text-cream/60">— David Schaldach</p>
              </div>
            )}
          </div>

          {/* Right column — form */}
          <div>
            <div className="rounded-2xl bg-white p-8 shadow-sm sm:p-10">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
