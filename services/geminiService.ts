

import { GoogleGenAI, Chat, GenerateContentResponse, GenerateContentParameters, Part } from "@google/genai";
import { FlashcardContent, Scenario, GeminiMessage, GeneratedImage as LocalGeneratedImage, AudioTranscriptionResponse, ProceduralScenarioOutput, SimulatorBehavioralProfile } from '../types'; // Renamed to LocalGeneratedImage for clarity
import { GEMINI_SIMULATOR_PROMPT_TEMPLATE, API_KEY_ERROR_MESSAGE, GEMINI_OBJECTION_EVALUATOR_PROMPT, GEMINI_PROCEDURAL_SCENARIO_GENERATION_PROMPT, CUSTOM_SIMULATOR_PROMPT_KEY } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error(API_KEY_ERROR_MESSAGE);
  // alert(API_KEY_ERROR_MESSAGE); // Consider user-facing notification if not handled by UI
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" });

export async function generateFlashcardFromGemini(theme: string): Promise<FlashcardContent | null> {
  if (!API_KEY) throw new Error(API_KEY_ERROR_MESSAGE);
  try {
    const model = 'gemini-2.5-flash-preview-04-17';
    const prompt = `
      Crie um flashcard didático, direto ao ponto e com emojis para explicar o conceito de "${theme}", voltado para consultores que vendem cursos EAD da Cruzeiro do Sul Virtual por WhatsApp (graduação e pós).

      O flashcard deve ter:
      🔹 Uma FRENTE contendo um TÍTULO CURTO, DE ALTO IMPACTO E PERSUASIVO (MÁXIMO 5-7 PALAVRAS) OU UMA PERGUNTA RÁPIDA E PROVOCATIVA sobre o tema '${theme}'. Deve ser extremamente direto, usar linguagem de vendas/marketing eficaz e gerar curiosidade imediata, focado no contexto de vendas da Cruzeiro do Sul Virtual. Exemplos para outros temas: 'Escassez: Venda Mais!', 'Urgência: Feche Agora!', 'Preço Alto? Resolvido!', 'WhatsApp que Converte!'. Evite perguntas vagas ou títulos genéricos. Formato: Texto simples, sem markdown.
      🔹 Um VERSO com:

      🎯 **${theme}: O que é?**
      💬 [Explicação rápida e clara com emoji (1-2 frases), focada no benefício para o cliente ou na técnica de venda]

      💡 **Por que funciona?**
      💬 [Justificativa concisa (1-2 frases), apelando para psicologia de vendas ou lógica do cliente]

      🎓 **Como aplicar na venda EAD (Cruzeiro do Sul Virtual):**
      ✅ [Exemplo prático 1 com emoji, específico para o cenário de venda de cursos EAD da Cruzeiro do Sul]
      ✅ [Exemplo prático 2 com emoji, específico e acionável]
      ✅ [Exemplo prático 3 com emoji, opcional, mas útil se agregar valor diferenciado]

      💬 **Frase de Impacto para WhatsApp (Cruzeiro do Sul Virtual):**
      “[Exemplo de frase curta, direta, com gatilho mental, que o consultor pode adaptar e usar, incluindo um call-to-action sutil e emojis relevantes. Deve ser específico para o contexto da Cruzeiro do Sul Virtual.]”

      Use uma linguagem leve, informal, mas profissional e fácil de ler no celular.
      Foque em ajudar o consultor a ENTENDER o conceito e APLICAR a técnica imediatamente.
      Formate a resposta do verso usando markdown simples (negrito com **, listas com ✅ ou outro emoji apropriado).
      Separe a frente e o verso EXATAMENTE com a string "--VERSO--". NADA MAIS, NADA MENOS.
      Responda apenas com o conteúdo do flashcard, sem introduções ou despedidas.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: [{ role: "user", parts: [{text: prompt}] }],
        config: { thinkingConfig: { thinkingBudget: 0 } }
    });

    const text = response.text;
    const parts = text.split('--VERSO--');
    const safeThemeIdPart = theme.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');


    if (parts.length === 2) {
      return { id: `flashcard_theme_${safeThemeIdPart}_${crypto.randomUUID().substring(0,4)}`, front: parts[0].trim(), back: parts[1].trim(), theme };
    } else {
      console.error('Resposta da API Gemini não está no formato esperado (frente--VERSO--verso):', text);
      return {
        id: `flashcard_error_format_${safeThemeIdPart}`,
        front: `Erro de Formato: ${theme}`,
        back: `A IA não retornou o card no formato esperado. Resposta recebida:\n\n${text}`,
        theme,
      };
    }
  } catch (error) {
    console.error('Erro ao gerar flashcard com Gemini:', error);
    const safeThemeIdPart = theme.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
     return {
        id: `flashcard_error_api_${safeThemeIdPart}`,
        front: `Erro API: ${theme}`,
        back: `Houve um erro ao contatar a IA. Detalhes: ${(error as Error).message}`,
        theme,
      };
  }
}


export async function startChatSession(
  scenario: Scenario, 
  displayInitialAiMessageInChatUI: boolean
): Promise<{chat: Chat; initialAiMessage: string}> {
  if (!API_KEY) throw new Error(API_KEY_ERROR_MESSAGE);

  const customPrompt = localStorage.getItem(CUSTOM_SIMULATOR_PROMPT_KEY);
  let systemInstruction = customPrompt || GEMINI_SIMULATOR_PROMPT_TEMPLATE;

  systemInstruction = systemInstruction.replace(/{SCENARIO_TITLE}/g, scenario.title || "Indefinido");
  systemInstruction = systemInstruction.replace(/{SCENARIO_CONTEXT}/g, scenario.context || "Contexto geral de um aluno interessado em EAD.");
  systemInstruction = systemInstruction.replace(/{SCENARIO_INITIAL_MESSAGE_CONTEXT}/g, scenario.initialMessage || "Interesse geral em cursos EAD.");
  systemInstruction = systemInstruction.replace(/{BEHAVIORAL_PROFILE}/g, scenario.behavioralProfile || "Padrão");
  
  const initialHistory: GeminiMessage[] = [];
  if (displayInitialAiMessageInChatUI && scenario.initialMessage) {
    // User is consultant, AI is client, and AI client has an initial message to display.
    initialHistory.push({ role: 'model', parts: [{ text: scenario.initialMessage }] });
  }

  const currentChat = ai.chats.create({
    model: 'gemini-2.5-flash-preview-04-17',
    config: {
      systemInstruction: systemInstruction,
    },
    history: initialHistory.length > 0 ? initialHistory : undefined
  });
  
  // In standard mode, if AI has an initial message, it's already in history or will be handled by UI.
  // If `displayInitialAiMessageInChatUI` is false, it means user starts, so AI's first message isn't pre-determined.
  const firstAiMessage = displayInitialAiMessageInChatUI ? scenario.initialMessage : "";


  return { chat: currentChat, initialAiMessage: firstAiMessage };
}


export async function sendChatMessage(chat: Chat | null, userMessageText: string): Promise<string> {
  if (!API_KEY) throw new Error(API_KEY_ERROR_MESSAGE);
  if (!chat) throw new Error("Chat não iniciado.");

  try {
    const response: GenerateContentResponse = await chat.sendMessage({ message: userMessageText });
    return response.text;
  } catch (error) {
    console.error('Erro ao enviar mensagem para Gemini Chat:', error);
    if ((error as any)?.response?.promptFeedback?.blockReason) {
        return `Sua mensagem foi bloqueada pela IA. Motivo: ${(error as any).response.promptFeedback.blockReason}. Por favor, reformule sua mensagem.`;
    }
    return "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.";
  }
}

export async function generateProceduralLeadScenarioFromGemini(): Promise<Scenario | null> {
  if (!API_KEY) throw new Error(API_KEY_ERROR_MESSAGE);
  try {
    const model = 'gemini-2.5-flash-preview-04-17';
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: [{ role: "user", parts: [{ text: GEMINI_PROCEDURAL_SCENARIO_GENERATION_PROMPT }] }],
      config: { temperature: 0.85, topP: 0.95, thinkingConfig: { thinkingBudget: 0 } } // Slightly higher temp for creativity
    });

    const text = response.text;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const parsedFields: Record<string, string> = {};

    lines.forEach(line => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex > -1) {
        const key = line.substring(0, separatorIndex).trim();
        const value = line.substring(separatorIndex + 1).trim();
        parsedFields[key] = value;
      }
    });
    
    const requiredFields = [
        "LEAD_NAME", "LEAD_AGE_APPROX", "LEAD_CURRENT_SITUATION", 
        "COURSE_OF_INTEREST", "LEAD_PRIMARY_MOTIVATION", "LEAD_KEY_CONCERN_OR_DOUBT",
        "LEAD_SUBTLE_PAIN_POINT", "LEAD_SOURCE_HINT", "INITIAL_MESSAGE_TO_CONSULTANT",
        "BEHAVIORAL_PROFILE"
    ];

    for (const field of requiredFields) {
        if (!parsedFields[field]) {
            console.error(`Campo obrigatório ausente na resposta da IA para cenário procedural: ${field}. Resposta completa:`, text);
            throw new Error(`Formato de cenário procedural inválido: campo ${field} ausente.`);
        }
    }
    
    const title = `${parsedFields.LEAD_NAME} (${parsedFields.COURSE_OF_INTEREST})`;
    const contextParts = [
        `Nome: ${parsedFields.LEAD_NAME}, ${parsedFields.LEAD_AGE_APPROX} anos.`,
        `Situação: ${parsedFields.LEAD_CURRENT_SITUATION}.`,
        `Curso de Interesse: ${parsedFields.COURSE_OF_INTEREST}.`,
        `Principal Motivação: ${parsedFields.LEAD_PRIMARY_MOTIVATION}.`,
        `Principal Preocupação/Dúvida: ${parsedFields.LEAD_KEY_CONCERN_OR_DOUBT}.`,
        `Ponto de Dor Sutil/Desejo: ${parsedFields.LEAD_SUBTLE_PAIN_POINT}.`,
        `Como chegou até nós (pista): ${parsedFields.LEAD_SOURCE_HINT}.`
    ];
    const context = contextParts.join('\n');

    let behavioralProfile = parsedFields.BEHAVIORAL_PROFILE as SimulatorBehavioralProfile;
    const validProfilesList: SimulatorBehavioralProfile[] = ['Questionador Detalhista', 'Ocupado/Impaciente', 'Desconfiado/Silencioso', 'Confuso/Indeciso', 'Comparador', 'Padrão'];
    if (!validProfilesList.includes(behavioralProfile)) {
        console.warn(`Perfil comportamental inválido recebido da IA: "${behavioralProfile}". Usando "Padrão" como fallback.`);
        behavioralProfile = 'Padrão';
    }

    const scenarioId = `sim_procedural_${(parsedFields.LEAD_NAME || 'anon').toLowerCase().replace(/[^a-z0-9]+/gi, '_')}_${Date.now()}`;

    const scenario: Scenario = {
      id: scenarioId,
      title: title,
      context: context,
      initialMessage: parsedFields.INITIAL_MESSAGE_TO_CONSULTANT,
      behavioralProfile: behavioralProfile,
      // avatarUrl and isBoss are typically not set by this procedural generation
    };
    
    return scenario;

  } catch (error) {
    console.error('Erro ao gerar cenário procedural com Gemini:', error);
    throw error; 
  }
}


export async function transcribeAudioWithGemini(audioBase64: string, mimeType: string = 'audio/webm'): Promise<AudioTranscriptionResponse> {
    if (!API_KEY) return { error: API_KEY_ERROR_MESSAGE };

    try {
        const audioPart: Part = {
            inlineData: {
                mimeType: mimeType,
                data: audioBase64,
            },
        };
        const textPart: Part = {
            text: "Transcreva o seguinte áudio em português brasileiro. Responda APENAS com a transcrição do áudio. Se o áudio estiver ininteligível ou vazio, responda com '[Áudio não compreendido]'.",
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: { parts: [audioPart, textPart] },
            config: { thinkingConfig: { thinkingBudget: 0 } }
        });

        let transcribedText = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = transcribedText.match(fenceRegex);
        if (match && match[2]) {
          transcribedText = match[2].trim();
        }

        if (!transcribedText || transcribedText.toLowerCase() === '[áudio não compreendido]') {
            return { text: "" , error: "Não foi possível transcrever o áudio ou o áudio estava ininteligível." };
        }
        return { text: transcribedText };

    } catch (error) {
        console.error('Erro ao transcrever áudio com Gemini:', error);
        const errorMessage = (error as Error).message || "Um erro desconhecido ocorreu durante a transcrição.";
        if (errorMessage.includes('SERVICE_UNAVAILABLE') || errorMessage.includes('Deadline exceeded')) {
            return { error: "Serviço de transcrição indisponível ou demorou demais. Tente novamente." };
        }
        if (errorMessage.includes('SAFETY')) {
             return { error: "Conteúdo do áudio bloqueado por políticas de segurança." };
        }
        return { error: `Erro na transcrição: ${errorMessage}` };
    }
}

export async function evaluateObjectionResponse(objectionText: string, userResponseText: string, objectionContext?: string): Promise<string> {
  if (!API_KEY) throw new Error(API_KEY_ERROR_MESSAGE);

  let prompt = GEMINI_OBJECTION_EVALUATOR_PROMPT;
  prompt = prompt.replace("{OBJECTION_TEXT}", objectionText);
  prompt = prompt.replace("{OBJECTION_CONTEXT}", objectionContext || "Nenhum contexto adicional fornecido.");
  prompt = prompt.replace("{USER_RESPONSE}", userResponseText);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: [{role: 'user', parts: [{text: prompt}]}],
      config: {} // Default config, no thinking budget specified for this specific call
    });
    return response.text;
  } catch (error) {
    console.error('Erro ao avaliar resposta à objeção com Gemini:', error);
    if ((error as any)?.response?.promptFeedback?.blockReason) {
        return `A avaliação da sua resposta foi bloqueada pela IA. Motivo: ${(error as any).response.promptFeedback.blockReason}. Por favor, reformule sua resposta ou a objeção.`;
    }
    return `Desculpe, ocorreu um erro ao processar a avaliação: ${(error as Error).message}`;
  }
}


export async function generateImageFromPrompt(prompt: string): Promise<LocalGeneratedImage[] | null> {
    if (!API_KEY) throw new Error(API_KEY_ERROR_MESSAGE);
    try {
        const requestConfig = { numberOfImages: 1, outputMimeType: 'image/jpeg' };

        const sdkResponse = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: requestConfig,
        });
        const mappedImages: LocalGeneratedImage[] = sdkResponse.generatedImages.map(sdkImage => ({
            imageBytes: sdkImage.image.imageBytes,
            mimeType: requestConfig.outputMimeType,
        }));

        return mappedImages;

    } catch (error) {
        console.error('Erro ao gerar imagem com Gemini:', error);
        return null;
    }
}

export async function generateCollaboratorAnalysis(
  userData: string,
  managerPromptTemplate: string
): Promise<string> {
  if (!API_KEY) throw new Error(API_KEY_ERROR_MESSAGE);

  const finalPrompt = managerPromptTemplate.replace("{USER_DATA_PLACEHOLDER}", userData);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: [{ role: "user", parts: [{text: finalPrompt}] }],
      // Consider if specific config is needed, e.g., temperature for more/less creative analysis
      // config: { temperature: 0.5 } 
    });
    return response.text;
  } catch (error) {
    console.error('Erro ao gerar análise do colaborador com Gemini:', error);
    if ((error as any)?.response?.promptFeedback?.blockReason) {
        return `A análise foi bloqueada pela IA. Motivo: ${(error as any).response.promptFeedback.blockReason}.`;
    }
    throw new Error(`Falha ao gerar análise crítica da IA: ${(error as Error).message}`);
  }
}
