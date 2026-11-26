import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/ui/Wordmark";
import { footer } from "@/content/landing";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/15">
      <Container className="flex flex-col gap-7 py-9 sm:py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1.5">
          <Wordmark className="text-lg text-ink sm:text-xl" />
          <p className="max-w-[38ch] text-xs leading-relaxed text-ink-soft sm:text-[0.8rem]">
            {footer.note}
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {footer.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft transition-colors hover:text-ember-deep focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember-deep sm:text-[0.7rem]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <Container className="border-t border-ink/10 py-5">
        <p className="text-[0.7rem] leading-relaxed text-ink-soft/80">
          {footer.legal}
        </p>
      </Container>
    </footer>
  );
}
