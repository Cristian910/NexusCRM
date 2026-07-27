"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles, KanbanSquare, Link2, LineChart, ArrowRight, ArrowLeft, X,
} from "lucide-react";
import { Modal, ModalContent } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: Sparkles,      titleKey: "onboarding.step1Title", bodyKey: "onboarding.step1Body", accent: "hsl(var(--stage-contacted))" },
  { icon: KanbanSquare,  titleKey: "onboarding.step2Title", bodyKey: "onboarding.step2Body", accent: "hsl(var(--stage-lead))" },
  { icon: Link2,         titleKey: "onboarding.step3Title", bodyKey: "onboarding.step3Body", accent: "hsl(var(--success))" },
  { icon: LineChart,     titleKey: "onboarding.step4Title", bodyKey: "onboarding.step4Body", accent: "hsl(var(--stage-negotiation))" },
];

export function OnboardingTour() {
  const { t } = useTranslation();
  const { open, closeTour } = useOnboardingStore();
  const [stepIndex, setStepIndex] = useState(0);

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  function handleClose() {
    closeTour();
    // Reset for next time it's reopened via the help button
    setTimeout(() => setStepIndex(0), 200);
  }

  function handleNext() {
    if (isLast) {
      handleClose();
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  return (
    <Modal open={open} onOpenChange={(next) => { if (!next) handleClose(); }}>
      <ModalContent size="md" className="overflow-hidden p-0" hideClose>
        {/* Illustration band */}
        <div
          className="relative flex h-40 items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${step.accent}22, ${step.accent}08)` }}
        >
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 rounded-md p-1.5 transition-colors"
            style={{ color: "hsl(var(--muted-foreground))" }}
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: step.accent }}
            >
              <step.icon className="h-8 w-8" style={{ color: "white" }} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                {t(step.titleKey)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                {t(step.bodyKey)}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="mt-5 flex items-center justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn("h-1.5 rounded-full transition-all duration-300", i === stepIndex ? "w-5" : "w-1.5")}
                style={{ background: i === stepIndex ? step.accent : "hsl(var(--border))" }}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between">
            {isFirst ? (
              <button
                onClick={handleClose}
                className="text-xs font-medium transition-colors"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {t("onboarding.skip")}
              </button>
            ) : (
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setStepIndex((i) => i - 1)}>
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("onboarding.back")}
              </Button>
            )}

            <Button size="sm" className="gap-1.5" onClick={handleNext}>
              {isLast ? t("onboarding.getStarted") : t("onboarding.next")}
              {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
