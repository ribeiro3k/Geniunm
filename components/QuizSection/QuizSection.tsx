
import React, { useState, useEffect, useCallback } from 'react';
import { QuizQuestionType, UserAnswer, AuthenticatedUser, QuizAttemptRecord } from '../../types';
import { QUIZ_QUESTIONS } from '../../constants';
import QuizQuestionDisplay from './QuizQuestionDisplay';
import QuizResults from './QuizResults';
import GlassButton from '../ui/GlassButton'; // Renders as themed-button
import GlassCard from '../ui/GlassCard'; // Renders as themed-surface
import LoadingSpinner from '../ui/LoadingSpinner';

interface QuizSectionProps {
  currentUser: AuthenticatedUser;
}

const QuizSection: React.FC<QuizSectionProps> = ({ currentUser }) => {
  const [questions, setQuestions] = useState<QuizQuestionType[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  
  const [answerSubmittedForCurrent, setAnswerSubmittedForCurrent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);


  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  },[]);

  const loadQuestions = useCallback(() => {
    setIsLoading(true);
    const shuffledQuestions = shuffleArray(QUIZ_QUESTIONS);
    setQuestions(shuffledQuestions.map(q => {
      let newQ = {...q};
      if (newQ.options) { 
        newQ.options = shuffleArray(newQ.options);
      }
      // For ordering questions, the initial shuffle is handled in QuizQuestionDisplay
      return newQ;
    }));
    setIsLoading(false);
  }, [shuffleArray]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleAnswerSubmit = (answer: string | string[], isCorrect: boolean) => {
    const currentQuestion = questions[currentQuestionIndex];
    setUserAnswers(prev => {
      const existingAnswerIndex = prev.findIndex(ua => ua.questionId === currentQuestion.id);
      const newAnswerRecord: UserAnswer = { questionId: currentQuestion.id, answer, isCorrect };
      if (existingAnswerIndex > -1) {
        const updatedAnswers = [...prev];
        updatedAnswers[existingAnswerIndex] = newAnswerRecord;
        return updatedAnswers;
      }
      return [...prev, newAnswerRecord];
    });
    setAnswerSubmittedForCurrent(true); 
  };
  
  const handleNextAction = () => {
    if (!answerSubmittedForCurrent) {
      // This case should ideally be prevented by disabling the button or handled by child
      // Forcibly trigger submission if child didn't (e.g. for ordering questions)
      const currentQ = questions[currentQuestionIndex];
      if(currentQ && currentQ.type === 'ordering') {
         // This is a bit of a hack; ideally QuizQuestionDisplay's button directly calls something that updates parent
         // For now, assume child handles calling onAnswer for ordering questions if this button is pressed
      } else {
        console.warn("handleNextAction called before answer submitted for non-ordering. This should be handled by child.");
        return; 
      }
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setAnswerSubmittedForCurrent(false); 
    } else {
      const finalScore = calculateScoreAndSave();
      setScore(finalScore);
      setShowResults(true);
    }
  };

  const calculateScoreAndSave = () => {
    let currentScore = 0;
    userAnswers.forEach(ua => {
      if (ua.isCorrect) {
          currentScore++;
      }
    });

    if (currentUser) {
      const attemptRecord: QuizAttemptRecord = {
        id: crypto.randomUUID(),
        userId: currentUser.id,
        username: currentUser.type === 'admin' ? currentUser.username : (currentUser.type === 'simple' ? currentUser.username : currentUser.name),
        quizContentId: "main_quiz_v1", // Generic ID for the main quiz content item
        quizTitle: `Quiz de Conhecimento (${new Date().toLocaleDateString()})`, 
        timestamp: new Date().toISOString(),
        score: currentScore,
        totalQuestions: questions.length,
        answers: userAnswers,
        questionsUsed: QUIZ_QUESTIONS, // Store original questions for context, not the shuffled ones in state
      };
      try {
        const existingAttemptsJSON = localStorage.getItem('geniunmQuizAttempts');
        const existingAttempts: QuizAttemptRecord[] = existingAttemptsJSON ? JSON.parse(existingAttemptsJSON) : [];
        localStorage.setItem('geniunmQuizAttempts', JSON.stringify([...existingAttempts, attemptRecord]));
      } catch (e) {
        console.error("Failed to save quiz attempt to localStorage:", e);
      }
    }
    return currentScore;
  };

  const restartQuiz = () => {
    loadQuestions(); 
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowResults(false);
    setScore(0);
    setAnswerSubmittedForCurrent(false);
  };

  if (isLoading || questions.length === 0) {
    return (
        <section id="quiz" className="py-12 mt-8">
            <GlassCard className="max-w-4xl mx-auto text-center p-8"> {/* themed-surface */}
                <LoadingSpinner text="Carregando quiz..." />
            </GlassCard>
        </section>
    );
  }


  if (showResults) {
    return (
      <section id="quiz" className="py-12 mt-8">
        <GlassCard className="max-w-4xl mx-auto p-6 md:p-8"> {/* themed-surface */}
          <QuizResults userAnswers={userAnswers} questions={QUIZ_QUESTIONS} score={score} onRestart={restartQuiz} />
        </GlassCard>
      </section>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const userAnswerForCurrentQuestion = userAnswers.find(ua => ua.questionId === currentQuestion.id);

  let buttonText = "Verificar Resposta"; // Default, child component handles its own button now
  if (answerSubmittedForCurrent) {
    buttonText = currentQuestionIndex === questions.length - 1 ? 'Ver Resultados' : 'Próxima Pergunta';
  }
  
  // The primary "Next/Submit" button's visibility/text is now managed by answerSubmittedForCurrent state
  // Child component (QuizQuestionDisplay) handles its own "Verificar" button

  return (
    <section id="quiz" className="py-12 mt-8">
      <GlassCard className="max-w-4xl mx-auto p-6 md:p-8"> {/* themed-surface */}
        <h2 className="section-title">Quiz de Conhecimento</h2>
        <div className="text-center mb-6 text-[var(--text-secondary)]">
            Pergunta {currentQuestionIndex + 1} de {questions.length}
        </div>
        <div id="quiz-container" className="min-h-[300px]">
          <QuizQuestionDisplay
            question={currentQuestion}
            displayQuestionNumber={currentQuestionIndex + 1} 
            onAnswer={handleAnswerSubmit} 
            showFeedback={answerSubmittedForCurrent} 
            userAttempted={answerSubmittedForCurrent} 
            userAnswer={userAnswerForCurrentQuestion?.answer}
            isLastQuestion={currentQuestionIndex === questions.length - 1}
            onSubmitAnswer={handleNextAction} // This is for "Next Question" / "Show Results"
          />
        </div>
         {answerSubmittedForCurrent && (
            <div className="text-center mt-8 pt-6 border-t border-[var(--border-color-light)]">
            <GlassButton 
                onClick={handleNextAction}
                className="px-6 py-3 w-full md:w-auto"
            >
                {currentQuestionIndex === questions.length - 1 ? 'Ver Resultados' : 'Próxima Pergunta'}
            </GlassButton>
            </div>
        )}
      </GlassCard>
    </section>
  );
};

export default QuizSection;
