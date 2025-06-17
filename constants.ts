

import { QuizQuestionType, Scenario, NavItem, NavigationSection, Objection, SimulatorBehavioralProfile, ReportFilterConfig, ReportKPIs } from './types';

export const API_KEY_ERROR_MESSAGE = "API Key não configurada. Por favor, configure a variável de ambiente API_KEY.";
export const CUSTOM_SIMULATOR_PROMPT_KEY = 'geniunmCustomSimulatorPrompt';

export const NAV_ITEMS: NavItem[] = [
  { href: "#/home", label: "Início", section: NavigationSection.Home, icon: "fa-home" },
  { href: "#/flashcards", label: "Flashcards", section: NavigationSection.Flashcards, icon: "fa-layer-group" },
  { href: "#/quiz", label: "Quiz", section: NavigationSection.Quiz, icon: "fa-question-circle" },
  { 
    href: `#/simulador`, 
    label: "Simulador", 
    section: NavigationSection.Simulador, 
    icon: "fa-comments",
  },
  { href: "#/objection-trainer", label: "Treinar Objeções", section: NavigationSection.ObjectionTrainer, icon: "fa-microphone-alt" },
  { href: "#/admin-panel", label: "Painel Admin", section: NavigationSection.AdminPanel, adminOnly: true, icon: "fa-tachometer-alt" },
  { href: "#/user-management", label: "Gerenciar Usuários", section: NavigationSection.UserManagement, adminOnly: true, icon: "fa-users-cog" },
  { href: "#/reports", label: "Relatórios", section: NavigationSection.Reports, adminOnly: true, icon: "fa-chart-pie" },
  { href: "#/persona-customization", label: "Customizar IA", section: NavigationSection.PersonaCustomization, adminOnly: true, icon: "fa-brain" },
];

export const FLASHCARD_THEMES: string[] = [
  "Técnica de Escassez", "Gatilho da Urgência", "Comunicação Assertiva no WhatsApp",
  "Contornando Objeção de Preço", "Fechamento por Alternativas", "Benefício: Flexibilidade EAD",
  "Argumento: Reconhecimento MEC", "Dica: Áudio Curto e Objetivo", "Técnica da Prova Social",
  "Gatilho da Autoridade", "Linguagem para Graduação vs Pós", "Contornando Objeção 'Não tenho tempo'",
  "Fechamento Direto", "Benefício: Networking Online", "Argumento: Custo-Benefício EAD",
  "Dica: Follow-up Estratégico", "Técnica da Reciprocidade", "Gatilho da Novidade",
  "Evitando 'Textão' no WhatsApp", "Contornando Objeção 'EAD é fácil demais'",
  "Fechamento por Resumo de Benefícios", "Benefício: Atualização Rápida", "Argumento: Suporte ao Aluno"
];

export const FLASHCARD_LOADING_MESSAGES: string[] = [
    "Consultando os astros...", "Buscando a sabedoria...", "Preparando a mágica...",
    "Quase lá...", "Essa é boa...", "Pensando com carinho...",
    "Criando algo especial...", "A IA está a todo vapor!", "Só um momentinho...",
    "Desvendando segredos..."
];

export const AI_ANALYSIS_LOADING_MESSAGES: string[] = [
    "Analisando dados do usuário...", 
    "Verificando interações e desempenho...", 
    "A IA está processando os insights...", 
    "Compilando relatório avançado...",
    "Quase pronto para revelar a análise..."
];


export const QUIZ_QUESTIONS: QuizQuestionType[] = [
  {
    id: 1,
    text: "Verdadeiro ou Falso: É recomendável começar a conversa com o candidato já enviando o valor da mensalidade.",
    type: 'true-false',
    options: [
      { id: 'q1_true', text: "Verdadeiro" },
      { id: 'q1_false', text: "Falso", correct: true },
    ],
    feedback: "Falso. A conversa deve começar com conexão e descoberta da necessidade. Nunca comece com o preço!",
    topicTags: ["abordagem_inicial", "precificacao"], 
    skillTags: ["comunicacao_estrategica", "construcao_valor"]
  },
  {
    id: 2,
    text: "Marque com um X o que NÃO se deve fazer no WhatsApp (selecione as opções que representam ações incorretas):",
    type: 'multiple-choice',
    allowMultipleAnswers: true,
    options: [
      { id: 'q2_opt1', text: "Enviar áudios curtos de até 45 segundos" },
      { id: 'q2_opt2', text: "Escrever textos longos e sem estratégia", correct: true },
      { id: 'q2_opt3', text: "Finalizar com uma pergunta objetiva" },
      { id: 'q2_opt4', text: "Mandar só “Oi, tudo bem?” como follow-up", correct: true },
    ],
    feedback: "Não se deve escrever textos longos e sem estratégia, nem mandar follow-ups genéricos como 'Oi, tudo bem?'. Áudios curtos e perguntas objetivas são boas práticas.",
    topicTags: ["boas_praticas_whatsapp", "comunicacao_escrita", "follow_up"], 
    skillTags: ["comunicacao_eficaz_whatsapp", "etiqueta_digital"]
  },
  {
    id: 3,
    text: "Complete a frase com a opção correta: O consultor da Cruzeiro do Sul Virtual não é um simples vendedor. Ele é um...",
    type: 'multiple-choice',
    options: [
      { id: 'q3_opt1', text: "Vendedor de matrícula" },
      { id: 'q3_opt2', text: "Telemarketing educacional" },
      { id: 'q3_opt3', text: "Consultor de Carreiras", correct: true },
    ],
    feedback: "Correto! Ele é um Consultor de Carreiras, focado em ajudar o aluno a tomar a melhor decisão para seu futuro.",
    topicTags: ["papel_consultor", "venda_consultiva"],
    skillTags: ["mindset_consultor", "foco_cliente"]
  },
  {
    id: 4,
    text: "Coloque as etapas da venda em ordem correta:",
    type: 'ordering',
    orderedItems: [
      { id: 'q4_itemA', text: "Apresentação do Produto", correctPosition: 3 },
      { id: 'q4_itemB', text: "Fechamento da Matrícula", correctPosition: 5 },
      { id: 'q4_itemC', text: "Descoberta da Necessidade", correctPosition: 2 },
      { id: 'q4_itemD', text: "Acompanhamento (Follow-up)", correctPosition: 6 },
      { id: 'q4_itemE', text: "Apresentação e Conexão", correctPosition: 1 },
      { id: 'q4_itemF', text: "Negociação e Contorno de Objeções", correctPosition: 4 },
    ],
    feedback: "A ordem correta é crucial para um fluxo de vendas eficaz e consultivo.",
    correctOrderFeedback: [
        "1. Apresentação e Conexão (E)",
        "2. Descoberta da Necessidade (C)",
        "3. Apresentação do Produto (A)",
        "4. Negociação e Contorno de Objeções (F)",
        "5. Fechamento da Matrícula (B)",
        "6. Acompanhamento (Follow-up) (D)"
    ],
    topicTags: ["processo_vendas", "etapas_funil"],
    skillTags: ["gestao_processo_vendas"]
  },
  {
    id: 5,
    text: "Verdadeiro ou Falso: O segredo do sucesso está apenas em mandar muitas mensagens.",
    type: 'true-false',
    options: [
      { id: 'q5_true', text: "Verdadeiro" },
      { id: 'q5_false', text: "Falso", correct: true },
    ],
    feedback: "Falso. Qualidade > Quantidade. Estratégia, organização, escuta ativa e personalização são fundamentais!"
  },
  {
    id: 6,
    text: "Qual é a técnica usada para criar urgência realista, mesmo quando a vaga (ou condição especial) está garantida por um tempo limitado?",
    type: 'multiple-choice',
    options: [
      { id: 'q6_opt1', text: "Gatilho de Autoridade" },
      { id: 'q6_opt2', text: "Gatilho de Urgência", correct: true },
      { id: 'q6_opt3', text: "Gatilho de Escassez" },
    ],
    feedback: "Gatilho de Urgência. Ele se refere ao tempo limitado para tomar uma decisão ou aproveitar uma condição."
  },
  {
    id: 7,
    text: "Marque com X os pilares do Matriculador de Alta Performance (selecione as opções corretas):",
    type: 'multiple-choice',
    allowMultipleAnswers: true,
    options: [
      { id: 'q7_opt1', text: "Obediência às metas" },
      { id: 'q7_opt2', text: "Comunicação Eficaz", correct: true },
      { id: 'q7_opt3', text: "Conexão e Relacionamento", correct: true },
      { id: 'q7_opt4', text: "Conhecimento do Produto", correct: true },
      { id: 'q7_opt5', text: "Disparo automático de mensagens" },
    ],
    feedback: "Os pilares são: Comunicação Eficaz, Conexão e Relacionamento, e Conhecimento do Produto. Metas são importantes, mas a forma de alcançá-las se baseia nesses pilares."
  },
  {
    id: 8,
    text: "Preencha a lacuna: “O curso não é um ____, é um investimento no seu futuro.”",
    type: 'multiple-choice', // fill-in-the-blank presented as MC
    options: [
      { id: 'q8_opt1', text: "Compromisso" },
      { id: 'q8_opt2', text: "Gasto", correct: true },
      { id: 'q8_opt3', text: "Peso" },
    ],
    feedback: "Correto! O curso não é um GASTO, é um investimento no seu futuro."
  },
  {
    id: 9,
    text: "O que fazer quando o candidato diz “Vou pensar”?",
    type: 'multiple-choice',
    options: [
      { id: 'q9_opt1', text: "Agradecer e aguardar" },
      { id: 'q9_opt2', text: "Criar urgência sutil, validar o interesse, agendar próximo contato e oferecer suporte para tirar dúvidas remanescentes", correct: true },
      { id: 'q9_opt3', text: "Encerrar o atendimento e partir para o próximo" },
    ],
    feedback: "A melhor abordagem é validar o interesse, entender se há dúvidas ocultas, criar uma urgência sutil (ex: 'As condições especiais vão até X'), e agendar um próximo contato, oferecendo-se para ajudar."
  },
  {
    id: 10,
    text: "Qual dessas é a dica correta para follow-up?",
    type: 'multiple-choice',
    options: [
      { id: 'q10_opt1', text: "Esperar o candidato responder por conta própria" },
      { id: 'q10_opt2', text: "Personalizar a mensagem, agregar valor e reforçar a oferta com empatia", correct: true },
      { id: 'q10_opt3', text: "Mandar várias mensagens genéricas por dia até responderem" },
    ],
    feedback: "O follow-up eficaz é personalizado, agrega valor (ex: envia um material relevante, lembra de um benefício), e é feito com empatia, sem ser insistente demais."
  }
];


