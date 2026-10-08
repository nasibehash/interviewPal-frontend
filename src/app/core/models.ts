export type Level = 'Junior' | 'Mid' | 'Senior';
export type QuestionType = 'MultipleChoice' | 'CodeOutput' | 'ShortAnswer' | 'Conceptual';
export type PracticeMode = 'Learning' | 'Interview' | 'Flashcard';
export type ReportReason = 'WrongAnswer' | 'Outdated' | 'Unclear' | 'Typo' | 'Other';

export const LEVELS: readonly Level[] = ['Junior', 'Mid', 'Senior'];

export interface Technology {
  slug: string;
  name: string;
  currentVersion: string | null;
  supportedFrom: string | null;
  questionCount: number;
  countByLevel: Record<Level, number>;
}

export interface Choice {
  id: number;
  text: string;
}

/** A question as shown to the learner: it never contains the answer. */
export interface Question {
  id: string;
  technology: string;
  level: Level;
  type: QuestionType;
  text: string;
  codeSnippet: string | null;
  codeLanguage: string | null;
  estimatedSeconds: number;
  minVersion: string | null;
  maxVersion: string | null;
  tags: string[];
  choices: Choice[];
}

export interface Answer {
  correctChoiceIds: number[];
  shortAnswer: string;
  explanation: string;
  commonMistake: string | null;
  followUpQuestion: string | null;
}

export interface QuestionDetail {
  question: Question;
  answer: Answer;
}

export interface PracticeSession {
  mode: PracticeMode;
  requestedCount: number;
  totalQuestions: number;
  estimatedMinutes: number;
  timeLimitSeconds: number | null;
  questions: Question[];
}

export interface StartPracticeRequest {
  technologies: string[];
  levels: Level[];
  count: number;
  mode: PracticeMode;
}

export interface SubmittedAnswer {
  questionId: string;
  choiceId?: number;
  knewIt?: boolean;
}

export interface CheckAnswerResult {
  questionId: string;
  isCorrect: boolean;
  answer: Answer;
}

export interface ScoreBreakdown {
  key: string;
  total: number;
  correct: number;
  percent: number;
}

export interface Evaluation {
  total: number;
  correct: number;
  percent: number;
  byTechnology: ScoreBreakdown[];
  byLevel: ScoreBreakdown[];
  weakTags: ScoreBreakdown[];
  weakQuestionIds: string[];
  results: CheckAnswerResult[];
}

export const isChoiceQuestion = (q: Pick<Question, 'type'>): boolean =>
  q.type === 'MultipleChoice' || q.type === 'CodeOutput';

export type LessonKind = 'Algorithm' | 'DesignPattern';

export interface LessonSummary {
  id: string;
  kind: LessonKind;
  title: string;
  category: string;
  level: Level;
  summary: string;
  tags: string[];
  estimatedMinutes: number;
}

export interface LessonImplementation {
  technology: string;
  title: string;
  language: string;
  code: string;
  walkthrough: string;
}

/** An exercise as shown to the learner: it never says which choice is right. */
export interface LessonExercise {
  id: string;
  text: string;
  choices: Choice[];
}

export interface LessonDetail extends LessonSummary {
  scenario: string;
  explanation: string;
  timeComplexity: string | null;
  spaceComplexity: string | null;
  whenToUse: string;
  whenNotToUse: string | null;
  commonMistake: string | null;
  technologies: string[];
  /** The implementation written for the requested technology; null when none was requested. */
  implementation: LessonImplementation | null;
  exercises: LessonExercise[];
}

export interface CheckExerciseResult {
  exerciseId: string;
  isCorrect: boolean;
  correctChoiceId: number;
  explanation: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  user: User;
}

/** Practice history, per-question stats and lesson answers of the logged-in learner, as the server keeps them. */
export interface ServerProgress {
  history: {
    id: string;
    at: string;
    mode: PracticeMode;
    total: number;
    correct: number;
    percent: number;
    byTechnology: ScoreBreakdown[];
  }[];
  questionStats: {
    questionId: string;
    technology: string;
    level: Level;
    text: string;
    tags: string[];
    seen: number;
    correct: number;
    lastCorrect: boolean;
    lastAt: string;
  }[];
  lessons: { lessonId: string; total: number; answers: Record<string, boolean> }[];
}

/** What the browser collected before the learner had an account; the server adds it to the account. */
export interface ImportProgressRequest {
  history: {
    at: string;
    mode: PracticeMode;
    total: number;
    correct: number;
    byTechnology: ScoreBreakdown[];
  }[];
  questionStats: {
    questionId: string;
    seen: number;
    correct: number;
    lastCorrect: boolean;
    lastAt: string;
  }[];
  lessons: { lessonId: string; answers: Record<string, boolean> }[];
}
