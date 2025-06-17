
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthenticatedUser, QuizAttemptRecord, SimulationRecord, Message, ParsedEvaluation, QuizQuestionType, UserAnswer, PerformanceSnapshotData, NavigationSection, ParsedErrorOrSuccessItem } from '../../types';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import MessageBubble from '../SimulatorSection/MessageBubble';
import LoadingSpinner from '../ui/LoadingSpinner';
import { SIMULATION_HEADINGS, GEMINI_COMMERCIAL_MANAGER_ANALYSIS_PROMPT_TEMPLATE, AI_ANALYSIS_LOADING_MESSAGES, LOCAL_STORAGE_QUIZ_ATTEMPTS_KEY, LOCAL_STORAGE_SIMULATION_RECORDS_KEY } from '../../constants';
import { generateCollaboratorAnalysis } from '../../services/geminiService';


const formatDate = (isoString?: string) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch (e) {
    return 'Data inválida';
  }
};

const StarRatingDisplay: React.FC<{ rating: number | null; maxStars?: number; label?: string; className?: string }> = ({ rating, maxStars = 5, label, className = "" }) => {
  const displayRating = (rating !== null && rating !== undefined) ? Math.max(0, Math.min(rating, maxStars)) : null;
  return (
    <div className={`flex items-center text-xs mb-1 ${className}`}>
      {label && <span className="text-[var(--color-text-light)] mr-1.5 min-w-[90px] text-xs">{label}:</span>}
      {displayRating !== null ? (
        <div className="star-rating-feedback">
          {Array.from({ length: maxStars }, (_, i) => (
            <span key={i} className={`star ${i < displayRating ? 'filled' : 'empty'} !text-sm`}>
              <i className={`fas fa-star`}></i>
            </span>
          ))}
          <span className="ml-1.5 text-[var(--color-text-light)] text-xs">({displayRating.toFixed(1)}/{maxStars})</span>
        </div>
      ) : (
        <span className="text-xs text-[var(--color-text-light)]">N/A</span>
      )}
    </div>
  );
};


interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  initiallyOpen?: boolean;
  titleClassName?: string;
  contentClassName?: string;
}
const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, initiallyOpen = false, titleClassName = "", contentClassName = "" }) => {
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

  return (
    <div className="accordion-item border-b border-[var(--color-border)] last:border-b-0">
      <button
        type="button"
        className={`accordion-button w-full text-left py-2 px-1 ${titleClassName}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="flex-grow font-medium text-xs text-[var(--color-text)]">{title}</span>
        <span className={`accordion-icon ${isOpen ? 'open' : ''} text-xs`}>
          <i className={`fas fa-chevron-down`}></i>
        </span>
      </button>
      <div
        ref={contentRef}
        className={`accordion-content ${isOpen ? 'open' : ''} prose prose-sm max-w-none text-[var(--color-text-light)] !text-xs ${contentClassName}`}
        style={{ overflow: 'hidden', transition: 'max-height 0.3s ease-in-out, padding 0.3s ease-in-out, opacity 0.3s ease-in-out' }}
      >
        {typeof children === 'string' ? (
          <div dangerouslySetInnerHTML={{ __html: children }} />
        ) : (
          children
        )}
      </div>
    </div>
  );
};

const renderAiManagerAnalysisText = (text: string | null): string => {
    if (!text) return "";
    let html = text.replace(/\r\n|\r/g, '\n');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-sm font-semibold mt-2 mb-1 text-[var(--color-primary)]">$1</h3>'); 
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-xs font-semibold mt-1.5 mb-0.5 text-[var(--color-accent)]">$1</h4>'); 
    html = html.replace(/^\*\*(.*?)\*\*:\s*/gim, '<strong class="text-[var(--color-text)]">$1:</strong> '); 
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); 
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');       

    const lines = html.split('\n');
    let processedHtml = "";
    let inList = false;
    let listType: 'ul' | 'ol' = 'ul';

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const olMatch = line.match(/^(\d+)\.\s+(.*)/);
        const ulMatch = line.match(/^[-*+]\s+(.*)/);

        if (olMatch) {
            if (!inList || listType !== 'ol') {
                if (inList) processedHtml += `</${listType}>`;
                processedHtml += '<ol class="list-decimal list-inside pl-3 my-0.5 text-xs space-y-px">';
                inList = true;
                listType = 'ol';
            }
            processedHtml += `<li>${olMatch[2]}</li>`;
        } else if (ulMatch) {
            if (!inList || listType !== 'ul') {
                if (inList) processedHtml += `</${listType}>`;
                processedHtml += '<ul class="list-disc list-inside pl-3 my-0.5 text-xs space-y-px">';
                inList = true;
                listType = 'ul';
            }
            processedHtml += `<li>${ulMatch[1]}</li>`;
        } else {
            if (inList) {
                processedHtml += `</${listType}>`;
                inList = false;
            }
            if (line.trim() !== "") {
                if (line.match(/^<h[34]>/)) {
                    processedHtml += line;
                } else {
                    processedHtml += `<p class="my-0.5 text-xs">${line}</p>`;
                }
            }
        }
    }
    if (inList) {
        processedHtml += `</${listType}>`;
    }
    return processedHtml.replace(/<p>\s*<\/p>/g, ''); 
};

const AnimatedLoadingText: React.FC<{ messages: string[], interval?: number }> = ({ messages, interval = 2000 }) => {
    const [messageIndex, setMessageIndex] = useState(0);
    const [dots, setDots] = useState('');

    useEffect(() => {
        const messageIntervalId = setInterval(() => {
            setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
        }, interval); 

        const dotsIntervalId = setInterval(() => {
            setDots((prevDots) => (prevDots.length >= 3 ? '' : prevDots + '.'));
        }, 500); 

        return () => {
            clearInterval(messageIntervalId);
            clearInterval(dotsIntervalId);
        };
    }, [messages, interval]);

    return <span className="text-[var(--color-primary)] opacity-90 text-sm">{messages[messageIndex]}{dots}</span>;
};


const CollaboratorDashboard: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [collaboratorName, setCollaboratorName] = useState<string>('');
  const [userQuizAttempts, setUserQuizAttempts] = useState<QuizAttemptRecord[]>([]);
  const [userSimulationRecords, setUserSimulationRecords] = useState<SimulationRecord[]>([]);
  const [performanceSnapshot, setPerformanceSnapshot] = useState<PerformanceSnapshotData | null>(null);

  const [selectedSimulation, setSelectedSimulation] = useState<SimulationRecord | null>(null);
  const [selectedQuizAttempt, setSelectedQuizAttempt] = useState<QuizAttemptRecord | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingAiAnalysis, setIsGeneratingAiAnalysis] = useState(false);
  const [generatedAiAnalysisText, setGeneratedAiAnalysisText] = useState<string | null>(null);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let currentCollaboratorName = '';

    let loadedQuizAttempts: QuizAttemptRecord[] = [];
    try {
      const storedQuizAttempts = localStorage.getItem(LOCAL_STORAGE_QUIZ_ATTEMPTS_KEY);
      loadedQuizAttempts = storedQuizAttempts ? JSON.parse(storedQuizAttempts) : [];
      const filteredQuizAttempts = loadedQuizAttempts.filter(qa => qa.userId === userId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setUserQuizAttempts(filteredQuizAttempts);
      if (filteredQuizAttempts.length > 0) {
        currentCollaboratorName = filteredQuizAttempts[0].username;
      }
    } catch (e) { console.error("Error loading quiz attempts for collaborator:", e); }

    let loadedSimRecords: SimulationRecord[] = [];
    try {
      const storedSimRecords = localStorage.getItem(LOCAL_STORAGE_SIMULATION_RECORDS_KEY);
      let parsedSimRecords: SimulationRecord[] = storedSimRecords ? JSON.parse(storedSimRecords) : [];
      parsedSimRecords = parsedSimRecords.map(record => ({
        ...record,
        messages: record.messages.map(msg => ({
          ...msg,
          timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp
        }))
      }));
      const filteredSimRecords = parsedSimRecords.filter(sr => sr.userId === userId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setUserSimulationRecords(filteredSimRecords);
      if (filteredSimRecords.length > 0 && !currentCollaboratorName) {
        currentCollaboratorName = filteredSimRecords[0].username;
      }
    } catch (e) { console.error("Error loading simulation records for collaborator:", e); }
    
    if (!currentCollaboratorName && userId) {
        currentCollaboratorName = (userId === 'admin' ? 'Admin' : userId);
    }
    setCollaboratorName(currentCollaboratorName);


    const calculateSnapshot = (quizAttempts: QuizAttemptRecord[], simRecords: SimulationRecord[]): PerformanceSnapshotData => {
        let avgQuizScore: number | null = null;
        if (quizAttempts.length > 0) {
          const totalScore = quizAttempts.reduce((sum, qa) => sum + (qa.score / qa.totalQuestions), 0);
          avgQuizScore = (totalScore / quizAttempts.length) * 100;
        }

        const avgStarRatingsVal = { acolhimento: 0, clareza: 0, argumentacao: 0, fechamento: 0 };
        let simRatingsCount = 0;
        simRecords.forEach(sr => {
          if (sr.evaluation?.generalNotes) {
            simRatingsCount++;
            avgStarRatingsVal.acolhimento += sr.evaluation.generalNotes.acolhimento || 0;
            avgStarRatingsVal.clareza += sr.evaluation.generalNotes.clareza || 0;
            avgStarRatingsVal.argumentacao += sr.evaluation.generalNotes.argumentacao || 0;
            avgStarRatingsVal.fechamento += sr.evaluation.generalNotes.fechamento || 0;
          }
        });

        if (simRatingsCount > 0) {
          avgStarRatingsVal.acolhimento /= simRatingsCount;
          avgStarRatingsVal.clareza /= simRatingsCount;
          avgStarRatingsVal.argumentacao /= simRatingsCount;
          avgStarRatingsVal.fechamento /= simRatingsCount;
        }
        
        const recentPositiveFb: string[] = [];
        const recentCriticalFb: string[] = [];
        const recentSims = simRecords.slice(0, 3);

        recentSims.forEach(sim => {
            if (sim.evaluation) {
                if (sim.evaluation.outcomeType === 'VENDA_REALIZADA') {
                    if (sim.evaluation.mainSuccessPoints && sim.evaluation.mainSuccessPoints.length > 0 && recentPositiveFb.length < 3) {
                        recentPositiveFb.push(sim.evaluation.mainSuccessPoints[0].title);
                    }
                    if (sim.evaluation.attentionPointSuccess && recentCriticalFb.length < 3) {
                        recentCriticalFb.push(sim.evaluation.attentionPointSuccess.description);
                    }
                } else if (sim.evaluation.outcomeType === 'VENDA_NAO_REALIZADA') {
                    if (sim.evaluation.mainErrors && sim.evaluation.mainErrors.length > 0 && recentCriticalFb.length < 3) {
                        recentCriticalFb.push(sim.evaluation.mainErrors[0].title);
                    }
                    if (sim.evaluation.positivePointFailure && recentPositiveFb.length < 3) {
                        recentPositiveFb.push(sim.evaluation.positivePointFailure.description);
                    }
                }
            }
        });


        return {
          averageQuizScore: avgQuizScore,
          quizAttemptsCount: quizAttempts.length,
          simulationsCompletedCount: simRecords.length,
          averageStarRatings: avgStarRatingsVal,
          recentPositiveFeedback: recentPositiveFb.slice(0,3),
          recentCriticalFeedback: recentCriticalFb.slice(0,3),
        };
    };
    
    setPerformanceSnapshot(calculateSnapshot(loadedQuizAttempts.filter(qa => qa.userId === userId), loadedSimRecords.filter(sr => sr.userId === userId)));
    setIsLoading(false);

  }, [userId]);

  const aggregateUserDataForAiAnalysis = (): string => {
    if (!userId || !collaboratorName || !performanceSnapshot) return "Dados insuficientes para análise completa.";

    let dataString = `**Análise de Performance do Colaborador: ${collaboratorName} (ID: ${userId})**\n\n`;
    
    dataString += `**--- RESUMO DE PERFORMANCE GERAL (TODOS OS PERÍODOS) ---**\n`;
    dataString += `- Média Global nos Quizzes: ${performanceSnapshot.averageQuizScore !== null ? performanceSnapshot.averageQuizScore.toFixed(1) + '%' : 'N/A'} (Baseado em ${performanceSnapshot.quizAttemptsCount} tentativas)\n`;
    dataString += `- Total de Simulações Concluídas: ${performanceSnapshot.simulationsCompletedCount}\n`;
    if (performanceSnapshot.simulationsCompletedCount > 0) {
      dataString += `- Média de Estrelas em Simulações (Acolhimento): ${performanceSnapshot.averageStarRatings.acolhimento.toFixed(1)}/5\n`;
      dataString += `- Média de Estrelas em Simulações (Clareza): ${performanceSnapshot.averageStarRatings.clareza.toFixed(1)}/5\n`;
      dataString += `- Média de Estrelas em Simulações (Argumentação): ${performanceSnapshot.averageStarRatings.argumentacao.toFixed(1)}/5\n`;
      dataString += `- Média de Estrelas em Simulações (Fechamento): ${performanceSnapshot.averageStarRatings.fechamento.toFixed(1)}/5\n`;
    }
    dataString += "\n";

    dataString += `**--- HISTÓRICO DETALHADO DE QUIZZES (Últimas ${userQuizAttempts.slice(0, 5).length} de ${userQuizAttempts.length} tentativas) ---**\n`;
    if (userQuizAttempts.length > 0) {
        userQuizAttempts.slice(0, 5).forEach((attempt, index) => {
        dataString += `\n**Quiz #${index + 1} (${attempt.quizTitle})**\n`;
        dataString += `  - Data: ${formatDate(attempt.timestamp)}\n`;
        dataString += `  - Pontuação: ${attempt.score}/${attempt.totalQuestions} (${((attempt.score/attempt.totalQuestions)*100).toFixed(1)}%)\n`;
        dataString += `  - Detalhes das Respostas (Primeiras 3 questões):\n`;
        attempt.questionsUsed.slice(0,3).forEach(q => {
            const userAnswer = attempt.answers.find(ans => ans.questionId === q.id);
            if (userAnswer) {
                dataString += `    - Pergunta: "${q.text.substring(0,80)}..."\n`;
                const userAnswerText = Array.isArray(userAnswer.answer) ? userAnswer.answer.join(', ').substring(0,80) : String(userAnswer.answer).substring(0,80);
                dataString += `    - Resposta do Colaborador: "${userAnswerText}" (${userAnswer.isCorrect ? "Correta" : "Incorreta"})\n`;
                if (!userAnswer.isCorrect) {
                   let correctAnswerText = "";
                    if (q.type === 'multiple-choice' || q.type === 'true-false') { correctAnswerText = q.options?.filter(opt => opt.correct).map(opt => opt.text).join(', ') || "";
                    } else if (q.type === 'ordering' && q.correctOrderFeedback) { correctAnswerText = q.correctOrderFeedback.join(' -> ');}
                    dataString += `    - Resposta Correta: "${correctAnswerText.substring(0,80)}"\n`;
                }
            }
        });
        });
    } else {
        dataString += "Nenhuma tentativa de quiz registrada para este colaborador.\n";
    }
    dataString += "\n";

    dataString += `**--- HISTÓRICO DETALHADO DE SIMULAÇÕES (Últimas ${userSimulationRecords.slice(0,3).length} de ${userSimulationRecords.length} simulações) ---**\n`;
    if (userSimulationRecords.length > 0) {
        userSimulationRecords.slice(0, 3).forEach((sim, index) => {
        dataString += `\n**Simulação #${index + 1}: ${sim.scenarioTitle}**\n`;
        dataString += `  - Data: ${formatDate(sim.timestamp)}\n`;
        
        if (sim.evaluation) {
            dataString += `  - Resultado da Simulação (IA): ${sim.evaluation.headerMessage} ${sim.evaluation.isBossScenarioSuccess ? "👑" : ""}\n`;
            dataString += `  - Comentário Resumido (IA): ${sim.evaluation.quickSummary || 'N/A'}\n`;
            if(sim.evaluation.generalNotes) {
                dataString += `  - Estrelas Detalhadas: Acolhimento: ${sim.evaluation.generalNotes.acolhimento || 0}, Clareza: ${sim.evaluation.generalNotes.clareza || 0}, Argumentação: ${sim.evaluation.generalNotes.argumentacao || 0}, Fechamento: ${sim.evaluation.generalNotes.fechamento || 0}\n`;
            }
            if (sim.evaluation.outcomeType === 'VENDA_NAO_REALIZADA' && sim.evaluation.mainErrors && sim.evaluation.mainErrors.length > 0) {
                const errorsSummary = sim.evaluation.mainErrors.map(e => `${e.title}: ${e.description.substring(0,50)}...`).join('; ').substring(0,250);
                dataString += `  - Principais Pontos Críticos (IA): "${errorsSummary}..."\n`;
            } else if (sim.evaluation.outcomeType === 'VENDA_REALIZADA' && sim.evaluation.mainSuccessPoints && sim.evaluation.mainSuccessPoints.length > 0) {
                const successSummary = sim.evaluation.mainSuccessPoints.map(s => `${s.title}: ${s.description.substring(0,50)}...`).join('; ').substring(0,250);
                dataString += `  - Principais Pontos Positivos (IA): "${successSummary}..."\n`;
            }
        } else {
            dataString += "  - Avaliação da IA não disponível para esta simulação.\n";
        }
        dataString += "  - Trecho da Conversa (Últimas 4 mensagens):\n";
        const lastMessages = sim.messages.slice(-4);
        lastMessages.forEach(msg => {
            const sender = msg.isUser ? sim.username : (sim.evaluation?.clientInfo.nome || 'Cliente IA');
            dataString += `    - ${sender}: "${msg.text.substring(0, 120)}${msg.text.length > 120 ? '...' : ''}"\n`;
        });
        });
    } else {
        dataString += "Nenhum registro de simulação encontrado para este colaborador.\n";
    }
    dataString += "\n**FIM DOS DADOS DO COLABORADOR**";
    return dataString;
  };

  const handleGenerateAiAnalysis = async () => {
    if (!userId || !collaboratorName) return;
    setIsGeneratingAiAnalysis(true);
    setGeneratedAiAnalysisText(null);
    setAiAnalysisError(null);

    const userDataString = aggregateUserDataForAiAnalysis();
    try {
      const analysis = await generateCollaboratorAnalysis(userDataString, GEMINI_COMMERCIAL_MANAGER_ANALYSIS_PROMPT_TEMPLATE);
      setGeneratedAiAnalysisText(analysis);
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      setAiAnalysisError((error as Error).message || "Falha ao gerar análise da IA.");
    } finally {
      setIsGeneratingAiAnalysis(false);
    }
  };

  const vendasRealizadas = useMemo(() => {
    return userSimulationRecords.filter(sr => 
      sr.evaluation && sr.evaluation.outcomeType === 'VENDA_REALIZADA'
    );
  }, [userSimulationRecords]);

  const vendasNaoRealizadas = useMemo(() => {
    return userSimulationRecords.filter(sr => 
      sr.evaluation && sr.evaluation.outcomeType === 'VENDA_NAO_REALIZADA'
    );
  }, [userSimulationRecords]);


  if (isLoading) {
    return <div className="py-12"><LoadingSpinner text={`Carregando dados do colaborador ${collaboratorName || userId}...`} /></div>;
  }

  if (!userId || !collaboratorName) {
    return (
      <section className="py-8">
        <h1 className="section-title">Colaborador Não Encontrado</h1>
        <p className="text-center text-[var(--color-text-light)]">Não foi possível carregar os dados para o ID: {userId}.</p>
        <div className="text-center mt-6">
            <Link to={`/${NavigationSection.AdminPanel}`}>
                <GlassButton className="themed-button">Voltar ao Painel Admin</GlassButton>
            </Link>
        </div>
      </section>
    );
  }

  const renderDetailedEvaluation = (evaluation: ParsedEvaluation) => {
    return (
      <>
        <p className="font-semibold text-sm mb-1">{evaluation.headerMessage} {evaluation.isBossScenarioSuccess ? "👑" : ""}</p>
        {evaluation.quickSummary && <p className="italic mb-1 text-[var(--color-text-light)] text-xs">{evaluation.quickSummary}</p>}
        
        <div className="my-1 p-1 border border-[var(--color-border)] rounded bg-[var(--color-bg)] text-xs">
            <h5 className="font-medium text-[var(--color-accent)] mb-0.5 text-xs">Informações do Lead (Simulado)</h5>
            <p><strong>Nome:</strong> {evaluation.clientInfo.nome || 'N/A'}</p>
            <p><strong>Curso:</strong> {evaluation.clientInfo.curso || 'N/A'}</p>
            <p><strong>Vida:</strong> {evaluation.clientInfo.vida || 'N/A'}</p>
            <p><strong>Busca:</strong> {evaluation.clientInfo.busca || 'N/A'}</p>
            <p><strong>Medo:</strong> {evaluation.clientInfo.medo || 'N/A'}</p>
            <p><strong>Perfil:</strong> {evaluation.clientInfo.perfilComportamental || 'N/A'}</p>
        </div>

        <div className="my-1 p-1 border border-[var(--color-border)] rounded bg-[var(--color-bg)] text-xs">
            <h5 className="font-medium text-[var(--color-accent)] mb-0.5 text-xs">Avaliação Geral (Estrelas)</h5>
            <StarRatingDisplay rating={evaluation.generalNotes.acolhimento} label="Acolhimento" className="!mb-0"/>
            <StarRatingDisplay rating={evaluation.generalNotes.clareza} label="Clareza"  className="!mb-0"/>
            <StarRatingDisplay rating={evaluation.generalNotes.argumentacao} label="Argumentação"  className="!mb-0"/>
            <StarRatingDisplay rating={evaluation.generalNotes.fechamento} label="Fechamento"  className="!mb-0"/>
        </div>

        {evaluation.mainErrors && evaluation.mainErrors.length > 0 && (
            <AccordionItem title="Principais Erros" initiallyOpen titleClassName="!text-[var(--error)] !py-1 !text-xs" contentClassName="!text-xs">
                {evaluation.mainErrors.map((item, idx) => <p key={`err-${idx}`}><strong>{item.title}:</strong> {item.description}</p>)}
            </AccordionItem>
        )}
        {evaluation.mainSuccessPoints && evaluation.mainSuccessPoints.length > 0 && (
            <AccordionItem title="Principais Acertos" initiallyOpen titleClassName="!text-[var(--success)] !py-1 !text-xs" contentClassName="!text-xs">
                 {evaluation.mainSuccessPoints.map((item, idx) => <p key={`succ-${idx}`}><strong>{item.title}:</strong> {item.description}</p>)}
            </AccordionItem>
        )}
         {evaluation.positivePointFailure && (
            <AccordionItem title="Ponto Positivo (Apesar da Falha)" initiallyOpen titleClassName="!text-[var(--success)] !py-1 !text-xs" contentClassName="!text-xs">
                <p>{evaluation.positivePointFailure.description}</p>
                {evaluation.positivePointFailure.tip && <p><em>Dica: {evaluation.positivePointFailure.tip}</em></p>}
            </AccordionItem>
        )}
        {evaluation.attentionPointSuccess && (
            <AccordionItem title="Ponto de Atenção (Apesar do Sucesso)" initiallyOpen titleClassName="!text-orange-500 !py-1 !text-xs" contentClassName="!text-xs">
                <p>{evaluation.attentionPointSuccess.description}</p>
                {evaluation.attentionPointSuccess.tip && <p><em>Dica: {evaluation.attentionPointSuccess.tip}</em></p>}
            </AccordionItem>
        )}

        {evaluation.conversationAnalysis && (
            <AccordionItem title="Análise da Conversa" titleClassName="!py-1 !text-xs" contentClassName="!text-xs">
                <p><strong>Conhecimento dos Cursos:</strong> {evaluation.conversationAnalysis.conhecimentoCursos || 'N/A'}</p>
                <p><strong>Escuta Ativa:</strong> {evaluation.conversationAnalysis.escutaAtiva || 'N/A'}</p>
                <p><strong>Contorno de Dúvidas/Objeções:</strong> {evaluation.conversationAnalysis.contornoDuvidasOuObjecoes || 'N/A'}</p>
                <p><strong>Apresentação dos Diferenciais:</strong> {evaluation.conversationAnalysis.apresentacaoDiferenciais || 'N/A'}</p>
                <p><strong>Fechamento:</strong> {evaluation.conversationAnalysis.fechamento || 'N/A'}</p>
            </AccordionItem>
        )}
        {evaluation.improvementStepsOrTips && evaluation.improvementStepsOrTips.length > 0 && (
            <AccordionItem title="Como Melhorar / Dicas para Manter o Sucesso" titleClassName="!py-1 !text-xs" contentClassName="!text-xs">
                <ul className="list-disc pl-4">
                    {evaluation.improvementStepsOrTips.map((tip, idx) => <li key={`tip-${idx}`}>{tip}</li>)}
                </ul>
            </AccordionItem>
        )}
        {evaluation.finalSummary && (
            <AccordionItem title="Resumo Final da IA" titleClassName="!py-1 !text-xs" contentClassName="!text-xs">
                <p>{evaluation.finalSummary}</p>
                {evaluation.finalDevelopmentNote && <p className="mt-1"><strong>Foco para Desenvolvimento:</strong> {evaluation.finalDevelopmentNote}</p>}
            </AccordionItem>
        )}
      </>
    );
  };

  return (
    <section id={`collaborator-dashboard-${userId}`} className="py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="section-title !mb-0 !border-b-0">Dashboard: {collaboratorName}</h1>
        <Link to={`/${NavigationSection.AdminPanel}`}>
          <GlassButton className="themed-button !text-sm !py-2">
            <i className="fas fa-arrow-left mr-2"></i>Voltar ao Painel Admin
          </GlassButton>
        </Link>
      </div>

      {performanceSnapshot && (
        <GlassCard className="mb-8 p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-3 text-[var(--color-primary)]">Resumo Geral de Performance (All-Time)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p><strong>Simulações Realizadas:</strong> {performanceSnapshot.simulationsCompletedCount}</p>
              <p><strong>Tentativas de Quiz Realizadas:</strong> {performanceSnapshot.quizAttemptsCount}</p>
              <p><strong>Pontuação Média nos Quizzes:</strong> {performanceSnapshot.averageQuizScore !== null ? `${performanceSnapshot.averageQuizScore.toFixed(1)}%` : 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium text-[var(--color-text-light)] mb-1 text-sm">Avaliações Médias em Simulações:</h4>
              <StarRatingDisplay rating={performanceSnapshot.averageStarRatings.acolhimento} label="Acolhimento" />
              <StarRatingDisplay rating={performanceSnapshot.averageStarRatings.clareza} label="Clareza" />
              <StarRatingDisplay rating={performanceSnapshot.averageStarRatings.argumentacao} label="Argumentação" />
              <StarRatingDisplay rating={performanceSnapshot.averageStarRatings.fechamento} label="Fechamento" />
            </div>
             {(performanceSnapshot.recentPositiveFeedback.length > 0 || performanceSnapshot.recentCriticalFeedback.length > 0) &&
              <div className="md:col-span-2 mt-2">
                <h4 className="font-medium text-[var(--color-text-light)] mb-1 text-sm">Destaques Recentes de Feedback (Últimas Simulações):</h4>
                {performanceSnapshot.recentPositiveFeedback.length > 0 && (
                    <div>
                        <h5 className="font-medium text-[var(--success)] mt-1 mb-0.5 text-xs">👍 Pontos Fortes:</h5>
                        <ul className="list-disc list-inside pl-3 space-y-0.5 text-xs text-[var(--color-text-light)]">
                            {performanceSnapshot.recentPositiveFeedback.map((fb, i) => <li key={`pos-collab-${i}`}>{fb.length > 150 ? fb.substring(0,150) + "..." : fb}</li>)}
                        </ul>
                    </div>
                )}
                {performanceSnapshot.recentCriticalFeedback.length > 0 && (
                    <div className="mt-1">
                        <h5 className="font-medium text-[var(--error)] mt-1 mb-0.5 text-xs">⚠️ Pontos a Melhorar:</h5>
                        <ul className="list-disc list-inside pl-3 space-y-0.5 text-xs text-[var(--color-text-light)]">
                            {performanceSnapshot.recentCriticalFeedback.map((fb, i) => <li key={`crit-collab-${i}`}>{fb.length > 150 ? fb.substring(0,150) + "..." : fb}</li>)}
                        </ul>
                    </div>
                )}
              </div>
            }
          </div>
        </GlassCard>
      )}

      <GlassCard className="mb-8 p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-3 text-[var(--color-primary)]">Análise avançada sobre o usuário {collaboratorName}</h2>
        {aiAnalysisError && !isGeneratingAiAnalysis && (
            <p className="text-[var(--error)] bg-[rgba(var(--error-rgb),0.1)] p-3 rounded-md border border-[rgba(var(--error-rgb),0.2)] my-4 text-sm">
                Erro ao gerar análise: {aiAnalysisError}
            </p>
        )}
        {generatedAiAnalysisText && !isGeneratingAiAnalysis && (
            <div className="prose prose-sm max-w-none text-[var(--color-text-light)] my-4 p-3 bg-[var(--color-input-bg)] rounded-md border border-[var(--color-border)] text-xs"
                 dangerouslySetInnerHTML={{ __html: renderAiManagerAnalysisText(generatedAiAnalysisText) }}>
            </div>
        )}
        <div className="flex items-center">
            <GlassButton 
                onClick={handleGenerateAiAnalysis} 
                disabled={isGeneratingAiAnalysis}
                className="themed-button !text-sm !py-2 !px-4 mt-2"
            >
                <i className="fas fa-brain mr-2"></i>
                {generatedAiAnalysisText ? "Regerar análise avançada" : "Obter análise avançada"}
            </GlassButton>
            {isGeneratingAiAnalysis && 
                <div className="ml-4 mt-2">
                    <LoadingSpinner size="sm" />
                    <AnimatedLoadingText messages={AI_ANALYSIS_LOADING_MESSAGES} interval={2200}/>
                </div>
            }
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4 text-[var(--color-primary)]">
            Vendas Realizadas ({vendasRealizadas.length})
          </h2>
          {vendasRealizadas.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar max-h-96">
              <table className="min-w-full divide-y divide-[var(--color-border)] text-xs">
                <thead className="bg-[var(--color-input-bg)] sticky top-0">
                  <tr>
                    <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text)]">Cenário</th>
                    <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text)]">Data</th>
                    <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text)]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {vendasRealizadas.map(record => (
                    <tr key={`venda-${record.id}`} className="hover:bg-[var(--color-input-bg)] transition-colors">
                      <td className="px-3 py-1.5 text-[var(--color-text-light)] truncate max-w-[150px] sm:max-w-xs" title={record.scenarioTitle}>{record.scenarioTitle}</td>
                      <td className="px-3 py-1.5 text-[var(--color-text-light)] whitespace-nowrap">{formatDate(record.timestamp)}</td>
                      <td className="px-3 py-1.5">
                        <GlassButton onClick={() => setSelectedSimulation(record)} className="!text-xs !py-1 !px-2">
                          Detalhes
                        </GlassButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-[var(--color-text-light)] text-sm">Nenhuma venda realizada encontrada.</p>}
        </GlassCard>

        <GlassCard className="p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4 text-[var(--color-primary)]">
            Vendas Não Realizadas ({vendasNaoRealizadas.length})
          </h2>
          {vendasNaoRealizadas.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar max-h-96">
              <table className="min-w-full divide-y divide-[var(--color-border)] text-xs">
                <thead className="bg-[var(--color-input-bg)] sticky top-0">
                  <tr>
                    <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text)]">Cenário</th>
                    <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text)]">Data</th>
                    <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text)] hidden sm:table-cell">Motivo Breve</th>
                    <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text)]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {vendasNaoRealizadas.map(record => {
                    const motivo = record.evaluation?.quickSummary?.substring(0, 50) + '...' || 'N/A';
                    return (
                      <tr key={`nao-venda-${record.id}`} className="hover:bg-[var(--color-input-bg)] transition-colors">
                        <td className="px-3 py-1.5 text-[var(--color-text-light)] truncate max-w-[150px] sm:max-w-xs" title={record.scenarioTitle}>{record.scenarioTitle}</td>
                        <td className="px-3 py-1.5 text-[var(--color-text-light)] whitespace-nowrap">{formatDate(record.timestamp)}</td>
                        <td className="px-3 py-1.5 text-[var(--color-text-light)] truncate max-w-[100px] hidden sm:table-cell" title={motivo}>{motivo}</td>
                        <td className="px-3 py-1.5">
                          <GlassButton onClick={() => setSelectedSimulation(record)} className="!text-xs !py-1 !px-2">
                            Detalhes
                          </GlassButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <p className="text-[var(--color-text-light)] text-sm">Nenhuma venda não realizada encontrada.</p>}
        </GlassCard>
      </div>
      
      <GlassCard className="mt-8 p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary)]">Histórico de Simulações ({userSimulationRecords.length})</h2>
        {userSimulationRecords.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar max-h-96">
            <table className="min-w-full divide-y divide-[var(--color-border)] text-xs">
              <thead className="bg-[var(--color-input-bg)] sticky top-0">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text)]">Cenário</th>
                  <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text)]">Data</th>
                  <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text)]">Resultado</th>
                  <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text)]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {userSimulationRecords.map(record => (
                  <tr key={record.id} className="hover:bg-[var(--color-input-bg)] transition-colors">
                    <td className="px-3 py-1.5 text-[var(--color-text-light)] truncate max-w-[150px] sm:max-w-xs" title={record.scenarioTitle}>{record.scenarioTitle}</td>
                    <td className="px-3 py-1.5 text-[var(--color-text-light)] whitespace-nowrap">{formatDate(record.timestamp)}</td>
                    <td className="px-3 py-1.5 text-[var(--color-text-light)] truncate max-w-[150px]" title={record.evaluation?.headerMessage}>{record.evaluation?.headerMessage || 'N/A'}</td>
                    <td className="px-3 py-1.5">
                      <GlassButton onClick={() => setSelectedSimulation(record)} className="!text-xs !py-1 !px-2">
                        Ver Detalhes
                      </GlassButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-[var(--color-text-light)] text-sm">Nenhum registro de simulação encontrado.</p>}
      </GlassCard>

      <GlassCard className="mt-8 p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary)]">Histórico de Quizzes ({userQuizAttempts.length})</h2>
        {userQuizAttempts.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar max-h-96">
            <table className="min-w-full divide-y divide-[var(--color-border)] text-xs">
              <thead className="bg-[var(--color-input-bg)] sticky top-0">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text)]">Quiz</th>
                  <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text)]">Data</th>
                  <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text)]">Pontuação</th>
                  <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text)]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {userQuizAttempts.map(attempt => (
                  <tr key={attempt.id} className="hover:bg-[var(--color-input-bg)] transition-colors">
                    <td className="px-3 py-1.5 text-[var(--color-text-light)] truncate max-w-xs" title={attempt.quizTitle}>{attempt.quizTitle}</td>
                    <td className="px-3 py-1.5 text-[var(--color-text-light)] whitespace-nowrap">{formatDate(attempt.timestamp)}</td>
                    <td className="px-3 py-1.5 text-[var(--color-text-light)]">{attempt.score}/{attempt.totalQuestions} ({((attempt.score/attempt.totalQuestions)*100).toFixed(1)}%)</td>
                    <td className="px-3 py-1.5">
                      <GlassButton onClick={() => setSelectedQuizAttempt(attempt)} className="!text-xs !py-1 !px-2">
                        Ver Detalhes
                      </GlassButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-[var(--color-text-light)] text-sm">Nenhuma tentativa de quiz encontrada.</p>}
      </GlassCard>

      {selectedSimulation && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <GlassCard className="w-full max-w-3xl max-h-[90vh] flex flex-col p-0">
            <div className="p-3 border-b border-[var(--color-border)]">
              <h3 className="text-md font-semibold text-[var(--color-primary)]">Detalhes da Simulação</h3>
              <p className="text-xs text-[var(--color-text-light)]">Usuário: {selectedSimulation.username} | Cenário: {selectedSimulation.scenarioTitle}</p>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-3 text-xs">
              <div>
                <h4 className="text-xs font-semibold text-[var(--color-text)] mb-1">Transcrição da Conversa:</h4>
                <GlassCard className="themed-surface-secondary p-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {selectedSimulation.messages.map(msg => <MessageBubble key={msg.id} message={{...msg, timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp) }} />)}
                </GlassCard>
              </div>
              {selectedSimulation.evaluation && renderDetailedEvaluation(selectedSimulation.evaluation)}
            </div>
            <div className="p-2.5 border-t border-[var(--color-border)] text-right">
              <GlassButton onClick={() => setSelectedSimulation(null)} className="themed-button !text-xs !py-1.5 !px-2.5">Fechar</GlassButton>
            </div>
          </GlassCard>
        </div>
      )}

      {selectedQuizAttempt && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <GlassCard className="w-full max-w-2xl max-h-[90vh] flex flex-col p-0">
            <div className="p-3 border-b border-[var(--color-border)]">
              <h3 className="text-md font-semibold text-[var(--color-primary)]">Detalhes da Tentativa do Quiz</h3>
              <p className="text-xs text-[var(--color-text-light)]">Usuário: {selectedQuizAttempt.username} | Quiz: {selectedQuizAttempt.quizTitle}</p>
              <p className="text-xs text-[var(--color-text-light)]">Pontuação: {selectedQuizAttempt.score}/{selectedQuizAttempt.totalQuestions} ({((selectedQuizAttempt.score/selectedQuizAttempt.totalQuestions)*100).toFixed(1)}%)</p>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-1.5 text-xs">
              {selectedQuizAttempt.questionsUsed.map((q) => {
                const userAnswerRec = selectedQuizAttempt.answers.find(ans => ans.questionId === q.id);
                let displayUserAnswerContent: React.ReactNode = <em className="text-[var(--color-text-light)]">Não respondida</em>;
                if (userAnswerRec) { 
                    if (q.type === 'ordering' && Array.isArray(userAnswerRec.answer)) {
                        displayUserAnswerContent = ( <ol className="list-decimal list-inside text-xs"> {(userAnswerRec.answer as string[]).map((item, idx) => <li key={`ans-${q.id}-${idx}`}>{item}</li>)} </ol> );
                    } else if (q.type === 'multiple-choice' && q.allowMultipleAnswers && Array.isArray(userAnswerRec.answer)) {
                        displayUserAnswerContent = (userAnswerRec.answer as string[]).join(', ');
                    } else if (typeof userAnswerRec.answer === 'string') {
                        displayUserAnswerContent = userAnswerRec.answer;
                    }
                }
                let correctAnswerText: React.ReactNode = "";
                 if (q.type === 'multiple-choice' || q.type === 'true-false') { correctAnswerText = q.options?.filter(opt => opt.correct).map(opt => opt.text).join(', ') || "Não aplicável";
                } else if (q.type === 'ordering' && q.correctOrderFeedback) { correctAnswerText = ( <ol className="list-decimal list-inside text-xs"> {q.correctOrderFeedback.map((item, idx) => <li key={`corr-${q.id}-${idx}`}>{item}</li>)} </ol> ); }
                const isCorrect = userAnswerRec ? userAnswerRec.isCorrect : false;
                return (
                  <GlassCard key={q.id} className={`themed-surface-secondary p-2 text-xs ${isCorrect ? 'border-l-2 border-[var(--success)]' : 'border-l-2 border-[var(--error)]'}`}>
                    <p className="font-medium text-xs text-[var(--color-text)] mb-0.5">({q.id}) {q.text}</p>
                    <p className="text-xs">Sua Resposta: <span className={isCorrect ? 'text-[var(--success)]' : 'text-[var(--error)]'}>{displayUserAnswerContent}</span></p>
                    {!isCorrect && <p className="text-xs mt-0.5">Resposta Correta: <span className="text-[var(--success)]">{correctAnswerText}</span></p>}
                    {q.feedback && <p className="italic text-[var(--color-text-light)] mt-0.5 text-xs">Feedback: {q.feedback}</p>}
                  </GlassCard>
                );
              })}
            </div>
            <div className="p-2.5 border-t border-[var(--color-border)] text-right">
              <GlassButton onClick={() => setSelectedQuizAttempt(null)} className="themed-button !text-xs !py-1.5 !px-2.5">Fechar</GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </section>
  );
};

export default CollaboratorDashboard;