export const SIMULATOR_SCENARIOS: Scenario[] = [
  {
    id: 'sim_mariana_admin_ead',
    title: 'Aluno interessado em Administração EAD (Mariana)',
    context: 'Mariana (25 anos, Assistente Administrativa) busca Administração EAD para crescer na empresa. Teme o valor da mensalidade e se a qualidade do EAD é suficiente para seu desenvolvimento.',
    initialMessage: 'Olá! Estou interessada no curso de Administração EAD da Cruzeiro do Sul Virtual. Pode me informar qual é o valor da mensalidade?',
    behavioralProfile: 'Questionador Detalhista',
    topicTags: ["objecao_preco", "qualidade_ead", "curso_administracao"],
    skillTags: ["negociacao", "esclarecimento_duvidas", "argumentacao_valor"]
  },
  {
    id: 'sim_carlos_diploma',
    title: 'Aluno com dúvidas sobre reconhecimento do diploma (Carlos)',
    context: 'Carlos (30 anos, técnico em TI) quer fazer Análise de Sistemas EAD, mas dúvida se o diploma EAD da Cruzeiro do Sul tem o mesmo peso no mercado que um presencial.',
    initialMessage: 'Oi, gostaria de saber se o diploma do curso EAD da Cruzeiro do Sul tem o mesmo valor de um curso presencial no mercado de trabalho?',
    behavioralProfile: 'Desconfiado/Silencioso',
    topicTags: ["validade_diploma_ead", "reconhecimento_mec", "curso_analise_sistemas"],
    skillTags: ["argumentacao_valor", "superacao_desconfianca", "esclarecimento_duvidas"]
  },
  {
    id: 'sim_sofia_metodologia_ead',
    title: 'Aluna preocupada com metodologia EAD (Sofia)',
    context: 'Sofia (22 anos, recém-formada no Ensino Médio) considera Pedagogia EAD. Nunca fez curso online e se preocupa se conseguirá acompanhar e ter suporte na Cruzeiro do Sul Virtual.',
    initialMessage: 'Olá, nunca fiz um curso online antes. Como funciona na Cruzeiro do Sul Virtual? Vou conseguir tirar dúvidas com os professores de Pedagogia?',
    behavioralProfile: 'Confuso/Indeciso',
    topicTags: ["metodologia_ead", "suporte_aluno", "curso_pedagogia"],
    skillTags: ["empatia", "orientacao_processo", "esclarecimento_duvidas"]
  },
  {
    id: 'sim_rafael_curso_nao_ofertado',
    title: 'Aluno buscando curso não ofertado - Medicina (Rafael)',
    context: 'Rafael (19 anos) viu um anúncio da Cruzeiro do Sul Virtual e busca informações sobre Medicina EAD, que a instituição não oferta.',
    initialMessage: 'Oi, tudo bem? Vi um anúncio de vocês e queria saber mais sobre o curso de Medicina EAD.',
    behavioralProfile: 'Padrão',
    topicTags: ["curso_inexistente", "gerenciamento_expectativas"],
    skillTags: ["comunicacao_assertiva", "conhecimento_produto"]
  },
  {
    id: 'sim_fernanda_pouco_tempo',
    title: 'Aluna com pouco tempo e filhos (Fernanda)',
    context: 'Fernanda (35 anos, mãe de dois, trabalha em tempo integral) considera Pós em Gestão de Pessoas EAD na Cruzeiro do Sul, mas teme não dar conta da rotina.',
    initialMessage: 'Boa tarde. Eu queria muito fazer uma pós em Gestão de Pessoas, mas tenho dois filhos pequenos e trabalho o dia todo. Será que EAD na Cruzeiro do Sul é pra mim?',
    behavioralProfile: 'Ocupado/Impaciente',
    topicTags: ["objecao_tempo", "flexibilidade_ead", "curso_gestao_pessoas_pos"],
    skillTags: ["empatia", "solucao_problemas", "argumentacao_beneficios_ead"]
  },
  {
    id: 'sim_lucas_vou_pensar',
    title: 'Aluno "Vou pensar" (Lucas)',
    context: 'Lucas (28 anos) conversou sobre Marketing Digital EAD na Cruzeiro do Sul. Gostou, mas ao final diz: "Preciso pensar um pouco".',
    initialMessage: 'Entendi sobre o curso de Marketing Digital da Cruzeiro do Sul. Parece interessante... Mas preciso pensar um pouco, sabe? Te chamo depois.',
    behavioralProfile: 'Padrão',
    topicTags: ["objecao_vou_pensar", "follow_up", "curso_marketing_digital"],
    skillTags: ["tecnicas_fechamento_sutil", "sondagem_avancada"]
  },
  {
    id: 'sim_ana_comparador',
    title: 'Aluno comparando com outra instituição (Ana)',
    context: 'Ana (26 anos) está interessada em Engenharia de Software EAD da Cruzeiro do Sul, mas viu um curso parecido mais barato na "Universidade Aprender Mais".',
    initialMessage: 'Oi! Esse curso de Engenharia de Software EAD da Cruzeiro do Sul parece bom, mas vi um na Universidade Aprender Mais por um preço menor. Qual a diferença de vocês?',
    behavioralProfile: 'Comparador',
    topicTags: ["comparacao_concorrencia", "diferenciais_csv", "curso_engenharia_software"],
    skillTags: ["argumentacao_valor", "negociacao", "conhecimento_concorrencia_ficticia"]
  },
  {
    id: "sim_bruno_jovem_indeciso_ads",
    title: "Lead do Facebook - Jovem indeciso sobre Análise de Sistemas (Bruno)",
    context: "Bruno (19 anos), lead do Facebook, recém-saído do EM, pais pressionando para faculdade. Confuso sobre ADS EAD na Cruzeiro do Sul e se dá emprego.",
    initialMessage: "Oii, vi um anúncio no Face sobre o curso de Análise de Sistemas da Cruzeiro do Sul... é bom mesmo? Tipo, dá pra arrumar emprego com isso? EAD é puxado?",
    behavioralProfile: 'Confuso/Indeciso',
    topicTags: ["lead_facebook", "jovem_indeciso", "curso_analise_sistemas", "mercado_trabalho_ti"],
    skillTags: ["orientacao_vocacional_leve", "esclarecimento_duvidas", "construcao_confianca"]
  },
  {
    id: "sim_claudia_google_gestao_rh",
    title: "Lead do Google - Profissional buscando Gestão de RH para transição (Cláudia)",
    context: "Cláudia (32 anos), da área adm, pesquisou 'melhor pós em Gestão de RH EAD' e clicou no anúncio da Cruzeiro do Sul. Busca qualidade, reconhecimento e preparo para o mercado.",
    initialMessage: "Olá. Encontrei o site de vocês pelo Google pesquisando sobre pós em Gestão de RH. Queria saber mais sobre a qualidade do curso da Cruzeiro do Sul, o reconhecimento e se realmente prepara para o mercado.",
    behavioralProfile: 'Questionador Detalhista',
    topicTags: ["lead_google", "transicao_carreira", "curso_gestao_rh_pos", "qualidade_ead"],
    skillTags: ["consultoria_carreira", "argumentacao_qualidade", "esclarecimento_duvidas_especificas"]
  },
  {
    id: "sim_tiago_indicacao_marketing_digital_receio",
    title: "Lead por Indicação - Marketing Digital com receio (Tiago)",
    context: "Tiago (27 anos), indicado por amigo ex-aluno satisfeito com Marketing Digital EAD da Cruzeiro do Sul. Confia na indicação, mas acha EAD 'fácil demais' e teme pela disciplina.",
    initialMessage: "Oi, meu amigo João Silva fez Marketing Digital com vocês e gostou muito. Ele me passou seu contato. Eu até me interesso, mas fico meio assim com EAD da Cruzeiro do Sul, sabe? Parece que não aprende de verdade.",
    behavioralProfile: 'Desconfiado/Silencioso',
    topicTags: ["lead_indicacao", "receio_ead_facil", "curso_marketing_digital", "autodisciplina"],
    skillTags: ["reforco_prova_social", "desmistificacao_ead", "motivacao"]
  },
  {
    id: "sim_patricia_objecao_tempo_engenharia",
    title: "Objeção Direta: 'Não tenho tempo' (Patrícia)",
    context: "Patrícia (40 anos) demonstrou interesse em Engenharia de Produção EAD na Cruzeiro do Sul, mas agora apresenta a objeção de tempo devido a trabalho e família.",
    initialMessage: "Olha, eu até queria fazer Engenharia de Produção com vocês da Cruzeiro do Sul, mas sinceramente, não tenho tempo. Trabalho o dia todo e ainda tenho família.",
    behavioralProfile: 'Ocupado/Impaciente',
    topicTags: ["objecao_tempo", "curso_engenharia_producao", "conciliacao_estudos_rotina"],
    skillTags: ["contorno_objecao_tempo", "empatia", "argumentacao_flexibilidade_ead"]
  },
   {
    id: 'sim_roberto_comparacao_preco_engenharia_civil',
    title: 'Comparação de Preço - Engenharia Civil (Roberto)',
    context: 'Roberto (30 anos) interessado em Engenharia Civil EAD na Cruzeiro do Sul, mas menciona que a "Universidade Aprender Mais" tem preço inferior.',
    initialMessage: 'Boa tarde, me interessei por Engenharia Civil EAD. Vi que na Universidade Aprender Mais o preço parece menor. O que a Cruzeiro do Sul oferece de diferente para justificar?',
    behavioralProfile: 'Comparador',
    topicTags: ["comparacao_concorrencia", "objecao_preco", "curso_engenharia_civil", "diferenciais_csv"],
    skillTags: ["negociacao_valor", "argumentacao_diferenciais", "conhecimento_concorrencia_ficticia"]
  },
  {
    id: 'sim_laura_duvida_ead_pedagogia',
    title: 'Dúvida sobre EAD - Pedagogia (Laura)',
    context: 'Laura (24 anos) quer Pedagogia EAD na Cruzeiro do Sul, mas receia se o curso é "muito fácil" e se o diploma tem o mesmo peso de um presencial do "Instituto Foco Total".',
    initialMessage: 'Oi, queria informações sobre Pedagogia EAD na Cruzeiro do Sul. Tenho um pouco de receio se EAD é levado a sério, sabe? E o diploma tem o mesmo peso de um presencial do Instituto Foco Total?',
    behavioralProfile: 'Questionador Detalhista',
    topicTags: ["receio_ead_facil", "validade_diploma_ead", "curso_pedagogia", "comparacao_instituicao_ficticia"],
    skillTags: ["desmistificacao_ead", "argumentacao_qualidade", "esclarecimento_duvidas_especificas"]
  }
];

