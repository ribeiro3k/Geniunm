import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Objection } from '../../types';
import { OBJECTIONS_LIST, API_KEY_ERROR_MESSAGE } from '../../constants';
import { evaluateObjectionResponse, transcribeAudioWithGemini } from '../../services/geminiService';
import AudioControls from '../SimulatorSection/AudioControls'; 
import LoadingSpinner from '../ui/LoadingSpinner';
import GlassButton from '../ui/GlassButton'; // Renders as themed-button
import GlassCard from '../ui/GlassCard'; // Renders as themed-surface

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

const ObjectionTrainerSection: React.FC = () => {
  const [selectedObjection, setSelectedObjection] = useState<Objection | null>(OBJECTIONS_LIST[0] || null);
  const [userResponse, setUserResponse] = useState('');
  const [aiEvaluation, setAiEvaluation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyAvailable, setApiKeyAvailable] = useState(true);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedAudioMimeTypeRef = useRef<string>('audio/webm');


  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyAvailable(false);
      setError(API_KEY_ERROR_MESSAGE);
    }
  }, []);

  const handleObjectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const objectionId = event.target.value;
    const foundObjection = OBJECTIONS_LIST.find(ob => ob.id === objectionId) || null;
    setSelectedObjection(foundObjection);
    setUserResponse(''); 
    setAiEvaluation(null); 
    setError(null);
  };

  const handleSubmitResponse = async () => {
    if (!selectedObjection || !userResponse.trim() || !apiKeyAvailable) {
        if (!userResponse.trim()) setError("Por favor, insira sua resposta à objeção.");
        return;
    }
    setIsLoading(true);
    setAiEvaluation(null);
    setError(null);

    try {
      const evaluation = await evaluateObjectionResponse(
        selectedObjection.text,
        userResponse,
        selectedObjection.context
      );
      setAiEvaluation(evaluation);
    } catch (e) {
      const err = e as Error;
      console.error("Error getting objection evaluation:", err);
      setError(err.message || "Falha ao obter avaliação da IA.");
      setAiEvaluation(`Erro ao gerar avaliação: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRecording = async () => {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      alert('Gravação de áudio não é suportada neste navegador.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const supportedTypes = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/ogg'];
      let mimeType = 'audio/webm'; 
      for (const type of supportedTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
              mimeType = type;
              break;
          }
      }
      recordedAudioMimeTypeRef.current = mimeType;
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        if (audioChunksRef.current.length === 0) {
            setIsRecording(false);
            stream.getTracks().forEach(track => track.stop());
            return;
        }
        setIsTranscribing(true);
        setError(null);
        const audioBlob = new Blob(audioChunksRef.current, { type: recordedAudioMimeTypeRef.current });
        
        try {
            const audioBase64 = await blobToBase64(audioBlob);
            const transcriptionResponse = await transcribeAudioWithGemini(audioBase64, recordedAudioMimeTypeRef.current);
            if (transcriptionResponse.text) {
                setUserResponse(prev => prev ? `${prev} ${transcriptionResponse.text}` : transcriptionResponse.text);
            } else if (transcriptionResponse.error) {
                setError(`Transcrição falhou: ${transcriptionResponse.error}`);
            }
        } catch (transcriptionError) {
            setError(`Erro na transcrição: ${(transcriptionError as Error).message}`);
        } finally {
            setIsTranscribing(false);
            setIsRecording(false);
            stream.getTracks().forEach(track => track.stop());
            audioChunksRef.current = [];
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError(`Erro ao acessar microfone: ${(err as Error).message}. Verifique as permissões.`);
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      setIsRecording(false);
    }
  };
  
  const renderEvaluationText = (text: string | null): string => {
    if (!text) return "";
  
    let html = text;
  
    // Bold: **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
  
    // Italic: *text* or _text_
    html = html.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');
  
    // Process lines for lists and paragraphs
    const lines = html.split('\n');
    let processedHtml = "";
    let inListType: 'ul' | 'ol' | null = null;
    let listItems: string[] = [];
  
    const closeCurrentList = () => {
      if (inListType && listItems.length > 0) {
        processedHtml += `<${inListType}>${listItems.map(li => `<li>${li}</li>`).join('')}</${inListType}>`;
        listItems = [];
      }
      inListType = null;
    };
  
    let currentParagraph = "";
  
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim(); 
  
      const olMatch = line.match(/^(\d+)\.\s+(.*)/);
      const ulMatch = line.match(/^[-*+]\s+(.*)/);
  
      if (olMatch) {
        if (currentParagraph) { 
          processedHtml += `<p>${currentParagraph.trim().replace(/\n/g, '<br />')}</p>`;
          currentParagraph = "";
        }
        if (inListType !== 'ol') {
          closeCurrentList();
          inListType = 'ol';
        }
        listItems.push(olMatch[2]);
      } else if (ulMatch) {
        if (currentParagraph) { 
          processedHtml += `<p>${currentParagraph.trim().replace(/\n/g, '<br />')}</p>`;
          currentParagraph = "";
        }
        if (inListType !== 'ul') {
          closeCurrentList();
          inListType = 'ul';
        }
        listItems.push(ulMatch[1]);
      } else { 
        closeCurrentList(); 
        if (line === "") { 
          if (currentParagraph) {
            processedHtml += `<p>${currentParagraph.trim().replace(/\n/g, '<br />')}</p>`;
            currentParagraph = "";
          }
        } else {
          currentParagraph += (currentParagraph ? "\n" : "") + line; 
        }
      }
    }
  
    closeCurrentList();
    if (currentParagraph) {
      processedHtml += `<p>${currentParagraph.trim().replace(/\n/g, '<br />')}</p>`;
    }
  
    return processedHtml;
  };


  if (!apiKeyAvailable) {
    return (
      <section id="objection-trainer" className="py-12 mt-8">
        <GlassCard className="max-w-3xl mx-auto text-center p-8"> {/* themed-surface */}
          <h2 className="section-title text-[rgba(var(--error-rgb),0.9)]">Erro de Configuração</h2>
          <p className="text-xl text-[var(--text-primary)]">{API_KEY_ERROR_MESSAGE}</p>
          <p className="mt-4 text-[var(--text-secondary)]">Por favor, configure a API Key para usar o Treinador de Objeções.</p>
        </GlassCard>
      </section>
    );
  }

  return (
    <section id="objection-trainer" className="py-12 mt-8">
      <GlassCard className="max-w-3xl mx-auto p-6 md:p-8"> {/* themed-surface */}
        <h2 className="section-title">Treinador de Objeções</h2>
        <p className="mb-8 text-center text-[var(--text-secondary)] text-sm">
          Selecione uma objeção comum, formule sua melhor resposta e receba feedback da IA para aprimorar suas técnicas.
        </p>

        {error && <p className="text-[rgba(var(--error-rgb),0.9)] text-center mb-4 p-3 bg-[rgba(var(--error-rgb),0.1)] border border-[rgba(var(--error-rgb),0.3)] rounded-md">{error}</p>}

        <div className="mb-6">
          <label htmlFor="objection-select" className="block text-sm font-medium text-[var(--accent-primary)] mb-2">
            Escolha uma Objeção:
          </label>
          <select
            id="objection-select"
            value={selectedObjection?.id || ''}
            onChange={handleObjectionChange}
            className="themed-input themed-select w-full" // Use themed-input and themed-select
            disabled={isLoading || isRecording || isTranscribing}
          >
            {OBJECTIONS_LIST.map(ob => (
              <option key={ob.id} value={ob.id}>{ob.text}</option> // Options will use browser default or themed-select styling
            ))}
          </select>
        </div>

        {selectedObjection && (
          <GlassCard className="mb-6 p-4 themed-surface-secondary"> {/* themed-surface-secondary */}
            <h4 className="font-semibold text-[var(--accent-primary)]">Objeção Selecionada:</h4>
            <p className="text-[var(--text-primary)] mt-1">{selectedObjection.text}</p>
            {selectedObjection.context && (
              <p className="text-xs text-[var(--text-secondary)] mt-1 italic">Contexto: {selectedObjection.context}</p>
            )}
          </GlassCard>
        )}

        <div className="mb-6">
          <label htmlFor="user-response" className="block text-sm font-medium text-[var(--accent-primary)] mb-2">
            Sua Resposta:
          </label>
          <div className="flex items-stretch"> {/* items-stretch for equal height */}
            <textarea
              id="user-response"
              rows={5}
              className="themed-textarea flex-grow !rounded-r-none" // Use themed-textarea and adjust border radius
              placeholder="Digite aqui como você contornaria essa objeção..."
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              disabled={isLoading || isRecording || isTranscribing || !selectedObjection}
            />
            <AudioControls
                isRecording={isRecording}
                isTranscribing={isTranscribing}
                onStartRecord={handleStartRecording}
                onStopRecord={handleStopRecording}
                disabled={isLoading || !selectedObjection}
            />
          </div>
        </div>

        <div className="text-center mb-8">
          <GlassButton 
            onClick={handleSubmitResponse}
            disabled={isLoading || isRecording || isTranscribing || !selectedObjection || !userResponse.trim()}
            className="px-6 py-2.5 text-base"
          >
            {isLoading ? <LoadingSpinner size="sm" text="Analisando..." /> : "Analisar Resposta"}
          </GlassButton>
        </div>

        {aiEvaluation && !isLoading && (
          <div className="mt-6 pt-6 border-t border-[var(--border-color-light)]">
            <h3 className="section-title">Feedback da IA</h3>
            <GlassCard className="p-4 md:p-6 themed-surface-secondary"> {/* themed-surface-secondary */}
              <div className="prose prose-sm max-w-none text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: renderEvaluationText(aiEvaluation) }} />
            </GlassCard>
          </div>
        )}
      </GlassCard>
    </section>
  );
};

export default ObjectionTrainerSection;