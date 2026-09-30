import { Answer, Question, SubmittedAnswer, isChoiceQuestion } from './models';

/**
 * Turns a "I knew it / I did not" self-assessment into an answer the API can grade.
 * Short-answer and conceptual questions accept `knewIt` directly. Choice questions need a choice id, so a learner who
 * knew the answer submits the correct choice and one who did not submits a wrong one.
 */
export function answerFromSelfAssessment(q: Question, answer: Answer, knew: boolean): SubmittedAnswer {
  if (!isChoiceQuestion(q)) {
    return { questionId: q.id, knewIt: knew };
  }

  const correct = new Set(answer.correctChoiceIds);
  const pick = q.choices.find((c) => correct.has(c.id) === knew) ?? q.choices[0];
  return { questionId: q.id, choiceId: pick.id };
}