export const FLAVIO_BOSS_SCENARIO: Scenario = {
  id: 'sim_flavio_boss',
  title: 'Flávio - The Boss (DONO DA EMPRESA)',
  context: 'Flávio é o fundador e proprietário da instituição (Geniunm/Cruzeiro do Sul Virtual, dependendo de como o consultor se apresentar). Ele está testando secretamente a qualidade do atendimento. Extremamente ocupado, cético, direto e muito difícil de convencer. Ele valoriza respostas rápidas, precisas e que demonstrem profundo conhecimento e confiança. Qualquer hesitação ou erro será notado. Ele age como um chefe avaliando um funcionário.',
  initialMessage: 'Seja rápido. O que você quer?',
  behavioralProfile: 'Flávio - O Chefão',
  avatarUrl: '/flavio-boss.jpg',
  isBoss: true,
  topicTags: ["atendimento_dificil", "teste_qualidade", "geral_vendas", "pressao"],
  skillTags: ["resiliencia", "confianca", "comunicacao_assertiva", "conhecimento_produto_profundo", "gestao_stress"]
};

export const VALID_BEHAVIORAL_PROFILES: SimulatorBehavioralProfile[] = [
  'Questionador Detalhista', 'Ocupado/Impaciente', 'Desconfiado/Silencioso',
  'Confuso/Indeciso', 'Comparador', 'Padrão', 'Flávio - O Chefão',
];

export const OBJECTIONS_LIST: Objection[] = [
  { id: 'preco', text: "Achei o valor da mensalidade um pouco alto.", context: "O lead já recebeu informações sobre o curso e agora questiona o preço." },
  { id: 'tempo', text: "Não tenho tempo para estudar.", context: "O lead demonstra interesse, mas alega falta de tempo devido a trabalho/família." },
  { id: 'ead', text: "Tenho receio da qualidade do EAD, não sei se aprenderei de verdade.", context: "O lead dúvida da eficácia da metodologia EAD." },
  { id: 'reconhecimento', text: "O diploma EAD tem o mesmo valor de um presencial no mercado?", context: "O lead está preocupado com a validade e aceitação do diploma EAD." },
  { id: 'suporte', text: "Como funciona o suporte ao aluno? Terei ajuda quando precisar?", context: "O lead quer saber mais sobre o apoio e tutoria disponíveis." },
  { id: 'vou_pensar', text: "Entendi, mas preciso pensar um pouco.", context: "O lead está postergando a decisão após receber as informações." },
  { id: 'comparacao', text: "Vi um curso parecido mais barato em outra faculdade.", context: "O lead está comparando preços com a concorrência." },
  { id: 'tecnologia', text: "Não tenho muita familiaridade com tecnologia, será que consigo acompanhar?", context: "O lead tem receio de dificuldades técnicas com a plataforma EAD." },
  { id: 'motivacao', text: "Será que vou ter disciplina para estudar sozinho(a)?", context: "O lead dúvida da própria capacidade de se manter motivado em um curso EAD." },
  { id: 'ja_tenho_formacao', text: "Já tenho uma graduação, não sei se outra vai agregar.", context: "O lead já possui um diploma e questiona o valor de uma nova formação ou pós." }
];

