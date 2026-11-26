export type FeatureIcon = "wallet" | "chart" | "target";

export type Feature = {
  title: string;
  description: string;
  icon: FeatureIcon;
};

export type Step = {
  title: string;
  description: string;
};

export type FooterLink = {
  label: string;
  href: string;
};

export const hero = {
  wordmark: "MyBudget",
  tagline:
    "Effortless monthly planning and everyday tracking for the money that matters to you.",
  cta: {
    label: "Start budgeting",
    href: "/auth?mode=signup",
  },
} as const;

export const features: {
  eyebrow: string;
  heading: string;
  items: Feature[];
} = {
  eyebrow: "Why MyBudget",
  heading: "A calmer way to look after your money.",
  items: [
    {
      icon: "wallet",
      title: "Track every expense",
      description:
        "Log what you spend in seconds, sort it by category and see exactly where this month's money went.",
    },
    {
      icon: "chart",
      title: "Plan the whole month",
      description:
        "Build a budget from your real income, then watch what is left to spend as the weeks go by.",
    },
    {
      icon: "target",
      title: "Grow your savings",
      description:
        "Set a goal for the things you are saving for and follow your progress one deposit at a time.",
    },
  ],
};

export const getStarted: {
  eyebrow: string;
  heading: string;
  body: string;
  steps: Step[];
} = {
  eyebrow: "Get started",
  heading: "Three steps to a budget that fits.",
  body: "No spreadsheets, no formulas to memorise. Set your month up once and MyBudget keeps the maths in order.",
  steps: [
    {
      title: "Add your income",
      description:
        "Start with what actually comes in this month — salary, side work, anything regular.",
    },
    {
      title: "Give every coin a job",
      description:
        "Split it across rent, food, transport and savings until nothing is left unplanned.",
    },
    {
      title: "Track as you go",
      description:
        "Log spending as it happens and MyBudget keeps your running totals honest.",
    },
  ],
};

export const footer: {
  note: string;
  links: FooterLink[];
  legal: string;
} = {
  note: "Budget planning and expense tracking for everyday life.",
  links: [
    { label: "Features", href: "/#features" },
    { label: "Get started", href: "/#start" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Back to top", href: "/#top" },
  ],
  legal: "© 2026 MyBudget. Made for people who want to know where their money goes.",
};
