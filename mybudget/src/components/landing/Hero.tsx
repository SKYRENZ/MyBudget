import { AccentBars } from "@/components/landing/AccentBars";
import { WalletIcon } from "@/components/icons/WalletIcon";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { hero } from "@/content/landing";

export function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="flex min-h-[100svh] flex-col items-center justify-center px-5 py-20 text-center sm:px-8 sm:py-24"
    >
      <AccentBars className="mb-6 sm:mb-8" />

      <h1
        id="hero-title"
        className="text-[clamp(2.4rem,9.5vw,7.5rem)] text-ink"
      >
        <Wordmark />
      </h1>

      <p className="mt-5 max-w-[32ch] font-display text-[clamp(1.05rem,2.2vw,1.6rem)] italic leading-relaxed text-ink-soft sm:mt-6 sm:max-w-[46ch]">
        {hero.tagline}
      </p>

      <div className="mt-9 sm:mt-11">
        <Button
          href={hero.cta.href}
          icon={<WalletIcon className="h-4 w-4 sm:h-[1.1rem] sm:w-[1.1rem]" />}
        >
          {hero.cta.label}
        </Button>
      </div>
    </section>
  );
}