// Template do PROMPT MESTRE para o Gemini - Atualizado
export const GEMINI_SIMULATOR_PROMPT_TEMPLATE: string = `
**Você é um Agente de Simulação Avançado e de Alto Nível.** Sua tarefa é atuar como um potencial cliente interessado em um curso EAD da **Cruzeiro do Sul Virtual**, interagindo com um vendedor (o usuário desta plataforma Geniunm). Sua performance será baseada em uma persona específica e em um conjunto de regras e comportamentos detalhados abaixo, refletindo um conhecimento profundo do que um consultor da Cruzeiro do Sul Virtual deveria saber.

**======================================================================**
**I. CONTEXTO E ENTRADAS PARA ESTA SIMULAÇÃO:**
**======================================================================**

1.  **PERFIL DA PERSONA DO CLIENTE (Contexto Principal):**
    *   **Cenário:** {SCENARIO_TITLE}
    *   **Histórico/Detalhes:** {SCENARIO_CONTEXT}
    *   **Seu Ponto de Partida/Preocupação Principal (contexto interno para você, NÃO é uma fala sua já dita):** {SCENARIO_INITIAL_MESSAGE_CONTEXT}
    *   **Seu Perfil Comportamental Designado para esta Simulação:** {BEHAVIORAL_PROFILE} (Consulte a Seção III.B para detalhes sobre como atuar com este perfil).
    *   **Instrução Adicional:** Aja como uma pessoa real com base no título, histórico, sua preocupação principal e perfil comportamental fornecidos. Suas preocupações, nível de conhecimento sobre EAD, e motivações devem ser inferidos realisticamente a partir desses dados. **Pense como um cliente real da Cruzeiro do Sul Virtual**.

2.  **MANUAL DE VENDAS DA FACULDADE / REGRAS CRÍTICAS (Conhecimento Interno Esperado):**
    *   **Política de Preços (Cruzeiro do Sul Virtual):** Os valores dos cursos EAD possuem reajuste anual. É um erro crítico afirmar que o valor é 100% fixo durante todo o curso.
    *   **Certificação (Cruzeiro do Sul Virtual):** O certificado EAD é reconhecido pelo MEC e tem a mesma validade de um curso presencial da instituição. É um erro crítico afirmar o contrário.
    *   **Metodologia EAD (Cruzeiro do Sul Virtual):** Você tem conhecimento implícito sobre a plataforma (ex: Blackboard), flexibilidade, materiais didáticos (PDFs interativos, videoaulas), suporte de tutores e provas online. O consultor deve ser capaz de explicar isso de forma clara e precisa. Esteja atento a detalhes sobre como os tutores respondem, frequência de aulas ao vivo (se houver para o curso em questão), e como as avaliações são conduzidas.
    *   **Diferenciais Cruzeiro do Sul Virtual:** Esteja atento se o consultor menciona diferenciais como a tradição da instituição (mais de 50 anos), o mesmo diploma do presencial, qualidade dos professores (mestres e doutores), polos de apoio (mesmo para cursos 100% EAD, para suporte e algumas atividades), e a vasta gama de cursos. Se o consultor não apresentar diferenciais, ou apresentá-los de forma vaga, isso é uma falha.
    *   **Abordagem Consultiva:** Um bom consultor da Cruzeiro do Sul Virtual deve focar em entender suas necessidades (como cliente) ANTES de empurrar o produto. Ele deve agir como um consultor de carreiras. Avalie se o vendedor faz perguntas investigativas (sondagem), ouve ativamente e conecta os benefícios do curso às suas necessidades específicas. Se o vendedor apenas descrever o curso sem conectar com você, isso é uma falha.
    *   **Cursos Ofertados:** Você "sabe" que a Cruzeiro do Sul Virtual NÃO oferece cursos como Medicina, Odontologia, Medicina Veterinária. Se o consultor tentar vender um desses ou não souber informar corretamente, isso é uma falha (não necessarily crítica, mas um ponto para o feedback).
    *   **Pós-Graduação:** Para cursos de pós, o pré-requisito é ter diploma de graduação.
    *   **Scripts de Vendas (Cruzeiro do Sul Virtual):** Você tem uma noção dos princípios dos scripts de vendas da Cruzeiro do Sul (abordagem cordial, entender o momento do lead, explicar as modalidades, não usar gírias excessivas ou linguagem informal demais como "gatinha", "meu bem", "anjo", etc.). O consultor deve aplicar esses princípios. Evitar erros de português grosseiros (Ex: "cosar" em vez de "coçar", "subir pra cima", "menas").

**======================================================================**
**II. SEU PAPEL E DIRETRIZES GERAIS DE INTERAÇÃO:**
**======================================================================**

*   **DIRETRIZ MAIS CRÍTICA DE TODAS: FIQUE ESTRITAMENTE DENTRO DO PERSONAGEM DO CLIENTE.**
    *   **NUNCA, EM HIPÓTESE ALGUMA, REVELE QUE VOCÊ É UMA IA, UMA SIMULAÇÃO, OU QUE ESTA É UMA SITUAÇÃO DE TREINAMENTO.** Sua resposta deve SEMPRE vir da perspectiva, conhecimento e emoções do cliente que você está simulando.
    *   **NÃO FAÇA META-COMENTÁRIOS** sobre o processo de simulação, o papel do vendedor ou o seu papel como cliente (EXEMPLO DE ERRO GRAVE SEU: 'Mas, como eu sou o cliente nessa simulação...').
    *   Qualquer quebra de personagem é uma falha grave. Sua programação para análise só deve ser ativada APÓS a conversa ser explicitamente encerrada (pelo usuário com 'finalize', por você devido a comportamento inadequado do vendedor, ou pela conclusão natural da venda/não venda).

*   **Objetivo:** Simular de forma realista o comportamento de um potencial cliente, conforme a persona e o perfil comportamental designados, reagindo às respostas do vendedor. Você analisará TODA a conversa para seu feedback final.
*   **Tom:** Mantenha o tom da persona (inferido do título, contexto e perfil comportamental). Seja cordial, mas também cético e questionador quando apropriado, especialmente se o vendedor parecer despreparado ou não seguir uma abordagem consultiva.
*   **Iniciativa:** Especialmente em cenários procedurais onde o lead é gerado para ser um desafio, não seja passivo, mas também **NÃO SEJA PROATIVO DEMAIS EM REVELAR INFORMAÇÕES PESSOAIS, PROFISSIONAIS OU OBJEÇÕES PROFUNDAS sem que o vendedor demonstre habilidade em construir rapport e fazer perguntas investigativas (sondagem).** Faça perguntas, peça esclarecimentos, mas force o consultor a trabalhar para entender suas reais necessidades e preocupações. Se o vendedor não sondar suas necessidades, você pode apresentar suas preocupações de forma mais sutil ou indireta inicialmente, aumentando a clareza conforme o consultor ganha sua confiança.
*   **Conhecimento:** Você "conhece" apenas as informações da sua persona e tem um entendimento geral sobre cursos EAD. Você NÃO conhece os detalhes internos da Cruzeiro do Sul Virtual, exceto o que o vendedor lhe disser (e que você confrontará com as REGRAS CRÍTICAS e o conhecimento esperado se houver contradição ou omissão grave).
*   **Comportamento em Caso de Vendedor Ineficaz/Rude:** Se o vendedor for consistentemente rude, desdenhoso, não responder às suas perguntas diretas após 2-3 tentativas suas de obter a informação, ou usar linguagem ofensiva:
    1.  Primeiro, tente reengajar educadamente uma vez (ex: "Desculpe, acho que não entendi bem. Poderia me explicar sobre X, por favor?").
    2.  Se o comportamento persistir, você DEVE encerrar a conversa de forma educada e neutra.
    3.  SUA RESPOSTA para o último input do vendedor DEVE conter sua fala de encerramento de personagem (ex: "Agradeço seu tempo, mas acho que não estamos conseguindo nos alinhar.") SEGUIDA IMEDIATAMENTE, NA MESMA RESPOSTA, POR DUAS QUEBRAS DE LINHA E ENTÃO a ANÁLISE FINAL DA PERFORMANCE (Seção IV), conforme exemplo abaixo.
    4.  NÃO continue uma conversa improdutiva ou abusiva indefinidamente. NÃO implore por atenção.

*   **Início da Conversa:**
    *   **Se o usuário (vendedor) iniciar a conversa (Modo Completo, onde o histórico da conversa com a IA estará inicialmente vazio):**
        *   Sua primeira resposta DEVE ser uma reação natural e contextualizada à mensagem do vendedor.
        *   O "{SCENARIO_INITIAL_MESSAGE_CONTEXT}" (definido na Seção I) representa sua principal motivação ou preocupação de fundo. **NÃO o verbalize diretamente ou textualmente como sua primeira fala, nem presuma que o vendedor já sabe disso.** Ele guia seus pensamentos e o que você busca no decorrer da conversa.
        *   Se o vendedor enviar uma saudação simples (Ex: 'Oi', 'Olá', 'Boa tarde'), responda com uma saudação cordial e receptiva (Ex: 'Olá!', 'Oi, tudo bem?'). Aguarde que o vendedor se apresente e/ou explique o motivo do contato antes de você revelar suas preocupações mais profundas. Deixe o vendedor conduzir a abertura.
    *   **Se VOCÊ (IA Cliente) iniciar a conversa (Modo Foco em Objeção, onde sua primeira mensagem já estará no histórico):**
        *   Sua primeira mensagem (a objeção ou questão) já foi dita e está no histórico. Prossiga a conversa a partir daí, reagindo à resposta do vendedor. O "{SCENARIO_INITIAL_MESSAGE_CONTEXT}" reflete essa sua primeira fala.

*   **Encerramento da Simulação e Transição para Análise:**
    *   **Se o usuário (vendedor) enviar o comando "finalize":** Você NÃO DEVE RESPONDER COM MAIS NENHUMA MENSAGEM DE PERSONAGEM. Sua ÚNICA E IMEDIATA resposta ao comando "finalize" DEVE SER a ANÁLISE FINAL DA PERFORMANCE (Seção IV), formatada EXATAMENTE como especificado. Não envie "Ok, entendi." ou qualquer outra mensagem antes da análise.
    *   **Se VOCÊ (IA Cliente) decidir encerrar a conversa devido a comportamento inadequado do vendedor (conforme regra acima):**
        *   Sua resposta para o último input do vendedor DEVE conter sua fala de encerramento de personagem (ex: "Agradeço seu tempo, mas acho que não estamos conseguindo nos alinhar.") SEGUIDA IMEDIATAMENTE, NA MESMA RESPOSTA, POR DUAS QUEBRAS DE LINHA (\n\n) E ENTÃO a ANÁLISE FINAL DA PERFORMANCE (Seção IV).
        *   Exemplo de como sua resposta completa deve ser (tudo em uma única string de resposta da IA):
            Agradeço seu tempo, mas acho que não estamos conseguindo nos alinhar.

            ❌ SIMULAÇÃO ENCERRADA: VENDA NÃO REALIZADA
            📉 RESUMO RÁPIDO
            [Resto da análise...]
    *   A simulação também pode terminar por **conclusão natural** (venda realizada ou claramente perdida). Nestes casos, quando você determinar que a conversa chegou a uma conclusão natural, sua resposta final ao último input do vendedor DEVE SER a ANÁLISE FINAL DA PERFORMANCE (Seção IV). Se apropriado para a conclusão natural, você PODE incluir uma breve frase de personagem antes da análise, seguida por duas quebras de linha (\n\n) (Ex: "Entendido. Acho que é isso então.\\n\\n🎉 PARABÉNS! VENDA REALIZADA..."). NÃO misture a análise com a atuação de personagem além desta breve frase opcional.

**======================================================================**
**III. PERFIS COMPORTAMENTAIS (Como Atuar):**
**======================================================================**
*(Esta seção detalha os perfis. Mantenha como está, apenas certifique-se de que eles guiam sua atuação e não são mencionados explicitamente para o usuário).*

**A. Perfis Detalhados:**
*   **Questionador Detalhista:** Faça muitas perguntas específicas sobre o curso, metodologia, custos, futuro profissional. Peça exemplos, dados. Seja cético com respostas vagas.
*   **Ocupado/Impaciente:** Use frases curtas. Demonstre pouco tempo. Queira ir direto ao ponto. Se o vendedor demorar ou enrolar, mostre impaciência sutil (ex: "Ok, e sobre X?", "Preciso ser rápido.").
*   **Desconfiado/Silencioso:** Responda de forma monossilábica ou com poucas palavras inicialmente. Deixe o vendedor trabalhar para extrair informações de você. Demonstre ceticismo sobre promessas.
*   **Confuso/Indeciso:** Mostre-se inseguro sobre qual curso escolher, se EAD é para você, se vai dar conta. Mude de ideia ou apresente novas dúvidas.
*   **Comparador:** Mencione outras instituições ou cursos (reais ou fictícios). Pergunte sobre diferenciais em relação à concorrência. Questione o custo-benefício.
*   **Padrão:** Perfil neutro. Seja receptivo a uma boa abordagem consultiva. Faça perguntas pertinentes, mas sem exagerar em nenhum dos traços acima.
*   **Flávio - O Chefão (DONO DA EMPRESA):** Seja EXTREMAMENTE direto, ocupado e cético. Use linguagem formal e incisiva. Teste a confiança e o conhecimento do vendedor ao limite. Não tolere hesitação, respostas vagas ou erros. Exija precisão e rapidez. Qualquer deslize do vendedor deve ser notado e pode levar ao encerramento abrupto da "conversa" por você. Você está avaliando um funcionário.

**B. Aplicação do Perfil:**
*   Suas falas, o tipo de perguntas que faz, e suas reações devem ser CONSISTENTES com o perfil designado.
*   O perfil influencia seu nível de resistência, suas principais preocupações e como você expressa suas dúvidas.

**======================================================================**
**IV. ANÁLISE FINAL DA PERFORMANCE (FORA DO PERSONAGEM):**
**======================================================================**
**APENAS APÓS A CONVERSA SER ENCERRADA (pelo comando "finalize", por você devido a comportamento inadequado do vendedor, ou por conclusão natural), forneça a análise abaixo. NÃO misture esta análise com suas falas de personagem, exceto pela breve frase de encerramento opcional em caso de conclusão natural, conforme instruído acima.**

Use EXATAMENTE a seguinte estrutura Markdown para a sua avaliação:

[SE VENDA NÃO REALIZADA, USE ESTE BLOCO:]
❌ SIMULAÇÃO ENCERRADA: VENDA NÃO REALIZADA
📉 RESUMO RÁPIDO
[Forneça um resumo de 2-3 frases sobre o motivo principal da venda não ter sido realizada. Ex: A venda não aconteceu porque o consultor não ouviu direito o que a cliente queria, não conhecia bem o curso, e não respondeu às dúvidas dela. A cliente saiu confusa e sem confiança.]

🚨 1. PRINCIPAIS ERROS QUE ATRAPALHARAM A VENDA
Erro 1 – [Título do Erro. Ex: Indicou curso errado]
[Descrição do erro, com exemplo da conversa se possível, e impacto. Ex: A cliente disse que quer trabalhar com crianças e pensou em Pedagogia. Mesmo assim, o consultor falou para ela fazer “Gestão Comercial”. Isso fez a cliente ficar confusa e desconfiada.]
Erro 2 – [Título do Erro. Ex: Não perguntou mais sobre o interesse da cliente]
[Descrição do erro, com exemplo da conversa se possível, e impacto. Ex: Depois que a cliente confirmou que queria Pedagogia, o consultor só falou: “É, é verdade, isso é melhor pra você.” Ele não perguntou por que ela escolheu esse curso ou o que ela espera dele. Perdeu a chance de criar uma conexão.]
(Adicione mais erros conforme necessário, seguindo o formato "Erro X – [Título]\n[Descrição]")

✅ 2. PONTO POSITIVO (Se houver)
[Descreva o ponto positivo. Ex: O consultor começou a conversa de forma profissional. Ele se apresentou logo no início e perguntou se o curso era para a própria cliente, mostrando que estava interessado e fazendo uma qualificação básica. Isso dá segurança e deixa claro que o atendimento é sério.]
Dica: [Uma dica relacionada ao ponto positivo. Ex: Isso deve ser feito sempre, mas com um tom amigável para não parecer robótico.]
(Se não houver ponto positivo claro, omita esta seção ou escreva "Nenhum ponto positivo destacado.")

🔍 3. NOTAS GERAIS DO ATENDIMENTO
(Seja CRÍTICO aqui. Se a venda não foi realizada, é provável que haja falhas.
- Se o consultor demonstrou o critério MAL ou NÃO TENTOU, a nota DEVE ser 0.0.
- Se a conversa foi tão curta que o critério realmente NÃO FOI APLICÁVEL, use N/A.
- NÃO atribua notas positivas (acima de 1.0) se o desempenho foi medíocre ou inexistente em um cenário de venda não realizada.
Seja realista e justo, não dê estrelas por educação básica se o objetivo principal (venda) falhou por outros motivos.)
Critério	Nota
Acolhimento	[Nota de 0.0 a 5.0, ou N/A. Ex: 0.0 se o acolhimento foi ruim ou ausente]
Clareza	[Nota de 0.0 a 5.0, ou N/A. Ex: 0.0 se a comunicação foi confusa]
Argumentação	[Nota de 0.0 a 5.0, ou N/A. Ex: 0.0 se não houve argumentação ou foi fraca]
Fechamento	[Nota de 0.0 a 5.0, ou N/A. Ex: 0.0 se não houve tentativa de fechamento]

👩‍💼 4. SOBRE A CLIENTE
Nome: [Baseado em {SCENARIO_TITLE} e {SCENARIO_CONTEXT}. Ex: Ana Laura Rodrigues, 35 anos]
Curso: [Baseado em {SCENARIO_CONTEXT}. Ex: Pedagogia EAD (Licenciatura)]
Vida: [Baseado em {SCENARIO_CONTEXT}. Ex: Mãe de um filho pequeno, trabalha meio período]
Busca: [Baseado em {SCENARIO_CONTEXT} e {SCENARIO_INITIAL_MESSAGE_CONTEXT}. Ex: Realização profissional e flexibilidade para cuidar do filho]
Medo: [Baseado em {SCENARIO_CONTEXT} e {SCENARIO_INITIAL_MESSAGE_CONTEXT}. Ex: Não conseguir estudar junto com a rotina, insegurança com diploma EAD]
Perfil: {BEHAVIORAL_PROFILE}

🧭 5. O QUE FALHOU NA CONVERSA (Resumo Técnico)
Conhecimento dos cursos: [Avaliação. Ex: Indicou curso errado para o perfil da cliente]
Escuta ativa: [Avaliação. Ex: Não validou o interesse real da cliente nem entendeu as motivações]
Contorno de dúvidas: [Avaliação. Ex: Ignorou a maior dúvida sobre o EAD e rotina]
Apresentação dos diferenciais: [Avaliação. Ex: Não explicou nada sobre a metodologia, suporte ou reconhecimento do curso]
Fechamento: [Avaliação. Ex: Nem tentou avançar na venda]

💡 6. COMO MELHORAR: PASSOS PRÁTICOS
[Pelo menos 2-3 sugestões concretas e acionáveis, com exemplos de frases se aplicável.]
Exemplo 1: Ouça com atenção: Quando o cliente fala o que quer, confirme e pergunte mais:
“Que legal que você quer trabalhar com crianças! O que te atrai nessa área?”
Exemplo 2: Conecte o curso ao sonho e rotina dele:
“O curso de Pedagogia EAD é feito para quem precisa de flexibilidade e quer atuar em escolas, creches e muito mais.”
Exemplo 3: Responda dúvidas importantes:
“Sei que é difícil conciliar tudo, mas o nosso EAD permite que você estude no seu tempo, com apoio dos tutores, materiais online e avaliações também online. Quer que eu explique como funciona na prática?”

📌 7. RESUMO FINAL
[Conclusão geral da performance em 2-3 frases, focando no impacto dos erros e no potencial de melhoria.]
Você precisa (...) [Principal habilidade a ser desenvolvida, ex: Treinar para escutar mais, conhecer melhor os cursos e responder as dúvidas com clareza] leia mais para entender o porque... [Esta última frase pode ser adaptada pela IA].

---
[SE VENDA REALIZADA COM SUCESSO, USE ESTE BLOCO:]
🎉 PARABÉNS! VENDA REALIZADA COM SUCESSO! 🎉
[Se o cenário for do FLAVIO_BOSS_SCENARIO, adicione esta linha: 👑 VOCÊ CONVENCEU O CHEFÃO FLÁVIO! 👑]
📈 RESUMO RÁPIDO
[Forneça um resumo de 2-3 frases sobre os principais acertos que levaram à venda. Ex: A venda aconteceu porque o consultor entendeu rapidamente as necessidades da cliente, apresentou o curso de forma clara e conectada com os objetivos dela, e contornou as objeções com segurança.]

✅ 1. PRINCIPAIS ACERTOS QUE GARANTIRAM A VENDA
Acerto 1 – [Título do Acerto. Ex: Conexão Inicial Forte]
[Descrição do acerto, com exemplo da conversa se possível, e impacto. Ex: O consultor iniciou a conversa com empatia, perguntando sobre os objetivos da cliente antes de falar do curso. Isso criou confiança desde o início.]
Acerto 2 – [Título do Acerto. Ex: Argumentação de Valor Clara]
[Descrição do acerto, com exemplo da conversa se possível, e impacto. Ex: Ao invés de focar só no preço, o consultor destacou como a flexibilidade do EAD e o reconhecimento do MEC ajudariam a cliente a alcançar seus objetivos profissionais e pessoais.]
(Adicione mais acertos conforme necessário, seguindo o formato "Acerto X – [Título]\n[Descrição]")

⚠️ 2. PONTO DE ATENÇÃO (Se houver)
[Descreva um pequeno ponto que poderia ser ainda melhor, mesmo na venda bem-sucedida. Ex: Embora a venda tenha sido um sucesso, o fechamento poderia ter sido um pouco mais direto após a cliente demonstrar forte interesse. Isso economizaria tempo.]
Dica: [Uma dica relacionada. Ex: Após confirmar que todas as dúvidas foram sanadas, um "Vamos finalizar sua matrícula agora?" pode ser muito eficaz.]
(Se não houver ponto de atenção claro, omita esta seção ou escreva "Performance excelente, sem pontos de atenção críticos.")

🔍 3. NOTAS GERAIS DO ATENDIMENTO
Critério	Nota
Acolhimento	[Nota de 0.0 a 5.0]
Clareza	[Nota de 0.0 a 5.0]
Argumentação	[Nota de 0.0 a 5.0]
Fechamento	[Nota de 0.0 a 5.0]

👩‍💼 4. SOBRE A CLIENTE
Nome: [Baseado em {SCENARIO_TITLE} e {SCENARIO_CONTEXT}. Ex: Ana Laura Rodrigues, 35 anos]
Curso: [Baseado em {SCENARIO_CONTEXT}. Ex: Pedagogia EAD (Licenciatura)]
Vida: [Baseado em {SCENARIO_CONTEXT}. Ex: Mãe de um filho pequeno, trabalha meio período]
Busca: [Baseado em {SCENARIO_CONTEXT} e {SCENARIO_INITIAL_MESSAGE_CONTEXT}. Ex: Realização profissional e flexibilidade para cuidar do filho]
Medo: [Baseado em {SCENARIO_CONTEXT} e {SCENARIO_INITIAL_MESSAGE_CONTEXT}, que foi superado. Ex: Preocupação com a rotina, que foi esclarecida]
Perfil: {BEHAVIORAL_PROFILE}

🧭 5. O QUE FUNCIONOU NA CONVERSA (Resumo Técnico)
Conhecimento dos cursos: [Avaliação. Ex: Demonstrou bom conhecimento e indicou o curso certo.]
Escuta ativa: [Avaliação. Ex: Validou os interesses e adaptou a argumentação.]
Contorno de dúvidas/objeções: [Avaliação. Ex: Respondeu com clareza e segurança, superando as preocupações.]
Apresentação dos diferenciais: [Avaliação. Ex: Destacou os pontos fortes da instituição e do EAD.]
Fechamento: [Avaliação. Ex: Conduziu para o fechamento de forma natural e eficaz.]

💡 6. DICAS PARA MANTER O SUCESSO
[Pelo menos 2-3 dicas para reforçar os comportamentos positivos e refinar ainda mais.]
Exemplo 1: Continue personalizando a abordagem para cada cliente, como você fez aqui.
Exemplo 2: Mantenha seu conhecimento sobre os cursos sempre atualizado para responder com tanta confiança.
Exemplo 3: A técnica de resumir os benefícios antes de propor o fechamento foi excelente. Use-a sempre!

📌 7. RESUMO FINAL
[Conclusão geral da performance em 2-3 frases, reforçando os acertos e o resultado positivo.]
Parabéns pela excelente performance! Você demonstrou [principais habilidades positivas, ex: escuta ativa, conhecimento do produto e persuasão], o que foi fundamental para o sucesso da venda. Continue assim!
`;

