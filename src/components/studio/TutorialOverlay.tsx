"use client";

import { useEffect, useRef, useState } from "react";
import {
  TUTORIALS,
  isTutorialEnabled,
  isTabCompleted,
  completeTab,
  setTutorialsEnabled,
} from "@/lib/studio/tutorial";

interface Props {
  tabId: string;
}

export function TutorialOverlay({ tabId }: Props) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(-1); // -1 = intro, 0+ = steps

  useEffect(() => {
    if (isTutorialEnabled() && !isTabCompleted(tabId) && TUTORIALS[tabId]) {
      setVisible(true);
      setStep(-1);
    } else {
      setVisible(false);
    }
  }, [tabId]);

  // Scroll to the target element when step changes
  useEffect(() => {
    if (!visible || step < 0) return;
    const tutorial = TUTORIALS[tabId];
    if (!tutorial) return;
    const current = tutorial.steps[step];
    if (current?.scrollTo) {
      // Small delay so DOM has rendered
      const timer = setTimeout(() => {
        const el = document.getElementById(current.scrollTo!);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          // Flash highlight
          el.classList.add("ring-2", "ring-fuchsia-500", "ring-offset-2", "ring-offset-zinc-900", "rounded-lg");
          setTimeout(() => {
            el.classList.remove("ring-2", "ring-fuchsia-500", "ring-offset-2", "ring-offset-zinc-900", "rounded-lg");
          }, 2000);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [step, visible, tabId]);

  const tutorial = TUTORIALS[tabId];
  if (!visible || !tutorial) return null;

  const isIntro = step === -1;
  const isLastStep = step === tutorial.steps.length - 1;
  const current = isIntro ? null : tutorial.steps[step];

  const next = () => {
    if (isLastStep) {
      completeTab(tabId);
      setVisible(false);
    } else {
      setStep(step + 1);
    }
  };

  const dismiss = () => {
    completeTab(tabId);
    setVisible(false);
  };

  const dismissAll = () => {
    setTutorialsEnabled(false);
    setVisible(false);
  };

  return (
    <div className="mb-4 rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/40 via-zinc-900 to-zinc-900 p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-fuchsia-600 text-sm">📖</span>
          <div>
            <div className="text-sm font-bold text-white">
              {isIntro ? `Welcome to ${tutorial.tabName}` : current?.title}
            </div>
            {!isIntro && (
              <div className="text-[10px] text-zinc-500">
                Step {step + 1} of {tutorial.steps.length}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={dismiss}
          className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:text-white transition"
          title="Dismiss this tutorial"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="mt-3 text-[13px] leading-relaxed text-zinc-300 whitespace-pre-line">
        {isIntro ? tutorial.intro : current?.body}
      </div>

      {/* Tip */}
      {!isIntro && current?.tip && (
        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <p className="text-[11px] text-amber-300">
            💡 <span className="font-semibold">Pro tip:</span> {current.tip}
          </p>
        </div>
      )}

      {/* Progress dots */}
      {!isIntro && tutorial.steps.length > 1 && (
        <div className="mt-3 flex items-center gap-1">
          {tutorial.steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? "w-4 bg-fuchsia-500"
                  : i < step
                    ? "w-1.5 bg-fuchsia-500/50"
                    : "w-1.5 bg-zinc-700"
              }`}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isIntro ? (
          <>
            <button
              onClick={next}
              className="rounded-xl bg-fuchsia-600 px-4 py-2 text-xs font-bold text-white hover:bg-fuchsia-500 transition"
            >
              Start Tutorial →
            </button>
            <button
              onClick={dismiss}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
            >
              I know this already
            </button>
          </>
        ) : (
          <>
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
              >
                ← Back
              </button>
            )}
            <button
              onClick={next}
              className="rounded-xl bg-fuchsia-600 px-4 py-2 text-xs font-bold text-white hover:bg-fuchsia-500 transition"
            >
              {isLastStep ? "Got it ✓" : "Next →"}
            </button>
            <button
              onClick={dismiss}
              className="rounded-xl px-3 py-2 text-xs text-zinc-600 hover:text-zinc-400 transition"
            >
              Skip
            </button>
          </>
        )}
        <button
          onClick={dismissAll}
          className="ml-auto text-[10px] text-zinc-600 hover:text-zinc-400 transition"
        >
          Turn off all tutorials
        </button>
      </div>
    </div>
  );
}
