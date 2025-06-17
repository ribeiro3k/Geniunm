
import React from 'react';
import { UserAnswer, QuizQuestionType } from '../../types';
import GlassCard from '../ui/GlassCard'; // Renders as themed-surface
import GlassButton from '../ui/GlassButton'; // Renders as themed-button

interface QuizResultsProps {
  userAnswers: UserAnswer[];
  questions: QuizQuestionType[];
  score: number;
  onRestart: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ userAnswers, questions, score, onRestart }) => {
  let feedbackMessage = '';
  const totalQuestions = questions.length;
  const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

  if (percentage === 100) {
    feedbackMessage = 'Excelente! Você domina o conteúdo perfeitamente! 🎉';
  } else if (percentage >= 70) {
    feedbackMessage = 'Muito bom! Você tem um bom conhecimento do material. 👍';
  } else if (percentage >= 50) {
    feedbackMessage = 'Bom trabalho! Continue estudando para melhorar. 😊';
  } else {
    feedbackMessage = 'Continue praticando. Revise o material e tente novamente. 📚';
  }

  return (
    <div id="quiz-results">
      <h3 className="text-2xl font-semibold mb-6 text-center text-[var(--accent-primary)]">Resultados do Quiz</h3>
      <GlassCard className="p-6 md:p-8"> {/* themed-surface */}
        <p className="text-3xl mb-4 text-center text-[var(--text-primary)]">
          Você acertou <span className="font-bold text-[rgba(var(--success-rgb),0.9)]">{score}</span> de <span className="font-bold">{totalQuestions}</span> questões!
        </p>
        <p className="text-xl text-center mb-8 text-[var(--accent-primary)] opacity-90">{feedbackMessage}</p>
        
        <div className="space-y-4 mb-8">
          <h4 className="text-lg font-semibold text-[var(--accent-primary)]">Resumo das respostas:</h4>
          {questions.map((q, index) => {
            const userAnswer = userAnswers.find(ua => ua.questionId === q.id);
            let displayAnswer: string | React.ReactNode = <span className="italic text-[var(--text-secondary)]">Não respondida</span>;
            let correctAnswerText: string | React.ReactNode = "";

            if (q.type === 'multiple-choice' && q.options) {
                correctAnswerText = q.options.find(opt => opt.correct)?.text || "N/A";
                if (userAnswer) displayAnswer = userAnswer.answer as string;
            } else if (q.type === 'true-false' && q.options) {
                correctAnswerText = q.options.find(opt => opt.correct)?.text || "N/A";
                 if (userAnswer) displayAnswer = userAnswer.answer as string;
            } else if (q.type === 'ordering' && q.correctOrderFeedback) {
                correctAnswerText = (
                    <ol className="list-decimal list-inside text-sm text-[rgba(var(--success-rgb),0.8)]">
                        {q.correctOrderFeedback.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ol>
                );
                 if (userAnswer && Array.isArray(userAnswer.answer)) {
                    displayAnswer = (
                        <ol className="list-decimal list-inside text-sm">
                            {(userAnswer.answer as string[]).map((item, idx) => <li key={idx}>{item}</li>)}
                        </ol>
                    );
                } else if (userAnswer) {
                    displayAnswer = userAnswer.answer as string; 
                }
            }
            
            const isCorrect = userAnswer ? userAnswer.isCorrect : false;
            const feedbackClass = isCorrect ? 'bg-[rgba(var(--success-rgb),0.1)] border-[rgba(var(--success-rgb),0.3)]' : 'bg-[rgba(var(--error-rgb),0.1)] border-[rgba(var(--error-rgb),0.3)]';

            return (
              <GlassCard key={q.id} className={`p-4 themed-surface-secondary ${feedbackClass}`}> {/* themed-surface-secondary with feedback border/bg */}
                <p className="font-semibold text-[var(--text-primary)]">{q.id}. {q.text}</p>
                <p className="text-sm mt-1">Sua resposta: <span className={isCorrect ? 'text-[rgba(var(--success-rgb),0.9)]' : 'text-[rgba(var(--error-rgb),0.9)]'}>{displayAnswer}</span></p>
                {!isCorrect && (
                    <p className="text-sm mt-1">Resposta correta: <span className="text-[rgba(var(--success-rgb),0.9)]">{correctAnswerText}</span></p>
                )}
              </GlassCard>
            );
          })}
        </div>
        
        <div className="text-center">
          <GlassButton onClick={onRestart} className="px-6 py-3"> {/* themed-button */}
            Tentar Novamente
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};

export default QuizResults;