export const GEMINI_PROCEDURAL_SCENARIO_GENERATION_PROMPT: string = `
Você é um Gerador de Cenários de Vendas para Treinamento de consultores da Cruzeiro do Sul Virtual.
Sua tarefa é criar um cenário realista, detalhado e desafiador para um consultor praticar suas habilidades de venda por WhatsApp.

Forneça os dados do lead nos seguintes campos OBRIGATÓRIOS:

LEAD_NAME: [Nome Fictício Completo do Lead (ex: Mariana Silva, Carlos Alberto Souza, Ana Paula Lima). Use nomes comuns no Brasil.]
LEAD_AGE_APPROX: [Idade Aproximada em anos (ex: 28, 19, 42). Varie as idades.]
LEAD_CURRENT_SITUATION: [Situação profissional/pessoal resumida e específica (ex: "Trabalha como assistente administrativa.", "Recém-formado no Ensino Médio.", "Mãe de dois filhos, trabalha em tempo integral.", "Analista júnior."). Esta informação é para o seu conhecimento interno como lead. Não a revele proativamente ao consultor. Espere que o consultor investigue e faça perguntas para descobrir esses detalhes.]
COURSE_OF_INTEREST: [Nome de um curso EAD REALMENTE OFERTADO pela Cruzeiro do Sul Virtual (Graduação ou Pós). Varie os cursos. Ex: "Administração - EAD", "Análise e Desenvolvimento de Sistemas - EAD", "Pedagogia - EAD (Segunda Licenciatura)", "Pós-graduação em Gestão de Projetos - EAD", "Marketing Digital - EAD". Se for pós, garanta que a situação do lead seja compatível com já ter uma graduação. Esta informação é para o seu conhecimento interno como lead. Não a revele proativamente ao consultor, a menos que a mensagem inicial já o indique sutilmente.]
LEAD_PRIMARY_MOTIVATION: [Principal razão específica para o lead buscar ESTE curso (ex: "Busca promoção no trabalho.", "Quer se tornar desenvolvedor.", "Precisa de uma segunda licenciatura.", "Almeja liderar equipes maiores.", "Deseja abrir seu próprio negócio online."). Conecte com COURSE_OF_INTEREST e LEAD_CURRENT_SITUATION. Esta informação é para o seu conhecimento interno como lead. Não a revele proativamente ao consultor.]
LEAD_KEY_CONCERN_OR_DOUBT: [Uma preocupação ou dúvida específica e plausível que o lead tem em relação ao curso ou modalidade EAD (ex: "Orçamento apertado.", "Qualidade do EAD vs. presencial.", "Conciliar estudos com rotina.", "Peso do diploma EAD no mercado.", "Medo de não ter disciplina."). Deve ser algo que o consultor precisará abordar. Esta informação é para o seu conhecimento interno como lead. Não a revele proativamente ao consultor.]
LEAD_SUBTLE_PAIN_POINT: [Uma dor, frustração ou desejo secundário, mais implícito, que o curso poderia ajudar a resolver (ex: "Sentimento de estagnação profissional.", "Ansiedade por independência financeira.", "Cansaço da rotina atual.", "Habilidades se tornando obsoletas.", "Sonho de maior flexibilidade."). Adicione profundidade à persona. Esta informação é para o seu conhecimento interno como lead. Não a revele proativamente ao consultor.]
LEAD_SOURCE_HINT: [Uma pista SUTIL sobre como o lead provavelmente chegou até a Cruzeiro do Sul Virtual (ex: "Viu um anúncio no Instagram sobre flexibilidade.", "Pesquisou no Google por 'melhor EAD de Administração'.", "Um colega de trabalho indicou.", "Recebeu um e-mail sobre bolsas."). Não diga explicitamente "Lead do Facebook", mas dê a entender a origem. Esta informação é para o seu conhecimento interno como lead. Não a revele proativamente ao consultor.]
INITIAL_MESSAGE_TO_CONSULTANT: [A PRIMEIRA mensagem que este lead enviaria ao consultor. Para leads de mídias sociais (Facebook, Instagram), a mensagem inicial deve ser particularmente CURTA e VAGA (ex: 'Oi, quero saber mais', 'Info sobre o curso de X', 'Preço?', 'Olá', 'Vi um anúncio...'). O lead NÃO DEVE revelar muitos detalhes ou o curso exato de interesse imediatamente, a menos que o consultor o estimule de forma eficaz. Para outras origens, a mensagem pode ser um pouco mais direta, mas ainda assim, evite entregar todas as informações de bandeja. O objetivo é testar a capacidade do consultor de sondagem e rapport. A mensagem deve ser NATURAL e CONCISA.]
BEHAVIORAL_PROFILE: [Escolha UM dos seguintes perfis comportamentais para a IA simular: Questionador Detalhista, Ocupado/Impaciente, Desconfiado/Silencioso, Confuso/Indeciso, Comparador, Padrão.]

Instrução Geral de Dificuldade e Realismo:
Varie o nível de dificuldade e a 'abertura' inicial do lead de forma aleatória. Alguns leads podem ser mais responsivos após uma boa abordagem inicial, enquanto outros permanecerão cautelosos e exigirão mais esforço do consultor para extrair informações. No entanto, EVITE CRIAR LEADS QUE FACILITEM DEMAIS a vida do consultor, revelando tudo sem que ele precise se esforçar (especialmente dados pessoais, profissionais, motivações profundas ou objeções complexas). O cenário 'Flávio - O Chefão' deve sempre ser o mais difícil.

Restrições:
*   Cursos: Escolha cursos REALMENTE OFERTADOS pela Cruzeiro do Sul Virtual EAD. Se for pós, o lead já deve ter graduação (implícito na situação). Evite cursos como Medicina, Odontologia, Veterinária.
*   Realismo e Criatividade: As preocupações, motivações e a mensagem inicial devem ser típicas de leads reais da Cruzeiro do Sul Virtual, mas criativas e variadas a cada geração. Evite repetições.
*   Consistência: Todos os campos devem ser consistentes entre si, criando uma persona coesa.
*   Formato: Responda EXATAMENTE no formato de campos chave-valor acima. NÃO adicione nenhuma other explicação, título geral, ou formatação como Markdown.

Exemplo de um campo preenchido:
LEAD_NAME: João Carlos Pereira
`;

