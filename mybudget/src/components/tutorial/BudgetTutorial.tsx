"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ACTIONS,
  EVENTS,
  Joyride,
  STATUS,
  type EventData,
  type Step,
  type TooltipRenderProps,
} from "react-joyride";
import { api } from "@/lib/api";

const TUTORIAL_STORAGE_KEY = "mybudget-tutorial-done";
const TUTORIAL_REPLAY_EVENT = "mybudget-tutorial-replay";

type StepMeta = {
  route?: string;
  eyebrow: string;
  examples?: Array<{ label: string; detail: string }>;
};

const STEP_META: StepMeta[] = [
  {
    eyebrow: "Getting started",
    examples: [
      { label: "1. Accounts", detail: "Reflect real balances (Cash, Bank, GCash)" },
      { label: "2. Categories", detail: "Bills, food, subscriptions & limits" },
      { label: "3. Savings & Goals", detail: "Cash reserves & long-term milestones" },
      { label: "4. Transactions", detail: "Income, expenses & contributions" },
    ],
  },
  {
    route: "/accounts",
    eyebrow: "Step 1 of 4 · Accounts",
    examples: [
      { label: "GoTyme (Bank)", detail: "₱14,560.00" },
      { label: "Wallet (Cash)", detail: "₱300.00" },
      { label: "GCash - main (GCash)", detail: "₱171.00" },
      { label: "Maribank (Bank)", detail: "₱0.00" },
    ],
  },
  {
    route: "/expenses",
    eyebrow: "Step 2 of 4 · Categories",
    examples: [
      { label: "Kuryente", detail: "₱3,000.00 / mo" },
      { label: "Water · Internet", detail: "₱1,000.00 · ₱1,510.00 / mo" },
      { label: "Tithes", detail: "₱2,300.00 / mo" },
      { label: "Canva · Spotify", detail: "₱300.00 · ₱170.00 / mo" },
    ],
  },
  {
    route: "/savings",
    eyebrow: "Step 3 of 4 · Savings & Goals",
    examples: [
      { label: "Savings: New Phone", detail: "Target ₱15,000.00 · ₱200.00/mo" },
      { label: "Goal: First Fruit", detail: "Target ₱23,000.00 · High priority" },
    ],
  },
  {
    route: "/expenses",
    eyebrow: "Step 4 of 4 · Transactions",
    examples: [
      { label: "Salary (Income)", detail: "+₱14,562.00" },
      { label: "Goal contribution – First Fruit", detail: "₱1.00 from account" },
    ],
  },
];

export function triggerTutorialReplay() {
  window.localStorage.removeItem(TUTORIAL_STORAGE_KEY);
  window.dispatchEvent(new Event(TUTORIAL_REPLAY_EVENT));
}

