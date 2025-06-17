
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { FlashcardContent } from '../../types';
import { generateFlashcardFromGemini } from '../../services/geminiService';
import { FLASHCARD_THEMES, API_KEY_ERROR_MESSAGE, FLASHCARD_LOADING_MESSAGES } from '../../constants';
import Flashcard from './Flashcard';
import HistoryItem from './HistoryItem';
import LoadingSpinner from '../ui/LoadingSpinner';
import GlassButton from '../ui/GlassButton'; // Renders as themed-button
import GlassCard from '../ui/GlassCard'; // Renders as themed-surface

const AnimatedLoadingText: React.FC<{ messages: string[] }> = ({ messages }) => {
    const [messageIndex, setMessageIndex] = useState(0);
    const [dots, setDots] = useState('');

    useEffect(() => {
        const messageInterval = setInterval(() => {
            setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
        }, 2500); 

        const dotsInterval = setInterval(() => {
            setDots((prevDots) => (prevDots.length >= 3 ? '' : prevDots + '.'));
        }, 500); 

        return () => {
            clearInterval(messageInterval);
            clearInterval(dotsInterval);
        };
    }, [messages]);

    return <p className="text-[var(--accent-primary)] opacity-90 text-sm">{messages[messageIndex]}{dots}</p>;
};


