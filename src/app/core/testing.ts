import { Answer, Evaluation, PracticeSession, Question } from './models';

export const makeQuestion = (over: Partial<Question> = {}): Question => ({
  id: 'angular-q1',
  technology: 'angular',
  level: 'Mid',
  type: 'MultipleChoice',
  text: 'سؤال؟',
  codeSnippet: null,
  codeLanguage: null,
  estimatedSeconds: 60,
  minVersion: null,
  maxVersion: null,
  tags: ['signals'],
  choices: [
    { id: 1, text: 'الف' },
    { id: 2, text: 'ب' },
  ],
  ...over,
});

export const makeAnswer = (over: Partial<Answer> = {}): Answer => ({
  correctChoiceIds: [2],
  shortAnswer: 'کوتاه',
  explanation: 'توضیح',
  commonMistake: null,
  followUpQuestion: null,
  ...over,
});

export const makeSession = (questions: Question[], over: Partial<PracticeSession> = {}): PracticeSession => ({
  mode: 'Learning',
  requestedCount: questions.length,
  totalQuestions: questions.length,
  estimatedMinutes: 1,
  timeLimitSeconds: null,
  questions,
  ...over,
});

export const makeEvaluation = (questions: Question[], correctIds: string[]): Evaluation => ({
  total: questions.length,
  correct: correctIds.length,
  percent: Math.round((100 * correctIds.length) / questions.length),
  byTechnology: [],
  byLevel: [],
  weakTags: [],
  weakQuestionIds: questions.filter((q) => !correctIds.includes(q.id)).map((q) => q.id),
  results: questions.map((q) => ({ questionId: q.id, isCorrect: correctIds.includes(q.id), answer: makeAnswer() })),
});
