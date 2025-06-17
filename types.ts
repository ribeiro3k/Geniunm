

export interface FlashcardContent {
  id: string; // e.g., flashcard_theme_Técnica_de_Escassez
  front: string;
  back: string;
  theme: string;
  topicTags?: string[];
  skillTags?: string[];
}

export interface QuizQuestionOption {
  id: string; // Unique ID for each option, useful for multi-select state
  text: string;
  correct?: boolean;
}

export interface QuizQuestionType {
  id: number;
  text: string;
  options?: QuizQuestionOption[];
  type: 'multiple-choice' | 'ordering' | 'true-false' | 'fill-in-the-blank'; // Added new types
  allowMultipleAnswers?: boolean; // For "mark all that apply" style questions
  orderedItems?: { id: string; text: string; correctPosition: number }[];
  feedback: string; // General feedback for the question
  correctOrderFeedback?: string[]; // Specific for ordering questions
  placeholder?: string; // For fill-in-the-blank display
  topicTags?: string[]; // Para analytics
  skillTags?: string[]; // Para analytics
}

export interface UserAnswer {
  questionId: number;
  answer: string | string[]; // string for MC single/TF/Fill, string[] for MC multi/ordering
  isCorrect: boolean;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  senderDisplayName?: string;
  status?: 'pending_send' | 'sent' | 'delivered' | 'read' | 'error'; // For WhatsApp-like ticks
  avatarUrl?: string; // For boss avatar
  isAudioMessage?: boolean; // Indicates if the message content came from an audio recording
}

// Ensure GeminiMessage roles cover all uses, especially system for initial prompts
export interface GeminiMessage {
  role: 'user' | 'model' | 'system';
  parts: { text: string }[];
}


export type SimulatorBehavioralProfile = 
  | 'Questionador Detalhista' 
  | 'Ocupado/Impaciente' 
  | 'Desconfiado/Silencioso' 
  | 'Confuso/Indeciso' 
  | 'Comparador'
  | 'Padrão'
  | 'Flávio - O Chefão'; // Special profile for the boss

export type SimulationUserRole = 'userAsConsultant'; // Simplified: user is always the consultant

export interface Scenario {
  id: string; // ID único para o cenário, e.g. "sim_mariana_admin_ead"
  title: string; // Used as part of persona name/context
  context: string; // Main background for the persona
  initialMessage: string; // AI's first message in the scenario
  behavioralProfile?: SimulatorBehavioralProfile;
  avatarUrl?: string; // For boss character
  isBoss?: boolean;   // Flag for boss character
  topicTags?: string[]; // Para analytics
  skillTags?: string[]; // Para analytics
}

export interface ProceduralScenarioOutput {
  title: string;
  context: string;
  initialMessage: string;
  behavioralProfile: SimulatorBehavioralProfile;
}

export enum NavigationSection {
  Home = 'home',
  Flashcards = 'flashcards',
  Quiz = 'quiz',
  Simulador = 'simulador', // Reverted to single simulator section
  ObjectionTrainer = 'objection-trainer',
  AdminPanel = 'admin-panel', 
  UserManagement = 'user-management',
  Reports = 'reports', 
  PersonaCustomization = 'persona-customization', 
}

export interface NavItem {
  href: string;
  label: string;
  section: NavigationSection;
  isLoading?: boolean; 
  adminOnly?: boolean; 
  // Submenu properties removed as they are no longer used for Simulator
  icon?: string; 
}

export interface GeneratedImage {
    imageBytes: string; // Base64 encoded image
    image?: { imageBytes: string }; // For compatibility, some might nest it
    mimeType?: string;
}

export interface AudioTranscriptionResponse {
    text?: string;
    error?: string;
}

export interface Objection {
  id: string;
  text: string;
  context?: string; // Optional additional context for the AI or to display to the user
}

// Authentication Types
export interface AdminUser {
  type: 'admin';
  username: 'admin';
  id: 'admin'; // Consistent ID field
}

