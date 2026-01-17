export type LearnerLike = {
  status?: string | null;
};

const TEMPORARY_STATUS = 'assessment_due';

export const isTemporaryLearner = (learner?: LearnerLike | null): boolean => {
  return learner?.status === TEMPORARY_STATUS;
};

export const resolveLearnerType = (
  learner: LearnerLike | null | undefined,
  fallback: 'general' | 'temporary' = 'general'
): 'general' | 'temporary' => {
  if (isTemporaryLearner(learner)) {
    return 'temporary';
  }
  return fallback;
};
