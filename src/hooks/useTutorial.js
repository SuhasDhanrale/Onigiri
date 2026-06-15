import { useCallback, useEffect, useMemo, useState } from 'react';
import { TUTORIAL_STEP_ORDER, TUTORIAL_STEPS, TUTORIAL_STORAGE_KEY, getPreviousTutorialStep } from '../config/tutorial.js';
import { readStorageJson, writeStorageJson } from '../platforms/gameStorage.js';

const createInitialTutorialState = () => ({
  skipped: false,
  completed: {},
  activeStepId: null,
  pausedStepId: null,
  bookOpen: false,
  freeSpellUsed: false,
});

function readStoredTutorial() {
  const parsed = readStorageJson(TUTORIAL_STORAGE_KEY, null);
  if (!parsed || typeof parsed !== 'object') return createInitialTutorialState();

  return {
    ...createInitialTutorialState(),
    ...parsed,
    activeStepId: null,
    pausedStepId: null,
    bookOpen: false,
    completed: parsed?.completed ?? {},
  };
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
    const { activeStepId, pausedStepId, bookOpen, ...persistable } = tutorial;
    writeStorageJson(TUTORIAL_STORAGE_KEY, persistable);
  }, [tutorial]);

  const activeStep = tutorial.activeStepId ? TUTORIAL_STEPS[tutorial.activeStepId] : null;

  const requestStep = useCallback((stepId) => {
    setTutorial(prev => {
      if (prev.pausedStepId === stepId) return prev;
      if (prev.activeStepId || !canShowStep(stepId, prev)) return prev;
      return { ...prev, activeStepId: stepId };
    });
  }, []);

  const completeStep = useCallback((stepId) => {
    setTutorial(prev => ({
      ...prev,
      activeStepId: prev.activeStepId === stepId ? null : prev.activeStepId,
      pausedStepId: prev.pausedStepId === stepId ? null : prev.pausedStepId,
      completed: {
        ...prev.completed,
        [stepId]: true,
      },
    }));
  }, []);

  const pauseStep = useCallback((stepId) => {
    setTutorial(prev => {
      if (prev.activeStepId !== stepId) return prev;
      return {
        ...prev,
        activeStepId: null,
        pausedStepId: stepId,
      };
    });
  }, []);

  const skipTutorial = useCallback(() => {
    setTutorial(prev => ({
      ...prev,
      skipped: true,
      activeStepId: null,
      pausedStepId: null,
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

  const consumeFreeSpell = useCallback(() => {
    setTutorial(prev => ({ ...prev, freeSpellUsed: true }));
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
    freeSpellUsed: tutorial.freeSpellUsed,
    requestStep,
    completeStep,
    pauseStep,
    skipTutorial,
    resetTutorial,
    openBook,
    closeBook,
    consumeFreeSpell,
  };
}
