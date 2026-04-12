import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-sage">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="font-display text-2xl font-semibold text-primary-dark"
            >
              David Schaldach
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              He was a certified arborist, now he&apos;s branching out.
              <br />
              Creative &amp; photographer based in Boulder, CO.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              Explore
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                { href: "/works", label: "Gallery" },
                { href: "/about", label: "About" },
                { href: "/blog", label: "Blog" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-secondary transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get in Touch */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              Get in Touch
            </h3>
            <div className="mt-4 space-y-3 text-sm text-text-secondary">
              <p>Boulder, CO</p>
              <Link
                href="/contact"
                className="inline-block text-gold-dark transition-colors hover:text-gold"
              >
                Send a message &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-primary/10 pt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Davidschaldach.com. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-text-muted">
            <Link href="#" className="transition-colors hover:text-text-secondary">
              Privacy Policy
            </Link>
            <Link href="#" className="transition-colors hover:text-text-secondary">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