export interface GoogleUser {
  type: 'google';
  id: string; // email as id
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface SimpleUser {
  type: 'simple';
  id: string; // username as id
  username: string;
}

export type AuthenticatedUser = AdminUser | GoogleUser | SimpleUser | null;

// Admin Panel Data Types
export interface UserActivityData {
  id: string; // Typically username or email
  displayName: string;
  lastLogin?: string; // ISO Date string
  simulationsCompleted: number; // In selected period
  quizAttempts: number; // In selected period
  averageQuizScore: number | null; // In selected period
  simulationSuccessRate: number | null; // In selected period
  totalActivities: number; // In selected period
}

export interface QuizAttemptRecord {
  id: string; // Unique ID for this attempt (crypto.randomUUID())
  userId: string; // from AuthenticatedUser.id
  username: string; // from AuthenticatedUser display name
  quizContentId: string; // ID do conteúdo do quiz, e.g., "main_quiz_v1"
  quizTitle: string; // e.g., "Quiz Principal" or derived
  timestamp: string; // ISO Date string
  score: number;
  totalQuestions: number;
  answers: UserAnswer[];
  questionsUsed: QuizQuestionType[]; // Store the actual questions for review context
}

export interface ParsedErrorOrSuccessItem {
  title: string;
  description: string;
}

export interface ParsedEvaluation {
    outcomeType: 'VENDA_NAO_REALIZADA' | 'VENDA_REALIZADA' | 'INDETERMINADO';
    headerMessage: string; // The main "❌ SIMULAÇÃO ENCERRADA..." or "🎉 PARABÉNS!..."
    isBossScenarioSuccess?: boolean;
    quickSummary: string | null;

    // For VENDA_NAO_REALIZADA
    mainErrors?: ParsedErrorOrSuccessItem[];
    positivePointFailure?: { description: string; tip?: string } | null;
    
    // For VENDA_REALIZADA
    mainSuccessPoints?: ParsedErrorOrSuccessItem[];
    attentionPointSuccess?: { description: string; tip?: string } | null;

