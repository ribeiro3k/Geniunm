

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chat } from '@google/genai';
import { Message, Scenario, Objection, SimulatorBehavioralProfile, AuthenticatedUser, SimulationRecord, ParsedEvaluation as ParsedEvaluationType, SimulationUserRole, ParsedErrorOrSuccessItem } from '../../types';
import { SIMULATOR_SCENARIOS, API_KEY_ERROR_MESSAGE, OBJECTIONS_LIST, FLAVIO_BOSS_SCENARIO, SIMULATION_HEADINGS, LOCAL_STORAGE_SIMULATION_RECORDS_KEY } from '../../constants';
import { startChatSession, sendChatMessage, transcribeAudioWithGemini, generateProceduralLeadScenarioFromGemini } from '../../services/geminiService';
import MessageBubble from './MessageBubble';
import AudioControls from './AudioControls';
import LoadingSpinner from '../ui/LoadingSpinner';
import GlassButton from '../ui/GlassButton';
import GlassCard from '../ui/GlassCard';

// Helper: Convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error("Failed to read blob as base64 string."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const AI_CHUNK_MESSAGE_DELAY_MIN_MS = 1000;
const AI_CHUNK_MESSAGE_DELAY_MAX_MS = 2500;
const DELIVERY_DELAY_MS_MIN = 500;
const DELIVERY_DELAY_MS_MAX = 1500;

interface PersonaInfo { // Kept for historical context if needed by other parts, but ParsedEvaluation is prime
    personagem?: string;
    cursoDesejado?: string;
    situacao?: string;
    motivacao?: string;
    comportamentoDesignado?: string;
}

interface StarRatings { // Kept for historical context
    acolhimento?: number;
    clareza?: number;
    argumentacao?: number;
    fechamento?: number;
}


interface SimulatorSectionProps {
  currentUser: AuthenticatedUser; 
  bossBattleTriggerFromApp?: boolean;
  onBossBattleTriggerConsumed?: () => void;
}

interface ChatHeaderProps {
  leadName: string;
  leadSource: string | null;
  isAiTyping: boolean;
  leadAvatarUrl?: string;
  simulationActive: boolean;
  isTerminalStateReached: boolean;
  isLoadingAI: boolean;
  isAiTypingChunks: boolean;
  onEndSimulationClick: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
    leadName,
    leadSource,
    isAiTyping,
    leadAvatarUrl,
    simulationActive,
    isTerminalStateReached,
    isLoadingAI,
    isAiTypingChunks,
    onEndSimulationClick,
}) => (
  <div className="simulator-chat-header-bg p-3 flex items-center border-b border-[var(--color-border)] sticky top-0 z-10 min-h-[60px] shadow-sm">
    <div
        className="w-10 h-10 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-lg font-semibold mr-3 flex-shrink-0 overflow-hidden"
        aria-label={`Foto de perfil de ${leadName}`}
    >
        {leadAvatarUrl ? (
            <img src={leadAvatarUrl} alt={leadName} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
        ) : (
            leadName ? leadName.charAt(0).toUpperCase() : 'L'
        )}
    </div>
    <div className="flex-grow overflow-hidden">
        <h3 className="text-md font-medium text-[var(--color-text)] truncate" title={leadName || "Lead Desconhecido"}>{leadName || "Lead Desconhecido"}</h3>
        {(isAiTyping || isAiTypingChunks) ? (
            <p className="text-xs text-[var(--color-primary)] animate-pulse">digitando...</p>
        ) : leadSource ? (
            <p className="text-xs text-[var(--color-text-light)] truncate" title={`Origem: ${leadSource}`}>Origem: {leadSource}</p>
        ) : (
             <p className="text-xs text-[var(--color-text-light)]">Online</p>
        )}
    </div>
    {simulationActive && !isTerminalStateReached && (
        <GlassButton
            onClick={onEndSimulationClick}
            disabled={isLoadingAI || isAiTypingChunks}
            className="!p-2 !px-3 text-xs !bg-[rgba(var(--error-rgb),0.8)] hover:!bg-[var(--error)] !text-white !border-[rgba(var(--error-rgb),0.8)] ml-2 flex-shrink-0"
            title="Finalizar Simulação Manualmente"
            aria-label="Finalizar Simulação"
        >
           <i className="fas fa-flag-checkered mr-1.5"></i> Finalizar
        </GlassButton>
    )}
  </div>
);

interface ChatInputAreaProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  isLoadingAI: boolean;
  isAiTypingChunks: boolean;
  simulationActive: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  onStartRecord: () => void;
  onStopRecord: () => void;
  isTerminalStateReached: boolean;
  isGeneratingScenario: boolean;
  isChatEmptyForUserStart: boolean;
  currentScenarioInitialMessage?: string;
  simulationMode?: SimulationMode;
  messages: Message[]; 
}

const ChatInputArea: React.FC<ChatInputAreaProps> = (props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 90; 
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, []);

  useEffect(() => {
    handleInputHeight();
  }, [props.inputValue, handleInputHeight]);

  let placeholderText =
    (props.isLoadingAI || props.isGeneratingScenario) ? "Aguarde..." :
    (props.isChatEmptyForUserStart && !props.currentScenarioInitialMessage && props.simulationMode === 'completo') ? "Digite sua primeira mensagem para o lead..." :
    (props.simulationActive ? 
      (props.isTerminalStateReached ? "Simulação encerrada." : "Digite sua mensagem...") 
      : "Simulação encerrada. Verifique o resultado.");
  

  return (
    <div className="simulator-chat-input-bg p-2 sm:p-3 border-t border-[var(--color-border)] flex items-end gap-2 sticky bottom-0">
      <div className="chat-input-wrapper flex-grow flex items-center overflow-hidden">
        <textarea
          ref={textareaRef}
          rows={1}
          className="chat-input-textarea flex-1 p-0 appearance-none !rounded-none !border-0 focus:outline-none focus:shadow-none resize-none overflow-y-auto custom-scrollbar"
          placeholder={placeholderText}
          value={props.inputValue}
          onChange={(e) => props.onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); props.onSendMessage(); }}}
          onInput={handleInputHeight}
          disabled={props.isLoadingAI || props.isAiTypingChunks || !props.simulationActive || props.isRecording || props.isTranscribing || props.isTerminalStateReached || props.isGeneratingScenario}
          aria-label="Campo de entrada da mensagem"
        />
         <div className="flex-shrink-0 ml-1">
            <AudioControls
                isRecording={props.isRecording}
                isTranscribing={props.isTranscribing}
                onStartRecord={props.onStartRecord}
                onStopRecord={props.onStopRecord}
                disabled={props.isLoadingAI || props.isAiTypingChunks || !props.simulationActive || props.isTerminalStateReached || props.isGeneratingScenario}
            />
        </div>
      </div>
      <GlassButton
        onClick={props.onSendMessage}
        className="!rounded-full w-11 h-11 md:w-12 md:h-12 flex items-center justify-center !p-0 flex-shrink-0 shadow-md"
        disabled={props.isLoadingAI || props.isAiTypingChunks || !props.simulationActive || !props.inputValue.trim() || props.isRecording || props.isTranscribing || props.isTerminalStateReached || props.isGeneratingScenario}
        aria-label="Enviar mensagem"
      >
        <i className="fas fa-paper-plane text-lg md:text-xl"></i>
      </GlassButton>
    </div>
  );
};

const BossWarningOverlay: React.FC<{ onStart: () => void }> = ({ onStart }) => (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.9)] flex flex-col items-center justify-center z-[100] p-6 text-center">
        <div className="bg-red-700 border-4 border-yellow-300 p-6 md:p-8 rounded-lg shadow-2xl max-w-md animate-pulse">
            <i className="fas fa-skull-crossbones text-6xl md:text-7xl text-yellow-200 mb-5"></i>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3 uppercase tracking-wider" style={{ fontFamily: "'Impact', 'Arial Black', sans-serif", textShadow: "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000" }}>
                CAUTION!
            </h2>
            <p className="text-xl md:text-2xl text-yellow-200 mb-6 font-semibold">
                Você está prestes a enfrentar o CHEFÃO!
            </p>
            <p className="text-md md:text-lg text-gray-100 mb-8">
                Prepare-se para um desafio de alto nível. Somente os melhores consultores conseguem convencê-lo.
            </p>
            <GlassButton onClick={onStart} className="!bg-yellow-300 !text-black hover:!bg-yellow-400 !text-lg md:!text-xl px-8 py-3 font-bold tracking-wide !border-yellow-500">
                Enfrentar o Desafio! <i className="fas fa-shield-alt ml-2"></i>
            </GlassButton>
        </div>
    </div>
);

