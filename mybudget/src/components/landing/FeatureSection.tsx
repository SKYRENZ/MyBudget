import { ChartIcon } from "@/components/icons/ChartIcon";
import { TargetIcon } from "@/components/icons/TargetIcon";
import { WalletIcon } from "@/components/icons/WalletIcon";
import type { IconProps } from "@/components/icons/types";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { features } from "@/content/landing";
import type { FeatureIcon } from "@/content/landing";

const icons: Record<FeatureIcon, (props: IconProps) => React.JSX.Element> = {
  wallet: WalletIcon,
  chart: ChartIcon,
  target: TargetIcon,
};

export function FeatureSection() {
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="border-t border-ink/15 py-16 sm:py-20 lg:py-24"
    >
      <Container>
        <Eyebrow>{features.eyebrow}</Eyebrow>

        <h2
          id="features-title"
          className="mt-3 max-w-[18ch] font-display text-[clamp(1.9rem,4.4vw,3.2rem)] font-bold leading-[1.08] text-ink sm:mt-4"
        >
          {features.heading}
        </h2>

        <ul className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {features.items.map((item) => {
            const Icon = icons[item.icon];

            return (
              <li
                key={item.title}
                className="flex flex-col border border-ink/15 bg-paper p-6 sm:p-7"
              >
                <span className="flex h-11 w-11 items-center justify-center border border-ink/20 bg-cream text-ember-deep">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold text-ink sm:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-soft sm:text-[0.95rem]">
                  {item.description}
                </p>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