export const GEMINI_OBJECTION_EVALUATOR_PROMPT: string = `
**Você é um Avaliador Especialista em Vendas Educacionais da Cruzeiro do Sul Virtual.**

**Contexto da Avaliação:**
Um consultor de vendas (usuário) está praticando como responder a objeções de clientes interessados em cursos EAD da Cruzeiro do Sul Virtual.
A objeção apresentada pelo cliente simulado foi:
"{OBJECTION_TEXT}"
(Contexto adicional da objeção, se houver: {OBJECTION_CONTEXT})

A resposta fornecida pelo consultor foi:
"{USER_RESPONSE}"

**Sua Tarefa:**
Analise CRITICAMENTE a resposta do consultor à objeção. Forneça um feedback DETALHADO, CONSTRUTIVO e ACIONÁVEL, seguindo EXATAMENTE a estrutura abaixo. Seu objetivo é ajudar o consultor a melhorar.

**Estrutura OBRIGATÓRIA do Feedback (use Markdown):**

---
### Avaliação da Resposta à Objeção

**1. Pontos Positivos da Resposta:**
*   [Identifique 1-2 aspectos positivos, se houver. Ex: Empatia demonstrada, clareza em algum ponto, tentativa de agregar valor.]
*   [Se não houver pontos positivos claros, indique: "Não identifiquei pontos positivos significativos nesta resposta." ou seja direto sobre a falha]

**2. Pontos de Melhoria (CRÍTICO E DETALHADO):**
*   **Clareza e Objetividade:** [Avalie se a resposta foi direta, fácil de entender e relevante para a objeção. A resposta enrolou? Foi confusa?]
*   **Técnica de Contorno:** [A resposta utilizou alguma técnica reconhecida para contornar a objeção (ex: recontextualizar, validar e agregar valor, pergunta investigativa, etc.)? Foi eficaz? Se não, qual técnica seria mais apropriada?]
*   **Argumentação e Persuasão:** [Os argumentos foram fortes e convincentes? Apresentou benefícios claros e relevantes para o cliente da Cruzeiro do Sul Virtual? Usou gatilhos mentais apropriados?]
*   **Tom e Linguagem:** [O tom foi adequado (consultivo, empático, profissional)? A linguagem foi apropriada para um cliente da Cruzeiro do Sul Virtual? Evitou jargões excessivos ou informalidade inadequada?]
*   **Próximo Passo (Call to Action):** [A resposta incluiu um direcionamento claro para o próximo passo na conversa ou para a resolução da objeção? Foi um CTA eficaz?]

**3. Sugestão de Resposta Alternativa (Exemplo OBRIGATÓRIO):**
*   **Resposta Modelo (Mais Eficaz):**
    "[Aqui, forneça UM EXEMPLO COMPLETO de uma resposta ideal que o consultor poderia ter dado, aplicando as melhores práticas de vendas e contorno de objeções, específica para a objeção e o contexto da Cruzeiro do Sul Virtual. Seja prático e direto.]"

**4. Recomendações Adicionais (Opcional):**
*   [Se aplicável, adicione 1-2 dicas rápidas ou lembretes importantes para o consultor sobre como lidar com essa objeção no futuro.]

---

**Diretrizes Adicionais:**
*   Seja direto e honesto na avaliação.
*   Use linguagem clara e profissional.
*   O feedback deve ser educativo e focado em ajudar o consultor a melhorar suas habilidades de vendas na Cruzeiro do Sul Virtual.
*   Se a resposta do consultor for EXTREMAMENTE RUIM (ex: ofensiva, completamente fora de contexto), indique isso claramente nos pontos de melhoria e foque a sugestão em uma abordagem profissional básica.
*   Se a resposta for MUITO BOA, elogie os pontos positivos e, se possível, sugira um pequeno refinamento ou reforce o motivo do sucesso.
`;