const FlashcardSection: React.FC = () => {
  const [currentCard, setCurrentCard] = useState<FlashcardContent | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [history, setHistory] = useState<FlashcardContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyAvailable, setApiKeyAvailable] = useState(true);
  const [copiedSide, setCopiedSide] = useState<'front' | 'back' | null>(null);
  const tempDivRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    tempDivRef.current = document.createElement('div');
    if (!process.env.API_KEY) {
      setApiKeyAvailable(false);
      setError(API_KEY_ERROR_MESSAGE);
      setCurrentCard({
        id: 'flashcard_error_config_apikey',
        front: "Erro de Configuração",
        back: API_KEY_ERROR_MESSAGE,
        theme: "API Key"
      });
    } else {
      handleGenerateCard(); 
    }
    
    return () => {
        // Clean up temp div if necessary, though for simple textContent it's less critical
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleGenerateCard = useCallback(async (theme?: string) => {
    if (!apiKeyAvailable) return;
    
    setIsLoading(true);
    setError(null);
    
    if (isFlipped) {
        setIsFlipped(false);
        await new Promise(resolve => setTimeout(resolve, 350)); 
    }
    
    const selectedTheme = theme || FLASHCARD_THEMES[Math.floor(Math.random() * FLASHCARD_THEMES.length)];
    const safeThemeIdPart = selectedTheme.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    try {
      const newCard = await generateFlashcardFromGemini(selectedTheme);
      if (newCard) {
        setCurrentCard(newCard);
        if (!history.some(hCard => hCard.id === newCard.id)) { // Check ID for history uniqueness
           setHistory(prev => [newCard, ...prev.slice(0, 9)]); 
        }
      } else {
        setError("Não foi possível gerar o card. Tente novamente.");
        setCurrentCard({
            id: `flashcard_error_generate_${safeThemeIdPart}`, 
            front: "Erro", 
            back: "Não foi possível gerar o card.", 
            theme: selectedTheme 
        });
      }
    } catch (e) {
      const err = e as Error;
      console.error(err);
      setError(err.message || "Erro ao gerar card.");
      setCurrentCard({
          id: `flashcard_error_api_${safeThemeIdPart}`, 
          front: "Erro API", 
          back: err.message, 
          theme: selectedTheme
        });
    } finally {
      setIsLoading(false);
    }
  }, [apiKeyAvailable, history, isFlipped]);

  const selectHistoryItem = async (item: FlashcardContent) => {
    if (isFlipped) {
        setIsFlipped(false);
        await new Promise(resolve => setTimeout(resolve, 350));
    }
    setCurrentCard(item);
  };

  const copyToClipboard = (text: string, side: 'front' | 'back') => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedSide(side);
        setTimeout(() => setCopiedSide(null), 1500); 
      })
      .catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Falha ao copiar texto.');
      });
  };
  
  const handleCopy = (event: React.MouseEvent<HTMLButtonElement>, content: string | React.ReactNode, side: 'front' | 'back') => {
    event.stopPropagation(); 
    if (typeof content === 'string') {
      copyToClipboard(content, side);
    } else if (tempDivRef.current && React.isValidElement(content)) {
        const tempRoot = ReactDOM.createRoot(tempDivRef.current); 
        tempRoot.render(<div>{content}</div>); 
        copyToClipboard(tempDivRef.current.textContent || "Conteúdo complexo, não foi possível copiar.", side);
        tempRoot.unmount();
    } else {
        copyToClipboard(String(content) || "Não foi possível copiar este conteúdo.", side);
    }
  };


  return (
    <section id="flashcards" className="py-12 mt-8">
      <GlassCard className="max-w-4xl mx-auto p-6 md:p-8"> {/* themed-surface */}
        <h2 className="section-title">Flashcards Interativos</h2>
        <p className="mb-8 text-center text-[var(--text-secondary)] text-sm">
          Clique no card para virar. Gere novos cards com IA sobre técnicas de vendas.
        </p>
        {error && !isLoading && <p className="text-[var(--error-rgb)] text-center mb-4 py-2 px-3 bg-[rgba(var(--error-rgb),0.1)] border border-[rgba(var(--error-rgb),0.3)] rounded-md">{error}</p>}
        
        <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-6 mb-8 relative min-h-[280px]">
          {copiedSide && currentCard && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-12 bg-[rgba(var(--success-rgb),0.9)] text-white text-xs px-3 py-1.5 rounded-md shadow-lg z-10">
              "{copiedSide === 'front' ? currentCard.front.substring(0,20)+'...' : 'Verso'}": Copiado!
            </div>
          )}
          <GlassCard className="w-full md:w-60 h-auto md:h-[250px] flex flex-col p-4 themed-surface-secondary"> {/* themed-surface-secondary for history card */}
            <h4 className="text-lg font-semibold mb-3 text-[var(--accent-primary)]">Histórico</h4>
            <div className="flashcard-history flex-grow max-h-48 md:max-h-full overflow-y-auto custom-scrollbar pr-2">
              {history.length > 0 ? (
                history.map((item) => (
                  <HistoryItem key={item.id} item={item} onSelect={selectHistoryItem} />
                ))
              ) : (
                <p className="text-sm text-[var(--text-secondary)] italic">Nenhum card gerado ainda.</p>
              )}
            </div>
          </GlassCard>
          
          <div className="w-[350px] h-[250px] flex items-center justify-center">
            {isLoading && !currentCard && <LoadingSpinner text="Gerando card inicial..." />}
            {!isLoading && !currentCard && !apiKeyAvailable && 
              <div className="flashcard-main">
                   <GlassCard className="flashcard-inner flex flex-col items-center justify-center p-4"> {/* themed-surface */}
                      <p className="text-red-400 text-center font-semibold text-lg">Chave de API Faltando</p>
                      <p className="text-[var(--text-secondary)] text-center text-sm mt-2">{API_KEY_ERROR_MESSAGE}</p>
                   </GlassCard>
              </div>
            }
            {currentCard && !isLoading && (
              <Flashcard
                frontContent={currentCard.front}
                backContent={currentCard.back}
                isFlipped={isFlipped}
                onFlip={() => setIsFlipped(!isFlipped)}
                onCopyFront={(e) => handleCopy(e, currentCard.front, "front")}
                onCopyBack={(e) => handleCopy(e, currentCard.back, "back")}
              />
            )}
             {isLoading && currentCard && ( 
                <div className="absolute w-[350px] h-[250px] bg-[rgba(var(--background-main-rgb),0.7)] backdrop-blur-sm flex flex-col items-center justify-center rounded-[var(--border-radius-large)] z-10">
                    <AnimatedLoadingText messages={FLASHCARD_LOADING_MESSAGES} />
                </div>
            )}
          </div>
          
          <GlassButton 
            onClick={() => handleGenerateCard()} 
            disabled={isLoading || !apiKeyAvailable}
            className="next-card-button w-full mt-4 md:mt-0 md:w-[100px] h-[60px] flex flex-col items-center justify-center text-sm self-center md:self-auto"
            title="Gerar novo card aleatório"
            aria-label="Gerar novo flashcard"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : (<><i className="fas fa-sync-alt text-xl mb-1"></i><span>Novo Card</span></>)}
          </GlassButton>
        </div>
        
        <div className="mt-6 pt-6 border-t border-[var(--border-color-light)]">
            <h4 className="text-lg font-semibold mb-4 text-[var(--accent-primary)] text-center">Gerar Card por Tema:</h4>
            <div className="flex flex-wrap justify-center gap-3">
                {FLASHCARD_THEMES.slice(0, 5).map(theme => ( 
                    <GlassButton 
                        key={theme}
                        onClick={() => handleGenerateCard(theme)}
                        disabled={isLoading || !apiKeyAvailable}
                        className="text-xs px-3 py-1.5 themed-button" // Ensure themed-button style
                    >
                        {theme}
                    </GlassButton>
                ))}
                 <GlassButton 
                        onClick={() => handleGenerateCard()}
                        disabled={isLoading || !apiKeyAvailable}
                        className="text-xs px-3 py-1.5 bg-[rgba(var(--accent-primary-rgb),0.7)] hover:bg-[rgba(var(--accent-primary-rgb),0.85)] border-[rgba(var(--accent-primary-rgb),0.7)]"
                    >
                        Tema Aleatório <i className="fas fa-dice ml-1"></i>
                    </GlassButton>
            </div>
        </div>

      </GlassCard>
    </section>
  );
};

export default FlashcardSection;

