"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingStep {
  number: number;
  title: string;
  description: string;
}

interface OnboardingLayoutProps {
  steps: OnboardingStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  steps,
  currentStep,
  onNext,
  onPrev,
  isLoading = false,
  children,
}) => {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === steps.length;
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Tagline */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <p className="text-center text-sm font-medium text-slate-600">
            Find reliable hackathon teammates and co-founders
          </p>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-900">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-slate-600">{steps[currentStep - 1]?.title}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <motion.div
              className="h-full bg-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-12">
              <h1 className="text-3xl font-bold text-slate-950">
                {steps[currentStep - 1]?.title}
              </h1>
              <p className="mt-2 text-slate-600">
                {steps[currentStep - 1]?.description}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              {children}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <Button
            variant="outline"
            onClick={onPrev}
            disabled={isFirstStep || isLoading}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            variant="primary"
            onClick={onNext}
            isLoading={isLoading}
            disabled={isLoading}
            className="flex-1"
          >
            {isLastStep ? "Complete" : "Next"}
            {!isLastStep && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