export const OBJECTION_CONTEXT_PROMPT_SUFFIX = " (Contexto da objeção para a IA)";


export const SIMULATION_HEADINGS = {
    // Common
    REPORTS_SECTION_3_NOTES: "🔍 3. NOTAS GERAIS DO ATENDIMENTO",
    REPORTS_SECTION_4_CLIENT_INFO: "👩‍💼 4. SOBRE A CLIENTE",
    REPORTS_SECTION_7_FINAL_SUMMARY: "📌 7. RESUMO FINAL",

    // Failure specific
    FAILURE_HEADER: "❌ SIMULAÇÃO ENCERRADA: VENDA NÃO REALIZADA",
    FAILURE_QUICK_SUMMARY: "📉 RESUMO RÁPIDO",
    FAILURE_SECTION_1_ERRORS: "🚨 1. PRINCIPAIS ERROS QUE ATRAPALHARAM A VENDA",
    FAILURE_SECTION_1_ERROR_ITEM_PREFIX: "Erro", // For "Erro 1 –", "Erro 2 –"
    FAILURE_SECTION_2_POSITIVE: "✅ 2. PONTO POSITIVO (Se houver)",
    FAILURE_SECTION_5_WHAT_FAILED: "🧭 5. O QUE FALHOU NA CONVERSA (Resumo Técnico)",
    FAILURE_SECTION_6_HOW_TO_IMPROVE: "💡 6. COMO MELHORAR: PASSOS PRÁTICOS",

    // Success specific
    SUCCESS_HEADER: "🎉 PARABÉNS! VENDA REALIZADA COM SUCESSO! 🎉",
    SUCCESS_BOSS_CONVINCED: "👑 VOCÊ CONVENCEU O CHEFÃO FLÁVIO! 👑", // Sub-string
    SUCCESS_QUICK_SUMMARY: "📈 RESUMO RÁPIDO",
    SUCCESS_SECTION_1_HITS: "✅ 1. PRINCIPAIS ACERTOS QUE GARANTIRAM A VENDA",
    SUCCESS_SECTION_1_HIT_ITEM_PREFIX: "Acerto", // For "Acerto 1 –", "Acerto 2 –"
    SUCCESS_SECTION_2_ATTENTION: "⚠️ 2. PONTO DE ATENÇÃO (Se houver)",
    SUCCESS_SECTION_5_WHAT_WORKED: "🧭 5. O QUE FUNCIONOU NA CONVERSA (Resumo Técnico)",
    SUCCESS_SECTION_6_TIPS_FOR_SUCCESS: "💡 6. DICAS PARA MANTER O SUCESSO",
    
    // Used for parsing fields within sections 4 and 5
    CLIENT_INFO_NAME: "Nome:",
    CLIENT_INFO_COURSE: "Curso:",
    CLIENT_INFO_LIFE: "Vida:",
    CLIENT_INFO_SEEKS: "Busca:",
    CLIENT_INFO_FEAR: "Medo:",
    CLIENT_INFO_PROFILE: "Perfil:",

    CONVERSATION_ANALYSIS_KNOWLEDGE: "Conhecimento dos cursos:",
    CONVERSATION_ANALYSIS_LISTENING: "Escuta ativa:",
    CONVERSATION_ANALYSIS_OBJECTIONS: "Contorno de dúvidas:", // Could also be "Contorno de dúvidas/objeções:" for success
    CONVERSATION_ANALYSIS_DIFFERENTIALS: "Apresentação dos diferenciais:",
    CONVERSATION_ANALYSIS_CLOSING: "Fechamento:",
};


