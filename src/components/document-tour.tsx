"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const DEFAULT_STEPS: TourStep[] = [
  {
    target: "sidebar",
    title: "Navigation",
    description: "Access your workspaces, documents, and favorites from the sidebar.",
    position: "right",
  },
  {
    target: "toolbar",
    title: "Document Tools",
    description: "Use the toolbar to format, share, publish, and use AI features.",
    position: "bottom",
  },
  {
    target: "editor",
    title: "Block Editor",
    description: "Type '/' for commands, drag blocks to reorder, and collaborate in real-time.",
    position: "bottom",
  },
];

export function DocumentTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const dismissed = localStorage.getItem("collabdocs-tour-dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem("collabdocs-tour-dismissed", "true");
  }

  function next() {
    if (step < DEFAULT_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  }

  if (!visible) return null;

  const current = DEFAULT_STEPS[step]!;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
              {step + 1} / {DEFAULT_STEPS.length}
            </span>
            <button onClick={dismiss} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">{current.title}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">{current.description}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={next}
              className="ml-auto rounded-xl bg-blue-500 hover:bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-all"
            >
              {step < DEFAULT_STEPS.length - 1 ? "Next" : "Get Started"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
