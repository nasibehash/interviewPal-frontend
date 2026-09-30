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
