import type { Metadata } from "next";
import { Construction } from "lucide-react";

export const metadata: Metadata = {
  title: "Exhibits — David Schaldach",
  description: "Documentation of David Schaldach's art exhibits.",
};

export default function ExhibitsPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/10">
            <Construction size={36} className="text-gold" />
          </div>
          <h1 className="mt-8 font-display text-4xl font-bold text-primary-dark sm:text-5xl">
            Exhibits
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-text-secondary">
            Under construction &mdash; come back April 21st!
          </p>
          <div className="mt-8 h-1 w-24 rounded-full bg-gradient-to-r from-gold/40 via-gold to-gold/40" />
        </div>
      </div>
    </div>
  );
}