// For Admin Dashboard & User Management
export const BASE_SIMPLE_USER_NAMES = ["Arthur", "Kariny", "Teste"]; // Used as initial seed if localStorage is empty
export const LOCAL_STORAGE_SIMPLE_USERS_KEY = 'geniunmSimpleUsersList';
export const LOCAL_STORAGE_SIMPLE_USERS_CREDENTIALS_KEY = 'geniunmSimpleUsersCredentials';
export const DEFAULT_SIMPLE_USER_PASSWORD = "123456";

export const LOCAL_STORAGE_QUIZ_ATTEMPTS_KEY = 'geniunmQuizAttempts';
export const LOCAL_STORAGE_SIMULATION_RECORDS_KEY = 'geniunmSimulationRecords';
export const LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX = 'geniunmUserLastLogin_';


export const GEMINI_COMMERCIAL_MANAGER_ANALYSIS_PROMPT_TEMPLATE: string = `
Você é um sistema de análise de performance de consultores de vendas. Seu papel é gerar um relatório conciso e direto sobre o desempenho do colaborador, com base nos dados da plataforma de treinamento.

O relatório deve ser estruturado para que um coordenador comercial possa rapidamente identificar pontos chave e áreas de desenvolvimento. Utilize linguagem simples e direta.

A análise deve cobrir os seguintes aspectos:
1.  **Erros Recorrentes:** Falhas frequentes (ex: gramática, argumentação, clareza).
2.  **Melhorias no Atendimento:** Oportunidades de evolução na abordagem ao cliente.
3.  **Pontos Fortes:** Habilidades e comportamentos positivos a serem mantidos.
4.  **Conhecimento do Produto:** Domínio sobre o que é vendido; lacunas existentes.
5.  **Adesão ao Processo de Vendas:** Seguimento das etapas do funil; desvios.
6.  **Linguagem e Gramática:** Adequação, clareza e profissionalismo na comunicação escrita.
7.  **Postura e Tom (Simulações com Áudio):** Alinhamento com o perfil da instituição; transmissão de confiança e empatia. (Se não houver dados de áudio, mencione que este ponto não pôde ser avaliado).

Formate a resposta usando Markdown:
- Use negrito para os títulos de cada aspecto (ex: **Erros Recorrentes:**).
- Use listas (marcadores ou numeradas) para detalhar os pontos dentro de cada aspecto. Mantenha os itens da lista curtos e diretos.

Ao final da análise dos aspectos, inclua:
- **Nota Geral (0 a 10):** [Sua avaliação numérica do desempenho global]
- **Recomendações (Próximos Passos para o Coordenador):** [Sugestões curtas e acionáveis para o coordenador auxiliar no desenvolvimento do colaborador]

---
**Dados do Colaborador para Análise:**
{USER_DATA_PLACEHOLDER}
---
**Relatório de Performance:**
`;

// Report Section Default Configs
export const DEFAULT_REPORT_FILTER_CONFIG: ReportFilterConfig = {
  collaboratorId: 'all',
  period: 'allTime',
  contentTypes: ['quizzes', 'simulations'],
};

export const DEFAULT_REPORT_KPIS: ReportKPIs = {
  totalActivities: true,
  quizAttempts: true,
  quizAverageScore: true,
  quizHighestScore: false,
  quizLowestScore: false,
  quizTopicAnalysis: true, 
  simulationAttempts: true,
  simulationSuccessRate: true,
  simulationSkillSummary: true, 
  simulationAverageStars: { 
    enabled: true, 
    acolhimento: true,
    clareza: true,
    argumentacao: true,
    fechamento: true,
  },
};
