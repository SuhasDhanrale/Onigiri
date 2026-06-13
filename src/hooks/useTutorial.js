import { useCallback, useEffect, useMemo, useState } from 'react';
import { TUTORIAL_STEP_ORDER, TUTORIAL_STEPS, TUTORIAL_STORAGE_KEY, getPreviousTutorialStep } from '../config/tutorial.js';

const createInitialTutorialState = () => ({
  skipped: false,
  completed: {},
  activeStepId: null,
  bookOpen: false,
});

function readStoredTutorial() {
  if (typeof window === 'undefined') return createInitialTutorialState();

  try {
    const raw = window.localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!raw) return createInitialTutorialState();
    const parsed = JSON.parse(raw);
    return {
      ...createInitialTutorialState(),
      ...parsed,
      activeStepId: null,
      bookOpen: false,
      completed: parsed?.completed ?? {},
    };
  } catch {
    return createInitialTutorialState();
  }
}

function canShowStep(stepId, state) {
  if (!TUTORIAL_STEPS[stepId]) return false;
  if (state.skipped || state.completed?.[stepId]) return false;

  const previousStepId = getPreviousTutorialStep(stepId);
  if (previousStepId && !state.completed?.[previousStepId]) return false;

  return true;
}

export function useTutorial() {
  const [tutorial, setTutorial] = useState(readStoredTutorial);

  useEffect(() => {
    try {
      const { activeStepId, bookOpen, ...persistable } = tutorial;
      window.localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(persistable));
    } catch {
      // Tutorial persistence is helpful, not required.
    }
  }, [tutorial]);

  const activeStep = tutorial.activeStepId ? TUTORIAL_STEPS[tutorial.activeStepId] : null;

  const requestStep = useCallback((stepId) => {
    setTutorial(prev => {
      if (prev.activeStepId || !canShowStep(stepId, prev)) return prev;
      return { ...prev, activeStepId: stepId };
    });
  }, []);

  const completeStep = useCallback((stepId) => {
    setTutorial(prev => ({
      ...prev,
      activeStepId: prev.activeStepId === stepId ? null : prev.activeStepId,
      completed: {
        ...prev.completed,
        [stepId]: true,
      },
    }));
  }, []);

  const skipTutorial = useCallback(() => {
    setTutorial(prev => ({
      ...prev,
      skipped: true,
      activeStepId: null,
    }));
  }, []);

  const resetTutorial = useCallback(() => {
    setTutorial(createInitialTutorialState());
  }, []);

  const openBook = useCallback(() => {
    setTutorial(prev => ({ ...prev, bookOpen: true }));
  }, []);

  const closeBook = useCallback(() => {
    setTutorial(prev => ({ ...prev, bookOpen: false }));
  }, []);

  const completedCount = useMemo(
    () => TUTORIAL_STEP_ORDER.filter(stepId => tutorial.completed?.[stepId]).length,
    [tutorial.completed],
  );

  return {
    activeStep,
    completed: tutorial.completed,
    completedCount,
    skipped: tutorial.skipped,
    bookOpen: tutorial.bookOpen,
    requestStep,
    completeStep,
    skipTutorial,
    resetTutorial,
    openBook,
    closeBook,
  };
}
