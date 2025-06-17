
import React, { useState, useEffect } from 'react';
import { QuizQuestionType, QuizQuestionOption } from '../../types';
import SortableItem from './SortableItem';
import GlassCard from '../ui/GlassCard'; // Renders as themed-surface
import GlassButton from '../ui/GlassButton'; // Renders as themed-button

interface QuizQuestionDisplayProps {
  question: QuizQuestionType;
  displayQuestionNumber: number; 
  onAnswer: (answer: string | string[], isCorrect: boolean) => void;
  showFeedback: boolean;
  userAttempted: boolean; 
  userAnswer?: string | string[]; 
  isLastQuestion: boolean;
  onSubmitAnswer: () => void; 
}

const QuizQuestionDisplay: React.FC<QuizQuestionDisplayProps> = ({ 
  question, 
  displayQuestionNumber,
  onAnswer, 
  showFeedback,
  userAttempted,
  userAnswer,
  isLastQuestion,
  onSubmitAnswer,
}) => {
  const [selectedSingleOptionId, setSelectedSingleOptionId] = useState<string | undefined>(
    !question.allowMultipleAnswers && typeof userAnswer === 'string' ? 
    question.options?.find(opt => opt.text === userAnswer)?.id : undefined
  );

  const [selectedMultipleOptionIds, setSelectedMultipleOptionIds] = useState<string[]>(
    question.allowMultipleAnswers && Array.isArray(userAnswer) ? 
    (userAnswer as string[]).map(ansText => question.options?.find(opt => opt.text === ansText)?.id).filter(Boolean) as string[] : []
  );
  
  const [orderedItems, setOrderedItems] = useState(
    question.type === 'ordering' && question.orderedItems 
    ? [...question.orderedItems].sort(() => Math.random() - 0.5) 
    : []
  );
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  useEffect(() => {
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      if (question.allowMultipleAnswers) {
        setSelectedMultipleOptionIds(
          Array.isArray(userAnswer) ? 
          (userAnswer as string[]).map(ansText => question.options?.find(opt => opt.text === ansText)?.id).filter(Boolean) as string[] : []
        );
        setSelectedSingleOptionId(undefined);
      } else {
        setSelectedSingleOptionId(
          typeof userAnswer === 'string' ? question.options?.find(opt => opt.text === userAnswer)?.id : undefined
        );
        setSelectedMultipleOptionIds([]);
      }
    } else if (question.type === 'ordering' && question.orderedItems) {
      if (Array.isArray(userAnswer) && userAnswer.length > 0 && userAnswer.every(item => typeof item === 'string')) {
        const currentOrderFromAnswer = (userAnswer as string[])
          .map(text => question.orderedItems?.find(item => item.text === text))
          .filter(Boolean) as typeof question.orderedItems; 

        if (currentOrderFromAnswer.length === question.orderedItems.length) {
          setOrderedItems(currentOrderFromAnswer);
        } else { 
          setOrderedItems([...question.orderedItems].sort(() => Math.random() - 0.5));
        }
      } else { 
        setOrderedItems([...question.orderedItems].sort(() => Math.random() - 0.5));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, userAnswer]); 


  const handleSingleOptionSelect = (optionId: string) => {
    if (userAttempted) return; 
    setSelectedSingleOptionId(optionId);
  };

  const handleMultipleOptionToggle = (optionId: string) => {
    if (userAttempted) return;
    setSelectedMultipleOptionIds(prev => 
      prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
    );
  };
  
  const handleSubmit = () => {
    if (userAttempted) { 
        onSubmitAnswer(); 
        return;
    }

    let submittedAnswer: string | string[];
    let isCorrectFlag: boolean;

    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      if (question.allowMultipleAnswers) {
        const correctAnswers = question.options?.filter(opt => opt.correct).map(opt => opt.id) || [];
        submittedAnswer = selectedMultipleOptionIds.map(id => question.options?.find(opt => opt.id === id)?.text || "").filter(Boolean);
        isCorrectFlag = selectedMultipleOptionIds.length === correctAnswers.length &&
                        selectedMultipleOptionIds.every(id => correctAnswers.includes(id));
      } else {
        const selectedOpt = question.options?.find(opt => opt.id === selectedSingleOptionId);
        submittedAnswer = selectedOpt?.text || ""; 
        isCorrectFlag = selectedOpt?.correct || false;
      }
    } else if (question.type === 'ordering') {
      submittedAnswer = orderedItems.map(item => item.text);
      isCorrectFlag = orderedItems.every((item, index) => item.correctPosition === index + 1);
    } else { 
      submittedAnswer = ""; 
      isCorrectFlag = false; 
    }
    onAnswer(submittedAnswer, isCorrectFlag); 
};


  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    if (userAttempted && question.type === 'ordering') return;
    setDraggedItemId(id);
    event.dataTransfer.setData('text/plain', id); 
  };

  const handleDragEnd = (event: React.DragEvent<HTMLDivElement>) => {
    setDraggedItemId(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    event.preventDefault(); 
    if ((userAttempted && question.type === 'ordering') || !draggedItemId || draggedItemId === id) return;

    const draggedItemIndex = orderedItems.findIndex(item => item.id === draggedItemId);
    const targetItemIndex = orderedItems.findIndex(item => item.id === id);
    
    if (draggedItemIndex !== -1 && targetItemIndex !== -1) {
        const newOrderedItems = [...orderedItems];
        const [draggedItem] = newOrderedItems.splice(draggedItemIndex, 1);
        newOrderedItems.splice(targetItemIndex, 0, draggedItem);
        setOrderedItems(newOrderedItems);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (userAttempted && question.type === 'ordering') return;
    event.preventDefault();
    setDraggedItemId(null); 
  };
  
  let isActuallyCorrect = false;
  if (userAttempted && userAnswer !== undefined) {
      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        if (question.allowMultipleAnswers && Array.isArray(userAnswer)) {
            const correctOptionIds = question.options?.filter(o => o.correct).map(o => o.id) || [];
            const userAnswerOptionIds = (userAnswer as string[])
                .map(ansText => question.options?.find(opt => opt.text === ansText)?.id)
                .filter(Boolean) as string[];
            isActuallyCorrect = userAnswerOptionIds.length === correctOptionIds.length && 
                                userAnswerOptionIds.every(id => correctOptionIds.includes(id));
        } else if (!question.allowMultipleAnswers && typeof userAnswer === 'string') {
            isActuallyCorrect = question.options?.find(o => o.text === userAnswer)?.correct || false;
        }
      } else if (question.type === 'ordering' && Array.isArray(userAnswer) && question.orderedItems) {
          const correctTextOrder = question.orderedItems
              .slice() 
              .sort((a, b) => a.correctPosition - b.correctPosition) 
              .map(item => item.text); 

          if (userAnswer.length === correctTextOrder.length) {
              isActuallyCorrect = userAnswer.every((text, idx) => text === correctTextOrder[idx]);
          } else {
              isActuallyCorrect = false;
          }
      }
  }

  const feedbackCardBaseClass = 'themed-surface mt-6 p-4 text-sm'; // Using new themed-surface
  const feedbackCardBg = isActuallyCorrect ? 'border-[rgba(var(--success-rgb),0.5)] bg-[rgba(var(--success-rgb),0.15)]' : 'border-[rgba(var(--error-rgb),0.5)] bg-[rgba(var(--error-rgb),0.15)]';

  return (
    <div className="quiz-question mb-8 text-[var(--text-primary)]">
      <h3 className="text-xl font-semibold mb-1 text-[var(--accent-primary)]">Questão {displayQuestionNumber}</h3>
      <p className="mb-6 text-[var(--text-secondary)]">{question.text}</p>
      
      {(question.type === 'multiple-choice' || question.type === 'true-false') && question.options && (
        <div className="space-y-3">
          {question.options.map((option) => {
            const isSelected = question.allowMultipleAnswers 
                               ? selectedMultipleOptionIds.includes(option.id)
                               : selectedSingleOptionId === option.id;
            
            let optionClass = 'quiz-option p-3 md:p-4 flex items-center group themed-surface-secondary'; 
            if (userAttempted && showFeedback) { 
              if (option.correct) optionClass += ' correct-feedback'; // CSS defined in index.html
              else if (isSelected && !option.correct) optionClass += ' incorrect-feedback'; // CSS defined in index.html
              else optionClass += ' opacity-80'; 
            } else if (isSelected) { 
              optionClass += ' selected-style'; // CSS defined in index.html
            }

            return (
              <GlassCard // Renders as .themed-surface, quiz-option applies further styling
                key={option.id}
                className={optionClass}
                onClick={() => question.allowMultipleAnswers ? handleMultipleOptionToggle(option.id) : handleSingleOptionSelect(option.id)}
                role={question.allowMultipleAnswers ? "checkbox" : "radio"}
                aria-checked={isSelected}
                tabIndex={userAttempted ? -1 : 0} 
                onKeyPress={(e) => { if (!userAttempted && (e.key === 'Enter' || e.key === ' ')) question.allowMultipleAnswers ? handleMultipleOptionToggle(option.id) : handleSingleOptionSelect(option.id)}}
              >
                {question.allowMultipleAnswers && (
                  <div className={`w-5 h-5 border-2 rounded mr-3 flex-shrink-0 flex items-center justify-center transition-colors
                                 ${isSelected ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]' : 'border-[var(--text-secondary)] group-hover:border-[var(--accent-primary)]'}
                                 ${(userAttempted && showFeedback && option.correct) ? '!bg-[rgba(var(--success-rgb),0.8)] !border-[rgba(var(--success-rgb),0.6)]' : ''}
                                 ${(userAttempted && showFeedback && isSelected && !option.correct) ? '!bg-[rgba(var(--error-rgb),0.8)] !border-[rgba(var(--error-rgb),0.6)]' : ''}
                                 `}>
                    {isSelected && <i className="fas fa-check text-xs text-[var(--text-on-accent)]"></i>}
                  </div>
                )}
                <p className="flex-grow text-[var(--text-primary)]">{option.text}</p>
              </GlassCard>
            );
          })}
        </div>
      )}

      {question.type === 'ordering' && question.orderedItems && (
        <>
          <div id={`sortable-container-${question.id}`} className="space-y-3">
            {orderedItems.map((item, index) => (
              <SortableItem
                key={item.id}
                id={item.id}
                text={`${index + 1}. ${item.text}`} 
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                isDragging={draggedItemId === item.id}
                className={userAttempted && showFeedback ? 
                    (item.correctPosition === index + 1 ? 
                        'correct-feedback' : 
                        'incorrect-feedback') 
                    : '' // Base SortableItem (GlassCard) will use themed-surface
                }
              />
            ))}
          </div>
        </>
      )}
      
      { (question.type !== 'ordering' && !userAttempted) && (
        <div className="mt-6 text-center">
            <GlassButton 
                onClick={handleSubmit}
                className="px-6 py-2.5"
                disabled={(question.allowMultipleAnswers ? selectedMultipleOptionIds.length === 0 : !selectedSingleOptionId) || userAttempted}
            >
                Verificar Resposta
            </GlassButton>
        </div>
      )}
       { (question.type === 'ordering' && !userAttempted) && (
        <div className="mt-6 text-center">
            <GlassButton 
                onClick={handleSubmit}
                className="px-6 py-2.5"
                disabled={userAttempted}
            >
                Verificar Ordem
            </GlassButton>
        </div>
      )}


      {userAttempted && showFeedback && (
        <GlassCard className={`${feedbackCardBaseClass} ${feedbackCardBg}`}> 
          <p className="font-semibold mb-1 text-base text-[var(--text-primary)]">
            {isActuallyCorrect ? "Resposta Correta!" : "Resposta Incorreta."}
          </p>
          <div className="text-[var(--text-secondary)] prose prose-sm max-w-none">{question.feedback}</div>
          {question.type === 'ordering' && question.correctOrderFeedback && !isActuallyCorrect && (
            <div className="mt-2">
              <p className="font-semibold text-[var(--text-primary)]">Ordem correta:</p>
              <ol className="list-decimal list-inside pl-4 mt-1 text-[var(--text-secondary)] space-y-1">
                {question.correctOrderFeedback.map((item, idx) => <li key={idx}>{item}</li>)}
              </ol>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
};

export default QuizQuestionDisplay;