    generalNotes: {
        acolhimento: number | null;
        clareza: number | null;
        argumentacao: number | null;
        fechamento: number | null;
    };
    clientInfo: {
        nome: string | null;
        curso: string | null;
        vida: string | null;
        busca: string | null;
        medo: string | null;
        perfilComportamental: string | null; // This will be {BEHAVIORAL_PROFILE}
    };
    conversationAnalysis: {
        conhecimentoCursos: string | null;
        escutaAtiva: string | null;
        contornoDuvidasOuObjecoes: string | null; // Title may vary in prompt
        apresentacaoDiferenciais: string | null;
        fechamento: string | null;
    } | null;
    improvementStepsOrTips: string[] | null; // Section 6: How to improve or Tips for success
    finalSummary: string | null; // Section 7
    finalDevelopmentNote?: string | null; // "Você precisa..." part from section 7
}


export interface SimulationRecord {
  id: string; // Unique ID for this simulation instance (crypto.randomUUID())
  userId: string; // from AuthenticatedUser.id
  username: string; // from AuthenticatedUser display name
  scenarioContentId: string; // ID do conteúdo do cenário, e.g., "sim_mariana_admin_ead"
  scenarioTitle: string;
  timestamp: string; // ISO Date string
  messages: Message[];
  evaluation: ParsedEvaluation | null; // The fully parsed evaluation object
}

// New type for Admin Dashboard Performance Snapshot (Overall Stats)
export interface OverallPerformanceStats {
  totalUsers: number; // All time
  activeUsersPeriod: number; // In selected period
  totalSimulationsPeriod: number;
  totalQuizAttemptsPeriod: number;
  averageQuizScorePeriod: number | null;
  simulationSuccessRatePeriod: number | null;
  totalActivitiesPeriod: number;
  quizScoreDistributionPeriod: Array<{ range: string; count: number; percentage: number }>;
  simulationOutcomeDistributionPeriod: Array<{ outcome: string; count: number; percentage: number }>;
}

// For Collaborator Dashboard
export interface PerformanceSnapshotData {
  averageQuizScore: number | null; // User's all-time average
  quizAttemptsCount: number; // User's all-time count
  simulationsCompletedCount: number; // User's all-time count
  averageStarRatings: { // User's all-time average
    acolhimento: number;
    clareza: number;
    argumentacao: number;
    fechamento: number;
  };
  recentPositiveFeedback: string[]; // From recent simulations
  recentCriticalFeedback: string[]; // From recent simulations
}

// For User Management Panel
export interface SimpleUserCredentials {
  username: string;
  passwordPlainText: string; // In a real app, this would be a hash
}

// Conceptual types for Learning Analytics (not fully implemented in this step)
export interface ContentItemSummary {
  contentId: string; // e.g., quiz_1, flashcard_theme_Tecnica_Escassez, sim_scenario_Mariana_Admin_EAD
  contentType: 'quiz' | 'quiz_question' | 'flashcard_theme' | 'simulation_scenario' | 'objection';
  title: string;
  topicTags?: string[];
  skillTags?: string[];
}

export interface UserInteractionLog {
  logId: string; // UUID
  userId: string;
  contentId: string; // References ContentItemSummary.contentId
  timestamp: string; // ISO
  interactionType: 'view' | 'start' | 'complete' | 'submit_answer' | 'flashcard_flip';
  durationSeconds?: number; // Optional, for views/engagements
  details?: any; // e.g., For quiz answers, could store UserAnswer structure
}

// Types for Reporting Section
export type ReportPeriod = 'allTime' | 'last7days' | 'last30days';
export type ReportContentType = 'quizzes' | 'simulations'; // Removed 'all' as it's implicit if both are selected or managed by logic

export interface ReportFilterConfig {
  collaboratorId: string; // 'all' or specific user ID
  period: ReportPeriod;
  contentTypes: ReportContentType[]; // Array of selected content types
}

export interface ReportKPIs {
  // General
  totalActivities?: boolean;
  // Quizzes
  quizAttempts?: boolean;
  quizAverageScore?: boolean;
  quizHighestScore?: boolean;
  quizLowestScore?: boolean;
  quizTopicAnalysis?: boolean; // Novo KPI qualitativo
  // Simulations
  simulationAttempts?: boolean;
  simulationSuccessRate?: boolean;
  simulationSkillSummary?: boolean; // Novo KPI para resumo de habilidades em simulação
  simulationAverageStars?: { // Sub-KPIs para as estrelas, controlados pelo summary ou individualmente
    enabled?: boolean; // Master toggle for all stars, can be true if simulationSkillSummary is true
    acolhimento?: boolean;
    clareza?: boolean;
    argumentacao?: boolean;
    fechamento?: boolean;
  };
}

export interface ProcessedReportDataRow {
  userId: string;
  userName: string;
  // General
  totalActivities: number;
  // Quizzes
  quizAttempts: number;
  quizAverageScore: number | null; // Percentage
  quizHighestScore: number | null; // Percentage
  quizLowestScore: number | null;  // Percentage
  strongQuizTopics: string[]; // Novo: e.g., ["Abordagem (90% acertos)"]
  challengingQuizTopics: string[]; // Novo: e.g., ["Preço (40% acertos)"]
  // Simulations
  simulationAttempts: number;
  simulationSuccessRate: number | null; // Percentage
  simulationAverageAcolhimento: number | null;
  simulationAverageClareza: number | null;
  simulationAverageArgumentacao: number | null;
  simulationAverageFechamento: number | null;
}

export interface GeneratedReport {
  config: ReportFilterConfig;
  kpis: ReportKPIs;
  data: ProcessedReportDataRow[];
  generatedAt: string; // ISO Date string
  summaryInsights?: string; // Simple text insights
}