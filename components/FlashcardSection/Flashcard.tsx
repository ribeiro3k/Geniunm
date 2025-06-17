
import React, { useRef, useEffect } from 'react';
import GlassCard from '../ui/GlassCard'; // Renders as .themed-surface

interface FlashcardProps {
  frontContent: string | React.ReactNode;
  backContent: string | React.ReactNode;
  isFlipped: boolean;
  onFlip: () => void;
  onCopyFront: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onCopyBack: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ 
  frontContent, 
  backContent, 
  isFlipped, 
  onFlip,
  onCopyFront,
  onCopyBack
}) => {
  const backContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFlipped && backContentRef.current) {
      setTimeout(() => {
        if (backContentRef.current) {
            backContentRef.current.scrollTop = 0;
        }
      }, 50);
    }
  }, [isFlipped, backContent]);

  const renderContent = (content: string | React.ReactNode, side: 'front' | 'back') => {
    if (typeof content !== 'string') {
      const textAlignClass = side === 'front' ? 'text-center' : 'text-left';
      return <div className={textAlignClass}>{content}</div>;
    }
    
    let htmlContent = content;
    htmlContent = htmlContent.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
    htmlContent = htmlContent.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');
    htmlContent = htmlContent.replace(/\n/g, '<br />');
    
    const textAlignClass = side === 'front' ? 'text-center' : 'text-left';

    // Ensure .prose styles are applied and max-width allows content to fill card.
    return <div className={`prose prose-sm max-w-none ${textAlignClass} w-full text-[var(--text-primary)]`} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };


  return (
    <div 
      id="flashcard-main" 
      className={`flashcard-main ${isFlipped ? 'flipped' : ''}`} 
      onClick={onFlip}
      role="button"
      tabIndex={0}
      aria-pressed={isFlipped}
      aria-label={isFlipped ? "Mostrar frente do card" : "Mostrar verso do card"}
    >
      <div className="flashcard-inner">
        {/* GlassCard will apply .themed-surface by default */}
        <GlassCard className="flashcard-front !p-5 flex flex-col items-center justify-center" aria-hidden={isFlipped}>
          {renderContent(frontContent, "front")}
          <button 
            className="copy-button" // Styles defined in index.html
            onClick={onCopyFront}
            title="Copiar Frente"
            aria-label="Copiar conteúdo da frente do card"
          >
            <i className="fas fa-copy"></i>
          </button>
        </GlassCard>
        <GlassCard className="flashcard-back !p-5" aria-hidden={!isFlipped}>
          <div 
            ref={backContentRef} 
            className="h-full w-full overflow-y-auto custom-scrollbar pr-2"
          >
            {renderContent(backContent, "back")}
          </div>
          <button 
            className="copy-button" // Styles defined in index.html
            onClick={onCopyBack}
            title="Copiar Verso"
            aria-label="Copiar conteúdo do verso do card"
          >
            <i className="fas fa-copy"></i>
          </button>
        </GlassCard>
      </div>
    </div>
  );
};

export default Flashcard;
