import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getStarted } from "@/content/landing";

export function GetStartedSection() {
  return (
    <section
      id="start"
      aria-labelledby="start-title"
      className="border-t border-ink/15 bg-cream-deep py-16 sm:py-20 lg:py-24"
    >
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <Eyebrow>{getStarted.eyebrow}</Eyebrow>
            <h2
              id="start-title"
              className="mt-3 max-w-[16ch] font-display text-[clamp(1.9rem,4.4vw,3.2rem)] font-bold leading-[1.08] text-ink sm:mt-4"
            >
              {getStarted.heading}
            </h2>
            <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-ink-soft sm:text-base">
              {getStarted.body}
            </p>
          </div>

          <ol className="flex flex-col">
            {getStarted.steps.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-4 border-b border-ink/15 py-5 first:pt-0 last:border-b-0 last:pb-0 sm:gap-6 sm:py-6"
              >
                <span
                  aria-hidden="true"
                  className="font-display text-2xl font-black leading-none text-ember sm:text-3xl"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold text-ink sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft sm:text-[0.95rem]">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
