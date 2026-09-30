import { describe, expect, it } from 'vitest';
import { answerFromSelfAssessment } from './self-assessment';
import { makeAnswer, makeQuestion } from './testing';

describe('answerFromSelfAssessment', () => {
  it('sends knewIt for short-answer questions', () => {
    const q = makeQuestion({ type: 'ShortAnswer', choices: [] });
    expect(answerFromSelfAssessment(q, makeAnswer({ correctChoiceIds: [] }), true)).toEqual({ questionId: q.id, knewIt: true });
  });

  it('picks the correct choice when the learner knew a choice question', () => {
    expect(answerFromSelfAssessment(makeQuestion(), makeAnswer(), true)).toEqual({ questionId: 'angular-q1', choiceId: 2 });
  });

  it('picks a wrong choice when the learner did not know', () => {
    expect(answerFromSelfAssessment(makeQuestion(), makeAnswer(), false)).toEqual({ questionId: 'angular-q1', choiceId: 1 });
  });
});