function TutorialTooltip({
  continuous,
  index,
  isLastStep,
  size,
  step,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  const meta = (step.data as StepMeta | undefined) ?? STEP_META[index] ?? STEP_META[0];
  const progress = Math.round(((index + 1) / size) * 100);

  return (
    <motion.div
      {...tooltipProps}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="w-[min(92vw,24rem)] border-2 border-ink/20 bg-paper p-5 text-ink shadow-[10px_10px_0_rgba(61,31,12,0.2)] dark:border-white/15 dark:bg-[#211b17] dark:text-[#f7eddd]"
    >
      <div>
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
          {meta.eyebrow}
        </p>
        {step.title ? (
          <h3 className="mt-1 font-display text-xl font-bold leading-snug">{step.title}</h3>
        ) : null}
      </div>

      <div className="mt-3 h-1 w-full bg-ink/10 dark:bg-white/10">
        <div
          className="h-full bg-ember-deep transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 text-sm leading-relaxed text-ink-soft dark:text-[#cfc2af]">
        {step.content}
      </div>

      {meta.examples && meta.examples.length > 0 ? (
        <div className="mt-4 border border-ink/12 bg-cream/70 p-3 dark:border-white/10 dark:bg-[#17120f]/70">
          <p className="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-ink-soft">
            Examples
          </p>
          <ul className="mt-2 space-y-1.5 text-xs">
            {meta.examples.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-3">
                <span className="font-semibold text-ink dark:text-white">{item.label}</span>
                <span className="text-right text-ink-soft dark:text-[#cfc2af]">{item.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-ink/12 pt-3 dark:border-white/10">
        <button
          {...skipProps}
          type="button"
          className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ink-soft hover:text-ink dark:hover:text-white"
        >
          Skip
        </button>
        <div className="flex items-center gap-2">
          {index > 0 ? (
            <button
              {...backProps}
              type="button"
              className="border border-ink/15 px-3 py-2 text-[0.58rem] font-bold uppercase tracking-[0.13em] text-ink hover:border-ink/40 dark:border-white/15 dark:text-white"
            >
              Back
            </button>
          ) : null}
          {continuous ? (
            <button
              {...primaryProps}
              type="button"
              className="border border-ember-deep bg-ember-deep px-4 py-2 text-[0.58rem] font-bold uppercase tracking-[0.13em] text-white transition-opacity hover:opacity-90"
            >
              {isLastStep ? "Finish" : "Next"}
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

const emptySubscribe = () => () => {};

export function BudgetTutorial() {
  const router = useRouter();
  const pathname = usePathname();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const initializedRef = useRef(false);
  const pendingStepRef = useRef<number | null>(null);

  const steps: Step[] = useMemo(
    () => [
      {
        target: "body",
        placement: "center",
        title: "Welcome to MyBudget",
        content:
          "Follow these 4 steps to set up your real balances, recurring categories, savings goals, and live transactions.",
        skipBeacon: true,
        data: STEP_META[0],
      },
      {
        target: '[data-tour="accounts-add"]',
        placement: "bottom",
        title: "Set up your accounts first",
        content:
          "Add every account you actually use (cash, banks, GCash, Maya) with its real current balance. Initial balances automatically count toward your totals.",
        skipBeacon: true,
        data: STEP_META[1],
      },
      {
        target: '[data-tour="expenses-add-category"]',
        placement: "bottom",
        title: "Set up expense categories",
        content:
          "Create categories for your recurring payments — bills, food, subscriptions, and transportation — along with monthly budget limits.",
        skipBeacon: true,
        data: STEP_META[2],
      },
      {
        target: '[data-tour="planning-actions"]',
        placement: "bottom",
        title: "Add savings & long-term goals",
        content:
          "Create savings funds for reserves and long-term goals for milestones. Use Add contribution to move money from a specific account.",
        skipBeacon: true,
        data: STEP_META[3],
      },
      {
        target: '[data-tour="expenses-add-tx"]',
        placement: "bottom",
        title: "Input your transactions",
        content:
          "Record your income and expenses as they happen. Your account balances, Overview dashboard, and Reports will stay up to date automatically.",
        skipBeacon: true,
        data: STEP_META[4],
      },
    ],
    [],
  );

  const completeTutorial = useCallback(() => {
    pendingStepRef.current = null;
    window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    setRun(false);
    api.profile.update({ is_new_user: 0 }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let timer: number | undefined;
    let cancelled = false;

    if (!initializedRef.current && pathname !== "/" && pathname !== "/auth") {
      initializedRef.current = true;
      api.profile
        .get()
        .then((profile) => {
          if (cancelled) return;
          const isNew = profile.is_new_user;
          const shouldRun =
            isNew === 1 || isNew === true
              ? true
              : isNew === 0 || isNew === false
              ? false
              : !window.localStorage.getItem(TUTORIAL_STORAGE_KEY);
          if (shouldRun) {
            setStepIndex(0);
            setRun(true);
          }
        })
        .catch(() => {
          if (cancelled) return;
          if (!window.localStorage.getItem(TUTORIAL_STORAGE_KEY)) {
            setStepIndex(0);
            setRun(true);
          }
        });
    }

    function handleReplay() {
      initializedRef.current = true;
      pendingStepRef.current = null;
      setStepIndex(0);
      setRun(true);
    }

    if (pendingStepRef.current !== null) {
      const targetIdx = pendingStepRef.current;
      const targetRoute = STEP_META[targetIdx]?.route;
      if (!targetRoute || pathname === targetRoute) {
        pendingStepRef.current = null;
        timer = window.setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "instant" });
          setStepIndex(targetIdx);
          setRun(true);
        }, 180);
      }
    }

    window.addEventListener(TUTORIAL_REPLAY_EVENT, handleReplay);
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener(TUTORIAL_REPLAY_EVENT, handleReplay);
    };
  }, [mounted, pathname]);

  const goToStep = useCallback(
    (nextIndex: number) => {
      const targetRoute = STEP_META[nextIndex]?.route;
      if (targetRoute && pathname !== targetRoute) {
        pendingStepRef.current = nextIndex;
        setRun(false);
        router.push(targetRoute);
        return;
      }
      window.scrollTo({ top: 0, behavior: "instant" });
      setStepIndex(nextIndex);
    },
    [pathname, router],
  );

  const handleEvent = useCallback(
    (data: EventData) => {
      const { action, index, status, type } = data;

      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        completeTutorial();
        return;
      }

      if (type === EVENTS.STEP_AFTER) {
        const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
        if (nextIndex < 0) return;
        if (nextIndex >= steps.length) {
          completeTutorial();
          return;
        }
        goToStep(nextIndex);
        return;
      }

      if (type === EVENTS.TARGET_NOT_FOUND) {
        const nextIndex = index + 1;
        if (nextIndex >= steps.length) {
          completeTutorial();
          return;
        }
        goToStep(nextIndex);
      }
    },
    [completeTutorial, goToStep, steps.length],
  );

  if (!mounted || pathname === "/" || pathname === "/auth") return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      onEvent={handleEvent}
      tooltipComponent={TutorialTooltip}
      options={{
        skipScroll: true,
        overlayClickAction: false,
        dismissKeyAction: false,
        blockTargetInteraction: true,
        targetWaitTimeout: 3000,
        overlayColor: "rgba(23, 18, 15, 0.55)",
        zIndex: 80,
      }}
    />
  );
}