const StarRating: React.FC<{ rating: number | null; maxStars?: number; label?: string }> = ({ rating, maxStars = 5, label }) => {
  const displayRating = rating !== null ? Math.max(0, Math.min(rating, maxStars)) : null; 
  return (
    <div className="flex items-center justify-between text-sm">
      {label && <span className="text-[var(--color-text-light)] mr-2">{label}:</span>}
      {displayRating !== null ? (
        <div className="star-rating-feedback">
          {Array.from({ length: maxStars }, (_, i) => (
            <span key={i} className={`star ${i < displayRating ? 'filled' : 'empty'}`}>
              <i className={`fas fa-star`}></i>
            </span>
          ))}
        </div>
      ) : (
        <span className="text-[var(--color-text-light)]">N/A</span>
      )}
    </div>
  );
};


interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  initiallyOpen?: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, initiallyOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        contentRef.current.style.maxHeight = `${contentRef.current.scrollHeight}px`;
      } else {
        contentRef.current.style.maxHeight = '0px';
      }
    }
  }, [isOpen, children]); 

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };
  
  const contentKey = typeof children === 'string' ? children.substring(0, 20) : title;


  return (
    <div className="accordion-item">
      <button
        type="button"
        className="accordion-button"
        onClick={toggleAccordion}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${title.replace(/\s+/g, '-')}`}
      >
        <span>{title}</span>
        <span className={`accordion-icon ${isOpen ? 'open' : ''}`}>
            <i className={`fas fa-chevron-down`}></i>
        </span>
      </button>
      <div
        ref={contentRef}
        key={contentKey}
        id={`accordion-content-${title.replace(/\s+/g, '-')}`}
        className={`accordion-content ${isOpen ? 'open' : ''} prose prose-sm max-w-none text-[var(--color-text-light)]`} 
        aria-hidden={!isOpen}
      >
        {children}
      </div>
    </div>
  );
};


type SimulationMode = "completo" | "objecao";

const SimulatorSection: React.FC<SimulatorSectionProps> = ({ 
    currentUser, 
    bossBattleTriggerFromApp, 
    onBossBattleTriggerConsumed,
}) => {
  const [simulationMode, setSimulationMode] = useState<SimulationMode>("completo");
  // simulationUserRole is always 'userAsConsultant' now
  
  const [selectedObjectionForMode, setSelectedObjectionForMode] = useState<Objection | null>(OBJECTIONS_LIST[0] || null);

  const [simulationActive, setSimulationActive] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [currentLeadDisplayName, setCurrentLeadDisplayName] = useState<string>("Lead");
  const [detectedLeadSource, setDetectedLeadSource] = useState<string | null>(null);

  const [showBossWarningOverlay, setShowBossWarningOverlay] = useState(false);
  const [isBossModeActive, setIsBossModeActive] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [isAiTypingChunks, setIsAiTypingChunks] = useState(false);

  const [parsedEvaluation, setParsedEvaluation] = useState<ParsedEvaluationType | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedAudioMimeTypeRef = useRef<string>('audio/webm');
  const [isNextMessageFromAudio, setIsNextMessageFromAudio] = useState(false);


  const chatContainerRef = useRef<HTMLDivElement>(null); 
  const resultsViewRef = useRef<HTMLDivElement>(null); 
  const chatViewRef = useRef<HTMLDivElement>(null); 

  const [error, setError] = useState<string | null>(null);
  const [apiKeyAvailable, setApiKeyAvailable] = useState(true);

  const currentChatRef = useRef<Chat | null>(null);
  const userMessageStatusTimers = useRef<Record<string, number[]>>({});

  const [isSmallScreen, setIsSmallScreen] = useState(window.matchMedia("(max-width: 767px)").matches);
  

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsSmallScreen(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (bossBattleTriggerFromApp) {
        setShowBossWarningOverlay(true);
        onBossBattleTriggerConsumed?.();
    }
  }, [bossBattleTriggerFromApp, onBossBattleTriggerConsumed]);

  const isTerminalStateReached = !!(parsedEvaluation); // Simplified as AI seller mode is removed
  const isSmallScreenEndView = isTerminalStateReached && isSmallScreen;

  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyAvailable(false);
      setError(API_KEY_ERROR_MESSAGE);
    }
    return () => {
        Object.values(userMessageStatusTimers.current).forEach(timers => timers.forEach(clearTimeout));
    };
  }, []);

  useEffect(() => {
    if (simulationActive && !isTerminalStateReached && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    if (isSmallScreenEndView && chatViewRef.current?.contains(chatContainerRef.current) && chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isAiTypingChunks, simulationActive, isTerminalStateReached, isSmallScreenEndView]);

  const updateMessageStatus = useCallback((messageId: string, newStatus: Message['status']) => {
    setMessages(prevMessages => prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, status: newStatus } : msg
    ));
  }, []);

  const clearTimersForMessage = (messageId: string) => {
      if (userMessageStatusTimers.current[messageId]) {
          userMessageStatusTimers.current[messageId].forEach(clearTimeout);
          delete userMessageStatusTimers.current[messageId];
      }
  };

  const extractLeadNameFromScenario = (scenario: Scenario | null): string => {
    if (!scenario) return "Lead";
    if (scenario.isBoss) return FLAVIO_BOSS_SCENARIO.title.split(" ")[0]; 

    let fullName = "";
    // Try to extract from the specific "LEAD_NAME:" or "Nome:" field in context first
    const leadNameMatch = scenario.context?.match(/LEAD_NAME:\s*([^\n]+)/i) ||
                          scenario.context?.match(/Nome:\s*([^\n(]+)/i);

    if (leadNameMatch && leadNameMatch[1]) {
        fullName = leadNameMatch[1].trim();
    } else {
        // Fallback to title if specific field not found
        const titleParts = scenario.title.split(/[\(\-]/);
        fullName = titleParts[0].trim();
    }
    return fullName.split(" ")[0] || "Lead"; // Return first name or "Lead"
  };

  const extractLeadSourceFromScenarioContext = (context: string | null): string | null => {
    if (!context) return null;
    const lowerContext = context.toLowerCase();
    const hintMatch = lowerContext.match(/lead_source_hint:\s*([^\n]+)/i) ||
                      lowerContext.match(/como chegou até nós \(pista\):\s*([^\n]+)/i);
    let hintText = "";
    if (hintMatch && hintMatch[1]) hintText = hintMatch[1].trim();
    else {
        // Fallback if specific hint field is not present
        const genericSourceMatch = lowerContext.match(/origem sugerida: ([^\.\n]+)/i);
        if (genericSourceMatch && genericSourceMatch[1]) hintText = genericSourceMatch[1].trim();
        else { // Broad keyword check as a last resort
            if (lowerContext.includes("instagram")) return "Instagram";
            if (lowerContext.includes("facebook") || lowerContext.includes("face")) return "Facebook";
            if (lowerContext.includes("google") || lowerContext.includes("pesquisou")) return "Pesquisa Google";
            if (lowerContext.includes("amigo") || lowerContext.includes("colega") || lowerContext.includes("indicou") || lowerContext.includes("recomendou") || lowerContext.includes("indicação")) return "Indicação";
            if (lowerContext.includes("e-mail") || lowerContext.includes("email")) return "E-mail Marketing";
            return null; // No clear source found
        }
    }

    // Try to derive source from hintText
    if (hintText.includes("instagram")) return "Instagram";
    if (hintText.includes("facebook") || hintText.includes("face")) return "Facebook";
    if (hintText.includes("google") || hintText.includes("pesquisou")) return "Pesquisa Google";
    if (hintText.includes("amigo") || hintText.includes("colega") || hintText.includes("indicou") || hintText.includes("recomendou") || hintText.includes("indicação")) return "Indicação";
    if (hintText.includes("e-mail") || hintText.includes("email")) return "E-mail Marketing";
    
    // Default to the first word of the hint if no specific keyword matches
    const firstWord = hintText.split(" ")[0];
    return firstWord ? firstWord.charAt(0).toUpperCase() + firstWord.slice(1) : "Não especificado";
  };


  const resetSimulationStates = () => {
    Object.values(userMessageStatusTimers.current).forEach(timers => timers.forEach(clearTimeout));
    userMessageStatusTimers.current = {};
    setCurrentScenario(null);
    setCurrentLeadDisplayName("Lead");
    setDetectedLeadSource(null);
    setMessages([]);
    setParsedEvaluation(null);
    setError(null);
    setInputValue('');
    currentChatRef.current = null;
    setSimulationActive(false);
    setIsLoadingAI(false);
    setIsGeneratingScenario(false);
    setIsAiTypingChunks(false);
    setIsBossModeActive(false);
    setShowBossWarningOverlay(false);
    setIsNextMessageFromAudio(false);
  };

const _displayAiMessageProgressively = useCallback((
    fullMessageText: string,
    senderName: string,
    senderAvatarUrl: string | undefined
): Promise<void> => {
    return new Promise((resolveDisplay) => {
        let processedText = fullMessageText.replace(/\r\n/g, '\n');
        const TEMP_DOUBLE_NL_SEPARATOR = '||DBLNL||';
        processedText = processedText.replace(/\n\s*\n+/g, TEMP_DOUBLE_NL_SEPARATOR);
        let chunks: string[];
        if (processedText.includes(TEMP_DOUBLE_NL_SEPARATOR)) {
            chunks = processedText.split(TEMP_DOUBLE_NL_SEPARATOR)
                                  .map(c => c.trim().replace(/\|\|DBLNL\|\|/g, '\n\n')) // Restore double newlines
                                  .filter(c => c);
        } else {
            // If no double newlines, split by single newlines but preserve paragraph structure if possible
            chunks = processedText.split('\n').map(c => c.trim()).filter(c => c);
        }
        
        if (!chunks.length) {
             if (fullMessageText.trim()) chunks = [fullMessageText.trim()]; // Handle single line message
             else { resolveDisplay(); return; } // Empty message
        }

        setIsAiTypingChunks(true);
        let currentChunkIndex = 0;

        const sendNextChunk = () => {
            if (currentChunkIndex >= chunks.length) {
                setIsAiTypingChunks(false); resolveDisplay(); return;
            }
            const chunkText = chunks[currentChunkIndex];
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(), text: chunkText, isUser: false, timestamp: new Date(),
                senderDisplayName: senderName, status: 'read', avatarUrl: senderAvatarUrl
            }]);

            currentChunkIndex++;
            if (currentChunkIndex < chunks.length) {
                const delay = AI_CHUNK_MESSAGE_DELAY_MIN_MS + Math.random() * (AI_CHUNK_MESSAGE_DELAY_MAX_MS - AI_CHUNK_MESSAGE_DELAY_MIN_MS);
                setTimeout(sendNextChunk, delay);
            } else { setIsAiTypingChunks(false); resolveDisplay(); }
        };
        sendNextChunk();
    });
}, [setMessages, setIsAiTypingChunks]);


  const startSimulationWithScenario = async (scenarioToStart: Scenario, displayInitialAiMessageInChatUI: boolean) => {
    setCurrentScenario(scenarioToStart);
    const leadName = extractLeadNameFromScenario(scenarioToStart);
    setCurrentLeadDisplayName(leadName);
    setDetectedLeadSource(extractLeadSourceFromScenarioContext(scenarioToStart.context));
    setIsBossModeActive(!!scenarioToStart.isBoss);
    setIsLoadingAI(true);
    setMessages([]);
    try {
      const { chat, initialAiMessage: scenarioInitialMsg } = await startChatSession(
        scenarioToStart, 
        displayInitialAiMessageInChatUI
      );
      currentChatRef.current = chat;
      
      if (scenarioInitialMsg && scenarioInitialMsg.trim()) {
         await _displayAiMessageProgressively(scenarioInitialMsg, leadName, scenarioToStart.isBoss ? scenarioToStart.avatarUrl : undefined);
      }
      setSimulationActive(true);
    } catch (e) {
        const err = e as Error; setError(err.message || "Falha ao iniciar simulação com IA."); setSimulationActive(false);
    } finally { setIsLoadingAI(false); }
  };

  const handleStartBossScenario = () => {
    resetSimulationStates(); 
    setShowBossWarningOverlay(false);
    startSimulationWithScenario(FLAVIO_BOSS_SCENARIO, false); // Boss starts blank, user initiates
  };

  const handleStartSimulation = async () => {
    if (!apiKeyAvailable || isGeneratingScenario || isLoadingAI) return;
    
    resetSimulationStates(); 

    if (simulationMode === "objecao") {
        if (!selectedObjectionForMode) { setError("Por favor, selecione uma objeção para o modo focado."); return; }
        const baseScenarioIndex = Math.floor(Math.random() * SIMULATOR_SCENARIOS.length);
        const baseScenario = { ...SIMULATOR_SCENARIOS[baseScenarioIndex] };
        const baseLeadName = extractLeadNameFromScenario(baseScenario);
        const scenarioToStart: Scenario = {
            ...baseScenario,
            id: baseScenario.id || `sim_obj_${selectedObjectionForMode.id}_${Date.now()}`,
            title: `Foco em Objeção: ${selectedObjectionForMode.text.substring(0,30)}... (${baseLeadName})`,
            context: `${baseScenario.context} O cliente apresenta a seguinte objeção: "${selectedObjectionForMode.text}". ${selectedObjectionForMode.context || ''}`,
            initialMessage: selectedObjectionForMode.text, // AI (client) starts with the objection
            behavioralProfile: baseScenario.behavioralProfile || 'Padrão'
        };
        startSimulationWithScenario(scenarioToStart, true); // displayInitialAiMessageInChatUI = true for objection mode
    } else { // Modo Completo
        if (showBossWarningOverlay) { handleStartBossScenario(); return; } // Boss mode check
        // Check for a small chance to trigger Boss Mode randomly
        if (Math.random() < 0.01) { // 1% chance, for example
            setShowBossWarningOverlay(true);
            return;
        }
        setIsGeneratingScenario(true); setError(null);
        try {
            const proceduralScenario = await generateProceduralLeadScenarioFromGemini();
            if (proceduralScenario) {
                const scenarioWithId: Scenario = { ...proceduralScenario, id: `sim_proc_${Date.now()}` };
                // For procedural mode, the user (consultant) starts the conversation.
                // The AI (client) initial message is for context, not direct display.
                startSimulationWithScenario(scenarioWithId, false); // displayInitialAiMessageInChatUI = false
            } else {
                throw new Error("Cenário procedural gerado é inválido ou nulo.");
            }
        } catch (e) {
            const err = e as Error; setError(err.message || "Falha ao gerar cenário procedural com IA.");
        } finally { setIsGeneratingScenario(false); }
    }
  };


const parseEvaluationResult = (evaluationText: string | null): ParsedEvaluationType | null => {
    if (!evaluationText) return null;

    let analysisStartIndex = evaluationText.indexOf(SIMULATION_HEADINGS.FAILURE_HEADER);
    let outcomeType: ParsedEvaluationType['outcomeType'] = 'VENDA_NAO_REALIZADA'; // Default assumption
    // let headerMessageToUse = SIMULATION_HEADINGS.FAILURE_HEADER; // Not needed with current logic

    if (analysisStartIndex !== -1) {
        outcomeType = 'VENDA_NAO_REALIZADA';
    } else {
        analysisStartIndex = evaluationText.indexOf(SIMULATION_HEADINGS.SUCCESS_HEADER);
        if (analysisStartIndex !== -1) {
            outcomeType = 'VENDA_REALIZADA';
        } else {
            console.error("Could not determine simulation outcome from header. Full text received:", evaluationText);
            return { // Return a structured error object
                outcomeType: 'INDETERMINADO',
                headerMessage: 'Análise Falhou',
                quickSummary: `Não foi possível determinar o resultado da simulação a partir do texto: "${evaluationText.substring(0, 100)}..."`,
                generalNotes: { acolhimento: null, clareza: null, argumentacao: null, fechamento: null },
                clientInfo: { nome: null, curso: null, vida: null, busca: null, medo: null, perfilComportamental: null },
                conversationAnalysis: null, improvementStepsOrTips: null, finalSummary: null,
            };
        }
    }

    const analysisTextOnly = evaluationText.substring(analysisStartIndex);
    const lines = analysisTextOnly.split('\n').map(l => l.trim());
    let currentLineIndex = 0; 

    const baseEval: Omit<ParsedEvaluationType, 'outcomeType' | 'headerMessage' | 'isBossScenarioSuccess' | 'mainErrors' | 'positivePointFailure' | 'mainSuccessPoints' | 'attentionPointSuccess'> = {
        quickSummary: null,
        generalNotes: { acolhimento: null, clareza: null, argumentacao: null, fechamento: null },
        clientInfo: { nome: null, curso: null, vida: null, busca: null, medo: null, perfilComportamental: null },
        conversationAnalysis: null, improvementStepsOrTips: null, finalSummary: null,
    };

    let evalResult: ParsedEvaluationType = {
        ...baseEval,
        outcomeType: outcomeType,
        headerMessage: lines[0] || (outcomeType === 'VENDA_REALIZADA' ? SIMULATION_HEADINGS.SUCCESS_HEADER : SIMULATION_HEADINGS.FAILURE_HEADER),
    };
    
    if (evalResult.outcomeType === 'VENDA_REALIZADA' && analysisTextOnly.includes(SIMULATION_HEADINGS.SUCCESS_BOSS_CONVINCED)) {
        evalResult.isBossScenarioSuccess = true;
    }
    currentLineIndex = 1; 

    const findNextLineInParsed = (startsWith: string, fromIndex: number = currentLineIndex): number => {
        for (let i = fromIndex; i < lines.length; i++) {
            if (lines[i].startsWith(startsWith)) return i;
        }
        return -1;
    };
    
    // Quick Summary
    const quickSummaryHeaderConst = evalResult.outcomeType === 'VENDA_REALIZADA' ? SIMULATION_HEADINGS.SUCCESS_QUICK_SUMMARY : SIMULATION_HEADINGS.FAILURE_QUICK_SUMMARY;
    const quickSummaryIndex = findNextLineInParsed(quickSummaryHeaderConst, 0); // Search from beginning of analysis lines
    if (quickSummaryIndex !== -1) {
        currentLineIndex = quickSummaryIndex + 1;
        const nextSection1HeaderFailure = SIMULATION_HEADINGS.FAILURE_SECTION_1_ERRORS;
        const nextSection1HeaderSuccess = SIMULATION_HEADINGS.SUCCESS_SECTION_1_HITS;
        let nextSectionStartInLines = findNextLineInParsed(nextSection1HeaderFailure, currentLineIndex);
        if (nextSectionStartInLines === -1) {
            nextSectionStartInLines = findNextLineInParsed(nextSection1HeaderSuccess, currentLineIndex);
        }
        
        evalResult.quickSummary = lines.slice(currentLineIndex, nextSectionStartInLines !== -1 ? nextSectionStartInLines : lines.length).join('\n').trim();
        currentLineIndex = nextSectionStartInLines !== -1 ? nextSectionStartInLines : lines.length;
    }
    
    // Section 1: Errors or Successes
    const section1Header = evalResult.outcomeType === 'VENDA_REALIZADA' ? SIMULATION_HEADINGS.SUCCESS_SECTION_1_HITS : SIMULATION_HEADINGS.FAILURE_SECTION_1_ERRORS;
    const section1ItemPrefix = evalResult.outcomeType === 'VENDA_REALIZADA' ? SIMULATION_HEADINGS.SUCCESS_SECTION_1_HIT_ITEM_PREFIX : SIMULATION_HEADINGS.FAILURE_SECTION_1_ERROR_ITEM_PREFIX;
    
    let section1Index = findNextLineInParsed(section1Header, currentLineIndex);
    if (section1Index === -1 && currentLineIndex === 0) section1Index = findNextLineInParsed(section1Header, 0);

    if (section1Index !== -1) {
        currentLineIndex = section1Index + 1;
        const items: ParsedErrorOrSuccessItem[] = [];
        let itemContent: string[] = [];
        let currentItemTitle: string | null = null;

        while(currentLineIndex < lines.length) {
            const line = lines[currentLineIndex];
            const itemMatch = line.match(new RegExp(`^(${section1ItemPrefix}\\s*\\d+\\s*–\\s*)(.*)`));

            if (itemMatch) {
                if (currentItemTitle && itemContent.length > 0) {
                    items.push({ title: currentItemTitle, description: itemContent.join('\n').trim() });
                }
                currentItemTitle = itemMatch[2].trim();
                itemContent = [];
            } else if (line.startsWith(SIMULATION_HEADINGS.FAILURE_SECTION_2_POSITIVE) || line.startsWith(SIMULATION_HEADINGS.SUCCESS_SECTION_2_ATTENTION) || line.startsWith(SIMULATION_HEADINGS.REPORTS_SECTION_3_NOTES)) {
                break; 
            } else if (currentItemTitle) {
                itemContent.push(line);
            }
            currentLineIndex++;
        }
        if (currentItemTitle && itemContent.length > 0) {
            items.push({ title: currentItemTitle, description: itemContent.join('\n').trim() });
        }
        if (evalResult.outcomeType === 'VENDA_REALIZADA') evalResult.mainSuccessPoints = items;
        else evalResult.mainErrors = items;
    }

    // Section 2: Positive Point (Failure) or Attention Point (Success)
    const section2Header = evalResult.outcomeType === 'VENDA_REALIZADA' ? SIMULATION_HEADINGS.SUCCESS_SECTION_2_ATTENTION : SIMULATION_HEADINGS.FAILURE_SECTION_2_POSITIVE;
    let section2Index = findNextLineInParsed(section2Header, currentLineIndex);
     if (section2Index !== -1) {
        currentLineIndex = section2Index + 1;
        const section2Content: string[] = [];
        let tip: string | undefined = undefined;
        while(currentLineIndex < lines.length && !lines[currentLineIndex].startsWith(SIMULATION_HEADINGS.REPORTS_SECTION_3_NOTES)) {
            const line = lines[currentLineIndex];
            if (line.toLowerCase().startsWith("dica:")) {
                tip = line.substring(5).trim();
            } else if (line.trim() && line.trim() !== "Nenhum ponto positivo destacado." && line.trim() !== "Performance excelente, sem pontos de atenção críticos.") {
                 section2Content.push(line);
            }
            currentLineIndex++;
        }
        const description = section2Content.join('\n').trim();
        if (description || tip) { // Ensure object is created if either description or tip exists
            if (evalResult.outcomeType === 'VENDA_REALIZADA') evalResult.attentionPointSuccess = { description: description || "N/A", tip };
            else evalResult.positivePointFailure = { description: description || "N/A", tip };
        }
    }

    // Section 3: General Notes (Table)
    const section3Index = findNextLineInParsed(SIMULATION_HEADINGS.REPORTS_SECTION_3_NOTES, currentLineIndex);
    if (section3Index !== -1) {
        currentLineIndex = section3Index + 1; 
        if (currentLineIndex < lines.length && lines[currentLineIndex].toLowerCase().startsWith("critério")) currentLineIndex++; 
        
        const noteKeywords = ["acolhimento", "clareza", "argumentação", "fechamento"];
        for (const keyword of noteKeywords) {
            let foundKeywordLineIndex = -1;
            for(let i = currentLineIndex; i < lines.length; i++) {
                if (lines[i].toLowerCase().startsWith(keyword.toLowerCase())) {
                    foundKeywordLineIndex = i;
                    break;
                }
            }
            if (foundKeywordLineIndex !== -1) {
                const parts = lines[foundKeywordLineIndex].split(/\s+/);
                const noteValue = parseFloat(parts[parts.length - 1]);
                if (!isNaN(noteValue)) {
                    (evalResult.generalNotes as any)[keyword] = noteValue;
                }
            }
        }
        const section4Index = findNextLineInParsed(SIMULATION_HEADINGS.REPORTS_SECTION_4_CLIENT_INFO, currentLineIndex);
        currentLineIndex = section4Index !== -1 ? section4Index : lines.length;
    }

    // Section 4: Client Info
    const section4Index = findNextLineInParsed(SIMULATION_HEADINGS.REPORTS_SECTION_4_CLIENT_INFO, currentLineIndex);
    if (section4Index !== -1) {
        currentLineIndex = section4Index + 1;
        const nextSection5HeaderConst = evalResult.outcomeType === 'VENDA_REALIZADA' ? SIMULATION_HEADINGS.SUCCESS_SECTION_5_WHAT_WORKED : SIMULATION_HEADINGS.FAILURE_SECTION_5_WHAT_FAILED;
        let section5StartInLines = findNextLineInParsed(nextSection5HeaderConst, currentLineIndex);
        if (section5StartInLines === -1) section5StartInLines = lines.length;

        const clientInfoLinesContent = lines.slice(currentLineIndex, section5StartInLines);
        clientInfoLinesContent.forEach(line => {
            const separatorIndex = line.indexOf(':');
            if (separatorIndex > -1) {
                const keyPart = line.substring(0, separatorIndex).trim().toLowerCase();
                const value = line.substring(separatorIndex + 1).trim();
                if (keyPart === "nome") evalResult.clientInfo.nome = value;
                else if (keyPart === "curso") evalResult.clientInfo.curso = value;
                else if (keyPart === "vida") evalResult.clientInfo.vida = value;
                else if (keyPart === "busca") evalResult.clientInfo.busca = value;
                else if (keyPart === "medo") evalResult.clientInfo.medo = value;
                else if (keyPart === "perfil") evalResult.clientInfo.perfilComportamental = value;
            }
        });
        currentLineIndex = section5StartInLines;
    }
    
    // Section 5: Conversation Analysis
    const section5HeaderConst = evalResult.outcomeType === 'VENDA_REALIZADA' ? SIMULATION_HEADINGS.SUCCESS_SECTION_5_WHAT_WORKED : SIMULATION_HEADINGS.FAILURE_SECTION_5_WHAT_FAILED;
    const section5Idx = findNextLineInParsed(section5HeaderConst, currentLineIndex);
    if (section5Idx !== -1) {
        currentLineIndex = section5Idx + 1;
        const analysis: ParsedEvaluationType['conversationAnalysis'] = {
            conhecimentoCursos: null, escutaAtiva: null, contornoDuvidasOuObjecoes: null,
            apresentacaoDiferenciais: null, fechamento: null
        };
        const nextSection6HeaderConst = evalResult.outcomeType === 'VENDA_REALIZADA' ? SIMULATION_HEADINGS.SUCCESS_SECTION_6_TIPS_FOR_SUCCESS : SIMULATION_HEADINGS.FAILURE_SECTION_6_HOW_TO_IMPROVE;
        let section6StartInLines = findNextLineInParsed(nextSection6HeaderConst, currentLineIndex);
        if (section6StartInLines === -1) section6StartInLines = lines.length;

        const analysisLinesContent = lines.slice(currentLineIndex, section6StartInLines);
        analysisLinesContent.forEach(line => {
            const separatorIndex = line.indexOf(':');
            if (separatorIndex > -1) {
                const keyPart = line.substring(0, separatorIndex).trim().toLowerCase();
                const value = line.substring(separatorIndex + 1).trim();
                if (keyPart.includes("conhecimento dos cursos")) analysis.conhecimentoCursos = value;
                else if (keyPart.includes("escuta ativa")) analysis.escutaAtiva = value;
                else if (keyPart.includes("contorno de dúvidas") || keyPart.includes("contorno de objeções")) analysis.contornoDuvidasOuObjecoes = value;
                else if (keyPart.includes("apresentação dos diferenciais")) analysis.apresentacaoDiferenciais = value;
                else if (keyPart.includes("fechamento")) analysis.fechamento = value;
            }
        });
        evalResult.conversationAnalysis = analysis;
        currentLineIndex = section6StartInLines;
    }

    // Section 6: Improvement Steps or Tips for Success
    const section6HeaderConst = evalResult.outcomeType === 'VENDA_REALIZADA' ? SIMULATION_HEADINGS.SUCCESS_SECTION_6_TIPS_FOR_SUCCESS : SIMULATION_HEADINGS.FAILURE_SECTION_6_HOW_TO_IMPROVE;
    const section6Idx = findNextLineInParsed(section6HeaderConst, currentLineIndex);
    if (section6Idx !== -1) {
        currentLineIndex = section6Idx + 1;
        let section7StartInLines = findNextLineInParsed(SIMULATION_HEADINGS.REPORTS_SECTION_7_FINAL_SUMMARY, currentLineIndex);
        if (section7StartInLines === -1) section7StartInLines = lines.length;

        evalResult.improvementStepsOrTips = lines.slice(currentLineIndex, section7StartInLines)
            .filter(line => line.trim() && !line.startsWith("---") && !line.startsWith(SIMULATION_HEADINGS.REPORTS_SECTION_7_FINAL_SUMMARY));
        currentLineIndex = section7StartInLines;
    }

    // Section 7: Final Summary
    const section7Idx = findNextLineInParsed(SIMULATION_HEADINGS.REPORTS_SECTION_7_FINAL_SUMMARY, currentLineIndex);
    if (section7Idx !== -1) {
        currentLineIndex = section7Idx + 1;
        const summaryBlockContent = lines.slice(currentLineIndex).join('\n').trim();
        const developmentNoteMatch = summaryBlockContent.match(/(Você precisa \([^)]+\) [^.]*\.)(\s*leia mais para entender o porque\.\.\.)?/is);
        
        if (developmentNoteMatch && developmentNoteMatch[1]) {
            evalResult.finalSummary = summaryBlockContent.substring(0, developmentNoteMatch.index).trim();
            evalResult.finalDevelopmentNote = developmentNoteMatch[1].trim();
        } else {
            evalResult.finalSummary = summaryBlockContent;
        }
    }
    
    return evalResult;
};

  const processAiResponse = async (aiResponseText: string, userMessageId: string) => {
    const leadNameForMessage = currentScenario?.isBoss ? FLAVIO_BOSS_SCENARIO.title.split(" ")[0] : 
                               (currentLeadDisplayName || "Lead");

    clearTimersForMessage(userMessageId); 
    if (userMessageId) updateMessageStatus(userMessageId, 'read');


    if (aiResponseText.includes(SIMULATION_HEADINGS.FAILURE_HEADER) || aiResponseText.includes(SIMULATION_HEADINGS.SUCCESS_HEADER)) {
        const parsedData = parseEvaluationResult(aiResponseText); 
        setParsedEvaluation(parsedData);

        if (currentUser && currentScenario && parsedData) {
          const simulationRecord: SimulationRecord = {
            id: crypto.randomUUID(),
            userId: currentUser.id,
            username: currentUser.type === 'admin' ? currentUser.username : (currentUser.type === 'simple' ? currentUser.username : currentUser.name),
            scenarioContentId: currentScenario.id, 
            scenarioTitle: currentScenario.title,
            timestamp: new Date().toISOString(),
            messages: [...messages, {id: userMessageId, text: inputValue, isUser: true, timestamp: new Date(), status: 'read', isAudioMessage: isNextMessageFromAudio }], 
            evaluation: parsedData,
          };
          try {
            const existingRecordsJSON = localStorage.getItem(LOCAL_STORAGE_SIMULATION_RECORDS_KEY);
            const existingRecords: SimulationRecord[] = existingRecordsJSON ? JSON.parse(existingRecordsJSON) : [];
            localStorage.setItem(LOCAL_STORAGE_SIMULATION_RECORDS_KEY, JSON.stringify([...existingRecords, simulationRecord]));
          } catch (e) {
            console.error("Failed to save simulation record to localStorage:", e);
          }
        }

        setSimulationActive(false); setIsLoadingAI(false); setIsAiTypingChunks(false);
        if (isSmallScreen) setTimeout(() => resultsViewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        return;
    }
    if (!aiResponseText.trim()) { setIsLoadingAI(false); setIsAiTypingChunks(false); return; }
    await _displayAiMessageProgressively(aiResponseText, leadNameForMessage, currentScenario?.isBoss ? currentScenario.avatarUrl : undefined);
    setIsLoadingAI(false);
  };

  const handleSendMessage = async (messageTextOverride?: string) => {
    const textToSend = messageTextOverride || inputValue;
    if (!textToSend.trim() || isLoadingAI || isAiTypingChunks || !simulationActive || !currentChatRef.current || parsedEvaluation ) return;
    
    const userMessageId = crypto.randomUUID();
    
    if (textToSend !== "finalize") { 
        const userMessage: Message = { 
            id: userMessageId, 
            text: textToSend, 
            isUser: true, 
            timestamp: new Date(), 
            status: 'pending_send',
            senderDisplayName: currentUser?.type === 'simple' ? currentUser.username : currentUser?.type === 'admin' ? currentUser.username : currentUser?.name,
            isAudioMessage: isNextMessageFromAudio,
        };
        setMessages(prev => [...prev, userMessage]);
        if (isNextMessageFromAudio) {
            setIsNextMessageFromAudio(false); // Reset flag after use
        }
        const sentTimer = setTimeout(() => updateMessageStatus(userMessageId, 'sent'), 100);
        const deliveryDelay = DELIVERY_DELAY_MS_MIN + Math.random() * (DELIVERY_DELAY_MS_MAX - DELIVERY_DELAY_MS_MIN);
        const deliveredTimer = setTimeout(() => updateMessageStatus(userMessageId, 'delivered'), deliveryDelay);
        userMessageStatusTimers.current[userMessageId] = [sentTimer as unknown as number, deliveredTimer as unknown as number];
    }
    
    const currentInput = textToSend;
    if (textToSend !== "finalize") setInputValue('');
    
    setIsLoadingAI(true); setError(null);
    try {
      const aiResponseText = await sendChatMessage(currentChatRef.current, currentInput);
      await processAiResponse(aiResponseText, userMessageId); 
    } catch (e) {
      const err = e as Error; const errorMessageText = err.message.includes("API Key") ? err.message : `Erro da IA: ${err.message}. Tente novamente.`;
      setError(errorMessageText); if(textToSend !== "finalize") updateMessageStatus(userMessageId, 'error');
      if (!errorMessageText.includes("API Key") && textToSend !== "finalize") {
         setMessages(prev => [...prev, {id: crypto.randomUUID(), text: `Erro ao comunicar com a IA: ${err.message}`, isUser: false, timestamp: new Date(), senderDisplayName: currentLeadDisplayName, status: 'read' }]);
      } setIsLoadingAI(false);
    }
  };

 const handleEndSimulation = () => { resetSimulationStates(); };
 const handleManualEndSimulationClick = () => { if (simulationActive && !isTerminalStateReached && !isLoadingAI && !isAiTypingChunks) handleSendMessage("finalize"); };

  const handleStartRecording = async () => {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { alert('Gravação de áudio não é suportada neste navegador.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const supportedTypes = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/ogg'];
      let mimeType = 'audio/webm'; for (const type of supportedTypes) if (MediaRecorder.isTypeSupported(type)) { mimeType = type; break; }
      recordedAudioMimeTypeRef.current = mimeType; mediaRecorderRef.current = new MediaRecorder(stream, { mimeType }); audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorderRef.current.onstop = async () => {
        if (audioChunksRef.current.length === 0) { setIsRecording(false); stream.getTracks().forEach(track => track.stop()); return; }
        setIsTranscribing(true); setError(null); const audioBlob = new Blob(audioChunksRef.current, { type: recordedAudioMimeTypeRef.current });
        try {
            const audioBase64 = await blobToBase64(audioBlob);
            const transcriptionResponse = await transcribeAudioWithGemini(audioBase64, recordedAudioMimeTypeRef.current);
            if (transcriptionResponse.text) {
                setInputValue(prev => prev ? `${prev} ${transcriptionResponse.text}` : transcriptionResponse.text);
                setIsNextMessageFromAudio(true); // Flag that the input now contains audio transcription
            } else if (transcriptionResponse.error) {
                setError(`Transcrição falhou: ${transcriptionResponse.error}`);
            }
        } catch (transcriptionError) { setError(`Erro na transcrição: ${(transcriptionError as Error).message}`); }
        finally { setIsTranscribing(false); setIsRecording(false); stream.getTracks().forEach(track => track.stop()); audioChunksRef.current = []; }
      }; mediaRecorderRef.current.start(); setIsRecording(true);
    } catch (err) { setError(`Erro ao acessar microfone: ${(err as Error).message}. Verifique as permissões.`); setIsRecording(false); }
  };
  const handleStopRecording = () => { if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop(); else setIsRecording(false); };

  const renderFormattedText = (text: string | null): string => { 
    if (!text) return ""; let html = text.replace(/\r\n|\r/g, '\n').replace(/\|\|CHUNK\|\|/g, '');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-semibold mt-3 mb-1 text-[var(--color-primary)]">$1</h2>'); 
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-md font-medium mt-2 mb-1 text-[var(--color-accent)]">$1</h3>'); 
    html = html.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>'); html = html.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');
    const lines = html.split('\n'); let processedHtml = ""; let inListType: 'ul' | 'ol' | null = null; let listItems: string[] = [];
    const closeCurrentList = () => {
    if (inListType && listItems.length > 0) {
        processedHtml += `<${inListType} class="${inListType === 'ul' ? 'list-disc' : 'list-decimal'} list-inside pl-5 my-2 space-y-0.5">`; 
        listItems.forEach(li => { processedHtml += `<li>${li}</li>`;}); processedHtml += `</${inListType}>`; listItems = [];
    } inListType = null; }; let currentParagraph = "";
    for (let i = 0; i < lines.length; i++) {
    let lineContent = lines[i]; const trimmedLine = lineContent.trim();
    const olMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/); const ulMatch = trimmedLine.match(/^[-*+]\s+(.*)/);
    // Updated SBI match to be more flexible with the colon and content
    const sbiMatch = trimmedLine.match(/^\s*\*\s*(Situação|Seu Comportamento|Impacto Negativo|Impacto Positivo|Para o Ponto Crítico \d+|Lembre-se de|Rapport|Sondagem|Apresentação de Valor|Contorno de Objeção|Tentativa de Fechamento|Erro \d+ –|Acerto \d+ –|Dica):\s*(.*)/i);
    
    if (olMatch) { if (currentParagraph) { processedHtml += `<p class="my-1.5">${currentParagraph}</p>`; currentParagraph = ""; } if (inListType !== 'ol') { closeCurrentList(); inListType = 'ol'; } listItems.push(olMatch[2]);
    } else if (ulMatch && !sbiMatch && !trimmedLine.match(/^(Erro|Acerto)\s\d+\s*–/)) { // Ensure it's not an "Erro X -" or "Acerto X -" line
        if (currentParagraph) { processedHtml += `<p class="my-1.5">${currentParagraph}</p>`; currentParagraph = ""; } if (inListType !== 'ul') { closeCurrentList(); inListType = 'ul'; } listItems.push(ulMatch[1]);
    } else if (sbiMatch) { if (currentParagraph) { processedHtml += `<p class="my-1.5">${currentParagraph}</p>`; currentParagraph = ""; } closeCurrentList(); processedHtml += `<p class="my-0.5 ml-3"><strong class="text-[var(--color-text-light)]">${sbiMatch[1]}:</strong> ${sbiMatch[2]}</p>`; 
    } else { closeCurrentList();
        if (trimmedLine.match(/^Critério\s+Nota/i)) { // Skip "Critério Nota" table header
             // Do nothing special, it will be handled by specific parsing of this section
        } else if (trimmedLine.match(/^\*\s*(Ponto Crítico \d+|Ponto Positivo \d+):/i)) { if (currentParagraph) { processedHtml += `<p class="my-1.5">${currentParagraph}</p>`; currentParagraph = ""; } processedHtml += `<h4 class="text-[var(--color-text)] font-medium mt-1.5 mb-0.5">${trimmedLine.replace(/^\*/, '').trim()}</h4>`; 
        } else if (trimmedLine.startsWith("**Resumo das Técnicas de Vendas Utilizadas:**")) { 
           if (currentParagraph) { processedHtml += `<p class="my-1.5">${currentParagraph}</p>`; currentParagraph = ""; } processedHtml += `<h3 class="text-md font-medium mt-2 mb-1 text-[var(--color-accent)]">${trimmedLine.replace(/\*\*/g, "")}</h3>`;
        } else if (trimmedLine !== "") currentParagraph += (currentParagraph ? "\n" : "") + lineContent;
        else if (currentParagraph) { processedHtml += `<p class="my-1.5">${currentParagraph}</p>`; currentParagraph = ""; } } }
    if (currentParagraph) { processedHtml += `<p class="my-1.5">${currentParagraph}</p>`;} closeCurrentList(); html = processedHtml.replace(/<p>\s*<\/p>/g, ''); return html;
  };

  const handleScrollToChat = () => chatViewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const handleScrollToResults = () => resultsViewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (showBossWarningOverlay) return <BossWarningOverlay onStart={handleStartBossScenario} />;
  if (!apiKeyAvailable && !currentScenario) {
    return ( <section id="simulador" className="py-12 mt-8"> <GlassCard className="max-w-4xl mx-auto text-center p-8">
            <h2 className="section-title !text-center text-[var(--error)]">Erro de Configuração</h2>
            <p className="text-xl text-[var(--color-text)]">{API_KEY_ERROR_MESSAGE}</p>
            <p className="mt-4 text-[var(--color-text-light)]">Por favor, configure a API Key para usar o simulador.</p>
        </GlassCard> </section> ); }

  const isChatEmptyForUserStart = simulationMode === "completo" && messages.length === 0 && !isTerminalStateReached && !currentScenario?.initialMessage && !isGeneratingScenario;
  
  let mainButtonAction = handleStartSimulation; 
  let mainButtonText = simulationMode === "completo" ? (isGeneratingScenario ? "Gerando Lead..." : "Gerar Lead com IA e Iniciar") : (isLoadingAI ? "Iniciando..." : "Iniciar com Objeção Selecionada");
  let mainButtonIcon = simulationMode === "completo" ? (isGeneratingScenario ? "" : "fa-user-graduate") : (isLoadingAI ? "" : "fa-comment-dots");


  if (!currentScenario && !isTerminalStateReached) {
    return ( <section id="simulador" className="py-12 mt-8">
        <GlassCard className="themed-surface max-w-2xl mx-auto flex flex-col min-h-[500px]">
            <div id="simulador-inicio" className="text-center p-6 md:p-8 flex-grow flex flex-col justify-center"> <div>
                <h2 className="section-title !text-center !mb-4">Simulador de Conversas</h2>
                <p className="mb-6 text-center text-[var(--color-text-light)] text-sm">
                    Pratique suas habilidades de vendas com a IA.
                </p>
                
                <>
                    <p className="text-[var(--color-primary)] font-medium">Modo de Prática:</p>
                    <div className="flex justify-center gap-x-4 gap-y-2 flex-wrap my-3">
                        {(["completo", "objecao"] as SimulationMode[]).map(mode => (
                            <label key={mode} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-[var(--color-border)] transition-colors">
                                <input type="radio" name="simulationMode" value={mode} checked={simulationMode === mode} onChange={() => setSimulationMode(mode)}
                                    className="form-radio h-4 w-4 text-[var(--color-primary)] bg-[var(--color-input-bg)] border-[var(--color-border)] focus:ring-[var(--color-primary)] focus:ring-offset-0 focus:ring-opacity-50"
                                    disabled={isLoadingAI || isGeneratingScenario} />
                                <span className="text-[var(--color-text)] text-sm">{mode === "completo" ? "Modo Completo (Lead Aleatório)" : "Foco em Objeção"}</span>
                            </label> 
                        ))} 
                    </div>
                    {simulationMode === "objecao" && ( <div className="mb-6">
                            <label htmlFor="objection-select-sim" className="block text-xs font-medium text-[var(--color-text-light)] mb-1"> Selecione a Objeção para Treinar: </label>
                            <select id="objection-select-sim" value={selectedObjectionForMode?.id || ''}
                                onChange={(e) => { const found = OBJECTIONS_LIST.find(ob => ob.id === e.target.value); setSelectedObjectionForMode(found || null); }}
                                className="themed-input themed-select w-full max-w-md mx-auto !text-sm" disabled={isLoadingAI || isGeneratingScenario}>
                                {OBJECTIONS_LIST.map(ob => ( <option key={ob.id} value={ob.id}>{ob.text}</option> ))} </select> </div> 
                    )}
                </>

                <div className="flex justify-center items-center mt-4">
                  <GlassButton 
                    onClick={mainButtonAction} 
                    className="themed-button px-6 py-2.5 text-md w-full sm:w-auto max-w-xs"
                    disabled={!apiKeyAvailable || isLoadingAI || isGeneratingScenario || (simulationMode === "objecao" && !selectedObjectionForMode)}>
                    {(isLoadingAI || isGeneratingScenario) ? <LoadingSpinner size="sm" /> : 
                        <> {mainButtonIcon && <i className={`fas ${mainButtonIcon} mr-2`}></i>} {mainButtonText} </>
                    }
                 </GlassButton> 
                </div> 
            </div>
              {error && <p className="text-[var(--error)] text-center mt-6 p-2 bg-[rgba(var(--error-rgb),0.1)] border border-[rgba(var(--error-rgb),0.2)] rounded-md text-sm">{error}</p>}
            </div> </GlassCard> </section> ); }

  const rootSectionClass = `py-0 ${isSmallScreenEndView ? 'flex flex-col flex-grow h-full' : 'md:py-8'}`;
  const mainCardOuterClass = `${isSmallScreenEndView ? 'w-full h-full max-w-full p-0 rounded-none border-none shadow-none bg-[var(--surface-feedback-primary)] flex-grow' : 'themed-surface max-w-6xl mx-auto h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] max-h-[650px] md:max-h-[800px]'}`;
  
  const effectiveMainCardInnerFlex = isSmallScreenEndView ? 
    'p-0 flex flex-col flex-grow overflow-y-auto custom-scrollbar' : 
    'p-0 flex flex-col flex-grow overflow-hidden';

  const renderAnalysisContent = (evalData: ParsedEvaluationType) => (
    <>
        <h2 className="text-xl font-semibold text-center my-3 text-[var(--accent-feedback-title)]">
            {evalData.headerMessage || (evalData.outcomeType === 'VENDA_REALIZADA' ? SIMULATION_HEADINGS.SUCCESS_HEADER : SIMULATION_HEADINGS.FAILURE_HEADER)}
        </h2>
        {evalData.isBossScenarioSuccess && (
            <p className="text-center font-bold text-yellow-300 text-md mb-2 bg-red-600 p-1.5 rounded-md shadow">
                {SIMULATION_HEADINGS.SUCCESS_BOSS_CONVINCED}
            </p>
        )}
        
        {evalData.quickSummary && (
            <GlassCard className="p-3 bg-[var(--surface-feedback-secondary)] rounded-lg shadow-sm mb-3">
                <h3 className="text-sm font-medium text-[var(--accent-feedback-title)] opacity-90 mb-1 flex items-center">
                    <i className={`fas ${evalData.outcomeType === 'VENDA_REALIZADA' ? 'fa-chart-line' : 'fa-chart-pie'} mr-2`}></i>
                    {evalData.outcomeType === 'VENDA_REALIZADA' ? SIMULATION_HEADINGS.SUCCESS_QUICK_SUMMARY : SIMULATION_HEADINGS.FAILURE_QUICK_SUMMARY}
                </h3>
                <div className="prose prose-sm max-w-none text-[var(--color-text-light)]" dangerouslySetInnerHTML={{ __html: renderFormattedText(evalData.quickSummary) }} />
            </GlassCard>
        )}

        {(evalData.mainErrors || evalData.mainSuccessPoints) && (
            <GlassCard className="p-3 bg-[var(--surface-feedback-secondary)] rounded-lg shadow-sm mb-3">
                <h3 className="text-sm font-medium text-[var(--accent-feedback-title)] opacity-90 mb-1 flex items-center">
                    <i className={`fas ${evalData.outcomeType === 'VENDA_REALIZADA' ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-2`}></i>
                    {evalData.outcomeType === 'VENDA_REALIZADA' ? SIMULATION_HEADINGS.SUCCESS_SECTION_1_HITS : SIMULATION_HEADINGS.FAILURE_SECTION_1_ERRORS}
                </h3>
                {(evalData.mainErrors || evalData.mainSuccessPoints)?.map((item, index) => (
                    <div key={index} className="mb-2 prose prose-sm max-w-none text-[var(--color-text-light)]">
                       <strong className="text-[var(--color-text)]">{item.title}:</strong>
                       <div dangerouslySetInnerHTML={{ __html: renderFormattedText(item.description) }} />
                    </div>
                ))}
            </GlassCard>
        )}
        
        {(evalData.positivePointFailure || evalData.attentionPointSuccess) && (
             <GlassCard className="p-3 bg-[var(--surface-feedback-secondary)] rounded-lg shadow-sm mb-3">
                <h3 className="text-sm font-medium text-[var(--accent-feedback-title)] opacity-90 mb-1 flex items-center">
                    <i className={`fas ${evalData.outcomeType === 'VENDA_REALIZADA' ? 'fa-info-circle' : 'fa-thumbs-up'} mr-2`}></i>
                     {evalData.outcomeType === 'VENDA_REALIZADA' ? SIMULATION_HEADINGS.SUCCESS_SECTION_2_ATTENTION : SIMULATION_HEADINGS.FAILURE_SECTION_2_POSITIVE}
                </h3>
                <div className="prose prose-sm max-w-none text-[var(--color-text-light)]">
                    <div dangerouslySetInnerHTML={{ __html: renderFormattedText( (evalData.positivePointFailure || evalData.attentionPointSuccess)!.description ) }} />
                    {(evalData.positivePointFailure?.tip || evalData.attentionPointSuccess?.tip) && (
                        <p className="mt-1"><strong>Dica:</strong> {evalData.positivePointFailure?.tip || evalData.attentionPointSuccess?.tip}</p>
                    )}
                </div>
            </GlassCard>
        )}
        
        <GlassCard className="p-3 bg-[var(--surface-feedback-secondary)] rounded-lg shadow-sm mb-3">
            <h3 className="text-sm font-medium text-[var(--accent-feedback-title)] opacity-90 mb-1.5 flex items-center">
                <i className="fas fa-clipboard-check mr-2"></i>{SIMULATION_HEADINGS.REPORTS_SECTION_3_NOTES}
            </h3>
            <div className="space-y-1">
                <StarRating rating={evalData.generalNotes.acolhimento} label="Acolhimento" />
                <StarRating rating={evalData.generalNotes.clareza} label="Clareza" />
                <StarRating rating={evalData.generalNotes.argumentacao} label="Argumentação" />
                <StarRating rating={evalData.generalNotes.fechamento} label="Fechamento" />
            </div>
        </GlassCard>

        <GlassCard className="p-3 bg-[var(--surface-feedback-secondary)] rounded-lg shadow-sm mb-3">
            <h3 className="text-sm font-medium text-[var(--accent-feedback-title)] opacity-90 mb-1.5 flex items-center">
                <i className="fas fa-user-circle mr-2"></i>{SIMULATION_HEADINGS.REPORTS_SECTION_4_CLIENT_INFO}
            </h3>
            <div className="text-xs text-[var(--color-text-light)] space-y-0.5">
                <p><strong>Nome:</strong> {evalData.clientInfo.nome || 'N/A'}</p>
                <p><strong>Curso:</strong> {evalData.clientInfo.curso || 'N/A'}</p>
                <p><strong>Vida:</strong> {evalData.clientInfo.vida || 'N/A'}</p>
                <p><strong>Busca:</strong> {evalData.clientInfo.busca || 'N/A'}</p>
                <p><strong>Medo:</strong> {evalData.clientInfo.medo || 'N/A'}</p>
                <p><strong>Perfil:</strong> {evalData.clientInfo.perfilComportamental || 'N/A'}</p>
            </div>
        </GlassCard>
        
        {evalData.conversationAnalysis && (
            <GlassCard className="p-3 bg-[var(--surface-feedback-secondary)] rounded-lg shadow-sm mb-3">
                <h3 className="text-sm font-medium text-[var(--accent-feedback-title)] opacity-90 mb-1.5 flex items-center">
                    <i className="fas fa-comments mr-2"></i>
                    {evalData.outcomeType === 'VENDA_REALIZADA' ? SIMULATION_HEADINGS.SUCCESS_SECTION_5_WHAT_WORKED : SIMULATION_HEADINGS.FAILURE_SECTION_5_WHAT_FAILED}
                </h3>
                 <div className="text-xs text-[var(--color-text-light)] space-y-0.5">
                    <p><strong>Conhecimento dos cursos:</strong> {evalData.conversationAnalysis.conhecimentoCursos || 'N/A'}</p>
                    <p><strong>Escuta ativa:</strong> {evalData.conversationAnalysis.escutaAtiva || 'N/A'}</p>
                    <p><strong>Contorno de dúvidas/objeções:</strong> {evalData.conversationAnalysis.contornoDuvidasOuObjecoes || 'N/A'}</p>
                    <p><strong>Apresentação dos diferenciais:</strong> {evalData.conversationAnalysis.apresentacaoDiferenciais || 'N/A'}</p>
                    <p><strong>Fechamento:</strong> {evalData.conversationAnalysis.fechamento || 'N/A'}</p>
                </div>
            </GlassCard>
        )}

        {evalData.improvementStepsOrTips && evalData.improvementStepsOrTips.length > 0 && (
            <GlassCard className="p-3 bg-[var(--surface-feedback-secondary)] rounded-lg shadow-sm mb-3">
                 <h3 className="text-sm font-medium text-[var(--accent-feedback-title)] opacity-90 mb-1 flex items-center">
                    <i className="fas fa-lightbulb mr-2"></i>
                    {evalData.outcomeType === 'VENDA_REALIZADA' ? SIMULATION_HEADINGS.SUCCESS_SECTION_6_TIPS_FOR_SUCCESS : SIMULATION_HEADINGS.FAILURE_SECTION_6_HOW_TO_IMPROVE}
                </h3>
                <div className="prose prose-sm max-w-none text-[var(--color-text-light)] space-y-1">
                    {evalData.improvementStepsOrTips.map((step, index) => (
                        <div key={index} dangerouslySetInnerHTML={{ __html: renderFormattedText(step) }} />
                    ))}
                </div>
            </GlassCard>
        )}

        {evalData.finalSummary && (
            <GlassCard className="p-3 bg-[var(--surface-feedback-secondary)] rounded-lg shadow-sm">
                <h3 className="text-sm font-medium text-[var(--accent-feedback-title)] opacity-90 mb-1 flex items-center">
                    <i className="fas fa-flag-checkered mr-2"></i>{SIMULATION_HEADINGS.REPORTS_SECTION_7_FINAL_SUMMARY}
                </h3>
                 <div className="prose prose-sm max-w-none text-[var(--color-text-light)]">
                    <div dangerouslySetInnerHTML={{ __html: renderFormattedText(evalData.finalSummary) }} />
                    {evalData.finalDevelopmentNote && (
                         <p className="mt-1"><strong><i className="fas fa-bullseye text-[var(--color-primary)]"></i> Foco para Desenvolvimento:</strong> {evalData.finalDevelopmentNote}</p>
                    )}
                </div>
            </GlassCard>
        )}
    </>
  );

  return (
    <section id="simulador" className={rootSectionClass}>
        <div className={`${mainCardOuterClass} ${effectiveMainCardInnerFlex}`}>
          {isTerminalStateReached && parsedEvaluation ? ( 
            isSmallScreenEndView ? ( 
                 <>
                    <div 
                        id="simulation-results-view-sm" 
                        ref={resultsViewRef} 
                        className="flex flex-col p-3 bg-[var(--surface-feedback-primary)] overflow-y-auto custom-scrollbar" 
                        style={{flexBasis: '60%', minHeight: '300px'}}
                    >
                        {renderAnalysisContent(parsedEvaluation)}
                        <div className="mt-auto pt-3 pb-2 flex flex-col gap-2 border-t border-[var(--border-feedback-divider)] sticky bottom-0 bg-[var(--surface-feedback-primary)]">
                             <GlassButton
                                onClick={handleScrollToChat}
                                className="w-full text-xs py-2 !bg-transparent !border !border-[var(--color-accent)] !text-[var(--color-accent)] hover:!bg-[rgba(var(--color-accent-rgb),0.1)]"
                            > Ver Conversa <i className="fas fa-arrow-down ml-1"></i> </GlassButton>
                             <GlassButton 
                                onClick={handleEndSimulation} 
                                className="w-full text-sm py-2.5 themed-button !bg-[var(--button-feedback-cta-bg)] hover:!bg-[var(--button-feedback-cta-hover-bg)] !border-[var(--button-feedback-cta-bg)]"
                              > Nova Simulação </GlassButton>
                        </div>
                    </div>
                    <div id="simulation-chat-view-sm" ref={chatViewRef} className="flex flex-col simulator-chat-bg border-t border-[var(--color-border)]" style={{flexBasis: '40%', minHeight: '200px'}}>
                        {currentScenario && (
                        <ChatHeader leadName={currentLeadDisplayName} leadSource={detectedLeadSource} isAiTyping={false}
                            leadAvatarUrl={currentScenario?.isBoss ? currentScenario.avatarUrl : undefined}
                            simulationActive={false} isTerminalStateReached={true} isLoadingAI={false} isAiTypingChunks={false}
                            onEndSimulationClick={() => {}} />
                        )}
                        <div ref={chatContainerRef} className="flex-grow overflow-y-auto custom-scrollbar p-3 simulator-chat-bg">
                            {messages.length > 0 ? messages.map((msg, index) => (
                                <MessageBubble key={msg.id} message={msg} />
                            )) : <p className="text-center text-sm text-[var(--color-text-light)] p-4">Nenhuma mensagem na conversa.</p>}
                        </div>
                        <div className="p-2 border-t border-[var(--color-border)] simulator-chat-input-bg text-center sticky bottom-0">
                            <GlassButton onClick={handleScrollToResults}
                                className="w-full text-xs py-2 !bg-transparent !border !border-[var(--color-accent)] !text-[var(--color-accent)] hover:!bg-[rgba(var(--color-accent-rgb),0.1)]">
                                Ver Resultado <i className="fas fa-arrow-up ml-1"></i> </GlassButton>
                        </div>
                    </div>
                </>
            ) : ( 
                <div className="flex md:flex-row md:gap-0 flex-grow overflow-hidden">
                    <div id="simulation-chat-view" className="flex flex-col md:w-7/12 order-1 overflow-hidden border-r border-[var(--color-border)]"> 
                        {currentScenario && (
                        <ChatHeader leadName={currentLeadDisplayName} leadSource={detectedLeadSource} isAiTyping={false}
                            leadAvatarUrl={currentScenario?.isBoss ? currentScenario.avatarUrl : undefined}
                            simulationActive={false} isTerminalStateReached={true} isLoadingAI={false} isAiTypingChunks={false}
                            onEndSimulationClick={() => {}} /> )}
                        <div ref={chatContainerRef} className="flex-grow overflow-y-auto custom-scrollbar p-3 md:p-4 simulator-chat-bg min-h-0">
                         {messages.map((msg, index) => ( <MessageBubble key={msg.id} message={msg}/> ))}
                        {!messages.length && currentScenario && ( <p className="text-center text-sm text-[var(--color-text-light)] p-4">A conversa não foi iniciada.</p> )}
                        </div>
                        <div className="p-2 border-t border-[var(--color-border)] simulator-chat-input-bg text-center">
                            <p className="text-xs text-[var(--color-text-light)]">Visualização da conversa encerrada.</p>
                        </div>
                    </div>
                     <div id="simulation-results-view" className="flex flex-col md:w-5/12 order-2 overflow-hidden bg-[var(--surface-feedback-primary)] shadow-lg" > 
                        <div ref={resultsViewRef} className="overflow-y-auto custom-scrollbar flex-grow p-4 md:p-5 min-h-0">
                            {renderAnalysisContent(parsedEvaluation)}
                        </div>
                        <div className="mt-auto p-4 border-t border-[var(--border-feedback-divider)]">
                             <GlassButton onClick={handleEndSimulation} className="themed-button w-full py-2.5 !text-base !bg-[var(--button-feedback-cta-bg)] hover:!bg-[var(--button-feedback-cta-hover-bg)] !border-[var(--button-feedback-cta-bg)]">
                                Iniciar Nova Simulação </GlassButton> </div> </div> </div> )
          ) : ( 
            <>
              {currentScenario && ( <ChatHeader 
                    leadName={currentLeadDisplayName} leadSource={detectedLeadSource}
                    isAiTyping={isAiTypingChunks || (isLoadingAI && messages.some(m => m.isUser))}
                    leadAvatarUrl={currentScenario?.isBoss ? currentScenario.avatarUrl : undefined}
                    simulationActive={simulationActive} isTerminalStateReached={isTerminalStateReached}
                    isLoadingAI={isLoadingAI} isAiTypingChunks={isAiTypingChunks}
                    onEndSimulationClick={handleManualEndSimulationClick} /> )}
              <div ref={chatContainerRef} className="flex-grow overflow-y-auto custom-scrollbar p-3 md:p-4 simulator-chat-bg"
                aria-live="polite" aria-atomic="false" >
                {messages.map((msg, index) => ( <MessageBubble key={msg.id} message={msg} /> ))} </div>
              {error && !parsedEvaluation && <p className="text-[var(--error)] text-center p-2 bg-[rgba(var(--error-rgb),0.1)] border-t border-[rgba(var(--error-rgb),0.2)] text-sm">{error}</p>}
              <ChatInputArea inputValue={inputValue} onInputChange={setInputValue} onSendMessage={() => handleSendMessage()}
                  isLoadingAI={isLoadingAI && !isAiTypingChunks} isAiTypingChunks={isAiTypingChunks} simulationActive={simulationActive}
                  isRecording={isRecording} isTranscribing={isTranscribing} onStartRecord={handleStartRecording} onStopRecord={handleStopRecording}
                  isTerminalStateReached={isTerminalStateReached} isGeneratingScenario={isGeneratingScenario}
                  isChatEmptyForUserStart={isChatEmptyForUserStart} currentScenarioInitialMessage={currentScenario?.initialMessage}
                  simulationMode={simulationMode} messages={messages} /> 
            </>
          )}
        </div>
    </section>
  );
};

export default SimulatorSection;