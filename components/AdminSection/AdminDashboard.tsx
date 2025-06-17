
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AuthenticatedUser, UserActivityData, QuizAttemptRecord, SimulationRecord, NavigationSection, OverallPerformanceStats, ParsedEvaluation } from '../../types';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import LoadingSpinner from '../ui/LoadingSpinner';
import { LOCAL_STORAGE_QUIZ_ATTEMPTS_KEY, LOCAL_STORAGE_SIMULATION_RECORDS_KEY, LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX, LOCAL_STORAGE_SIMPLE_USERS_KEY } from '../../constants';

const formatDate = (isoString?: string) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch (e) {
    return 'Data inválida';
  }
};

interface AdminDashboardProps {
  currentUser: AuthenticatedUser;
}

const ProgressBar: React.FC<{ percentage: number; colorClass?: string; heightClass?: string }> = ({ percentage, colorClass = 'bg-[var(--color-primary)]', heightClass = 'h-2.5' }) => (
  <div className={`w-full bg-[var(--color-border)] rounded-full ${heightClass} overflow-hidden`}>
    <div
      className={`${colorClass} ${heightClass} rounded-full transition-all duration-500 ease-out`}
      style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      title={`${percentage.toFixed(1)}%`}
    />
  </div>
);

const periodOptions = [
    { value: 'allTime', label: 'Todo o Período' },
    { value: 'last7days', label: 'Últimos 7 Dias' },
    { value: 'last30days', label: 'Últimos 30 Dias' },
];

const isSuccessOutcome = (evalData: ParsedEvaluation | null): boolean => {
    if (!evalData) return false;
    return evalData.outcomeType === 'VENDA_REALIZADA';
};

const KpiModal: React.FC<{isOpen: boolean; onClose: () => void; title: string; summary: string;}> = ({ isOpen, onClose, title, summary }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="kpiModalTitle">
            <GlassCard className="max-w-md w-full p-6 themed-surface" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 id="kpiModalTitle" className="text-xl font-semibold text-[var(--color-primary)]">{title}</h3>
                    <button onClick={onClose} className="text-[var(--color-text-light)] hover:text-[var(--color-text)] text-2xl leading-none p-1" aria-label="Fechar modal">&times;</button>
                </div>
                <p className="text-sm text-[var(--color-text-light)] whitespace-pre-line">{summary}</p>
                <div className="text-right mt-6">
                    <GlassButton onClick={onClose} className="!text-sm !py-2">Fechar</GlassButton>
                </div>
            </GlassCard>
        </div>
    );
};

const kpiSummaries: Record<string, string> = {
    'Total de Usuários Registrados': "Este número representa todos os usuários que já foram cadastrados na plataforma, incluindo administradores e usuários simplificados (conforme gerenciados no painel 'Gerenciar Usuários'). É uma contagem cumulativa desde o início.",
    'Usuários Ativos no Período': "Indica o número de usuários únicos que realizaram pelo menos uma atividade (quiz ou simulação) dentro do período selecionado no filtro temporal (Ex: Últimos 7 dias, Últimos 30 dias).",
    'Simulações no Período': "Total de simulações de conversa que foram concluídas por todos os usuários durante o período selecionado. Cada simulação finalizada conta como uma unidade aqui.",
    'Tentativas de Quiz no Período': "Número total de vezes que os quizzes foram iniciados e finalizados pelos usuários no período selecionado. Uma mesma pessoa pode ter múltiplas tentativas.",
    'Média Quiz (Período)': "A média percentual de acertos em todas as tentativas de quiz realizadas no período. Calculada como (soma das porcentagens de acerto de cada quiz / número total de quizzes feitos). Se não houver quizzes, o valor será N/A.",
    'Sucesso Simulações (Período)': "Percentual de simulações que resultaram em um desfecho de 'sucesso' ou 'venda realizada' (conforme avaliação da IA), dentro do período selecionado. Se não houver simulações, o valor será N/A.",
    'Total Atividades (Período)': "Soma de todas as tentativas de quiz e simulações concluídas no período, oferecendo uma visão geral do engajamento e utilização da plataforma.",
};


const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [userActivities, setUserActivities] = useState<UserActivityData[]>([]);
  const [overallStats, setOverallStats] = useState<OverallPerformanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterUser, setFilterUser] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('allTime');
    
  const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);
  const [kpiModalContent, setKpiModalContent] = useState({ title: '', summary: '' });


  const fetchData = useCallback(() => {
    setIsLoading(true);

    let allQuizAttempts: QuizAttemptRecord[] = [];
    try {
      const storedQuizAttempts = localStorage.getItem(LOCAL_STORAGE_QUIZ_ATTEMPTS_KEY);
      allQuizAttempts = storedQuizAttempts ? JSON.parse(storedQuizAttempts) : [];
    } catch (e) { console.error("Error loading quiz attempts:", e); }

    let allSimRecords: SimulationRecord[] = [];
    try {
      const storedSimRecords = localStorage.getItem(LOCAL_STORAGE_SIMULATION_RECORDS_KEY);
      allSimRecords = storedSimRecords ? JSON.parse(storedSimRecords) : [];
    } catch (e) { console.error("Error loading simulation records:", e); }

    const now = new Date();
    const periodStartDate = new Date(now);
    if (selectedPeriod === 'last7days') {
      periodStartDate.setDate(now.getDate() - 7);
      periodStartDate.setHours(0, 0, 0, 0);
    } else if (selectedPeriod === 'last30days') {
      periodStartDate.setDate(now.getDate() - 30);
      periodStartDate.setHours(0, 0, 0, 0);
    }

    const filteredQuizAttempts = selectedPeriod === 'allTime' 
      ? allQuizAttempts 
      : allQuizAttempts.filter(qa => new Date(qa.timestamp) >= periodStartDate);

    const filteredSimRecords = selectedPeriod === 'allTime'
      ? allSimRecords
      : allSimRecords.filter(sr => new Date(sr.timestamp) >= periodStartDate);

    const activitiesMap = new Map<string, UserActivityData>();
    
    const allKnownUsers = new Map<string, { id: string; displayName: string; lastLogin?: string }>();
    if (currentUser?.type === 'admin') {
        allKnownUsers.set('admin', {id: 'admin', displayName: 'Admin', lastLogin: localStorage.getItem(`${LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX}admin`) || undefined });
    }
    
    // Get simple user names for listing, actual management is elsewhere
    const simpleUsernamesJSON = localStorage.getItem(LOCAL_STORAGE_SIMPLE_USERS_KEY);
    const simpleUsernames: string[] = simpleUsernamesJSON ? JSON.parse(simpleUsernamesJSON) : [];
    simpleUsernames.forEach(name => {
        allKnownUsers.set(name, { id: name, displayName: name, lastLogin: localStorage.getItem(`${LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX}${name}`) || undefined });
    });
    
     allQuizAttempts.forEach(qa => { if (!allKnownUsers.has(qa.userId)) allKnownUsers.set(qa.userId, { id: qa.userId, displayName: qa.username }); });
     allSimRecords.forEach(sr => { if (!allKnownUsers.has(sr.userId)) allKnownUsers.set(sr.userId, { id: sr.userId, displayName: sr.username }); });


    allKnownUsers.forEach(user => {
        activitiesMap.set(user.id, {
            id: user.id,
            displayName: user.displayName,
            lastLogin: user.lastLogin,
            simulationsCompleted: 0,
            quizAttempts: 0,
            averageQuizScore: null,
            simulationSuccessRate: null,
            totalActivities: 0,
        });
    });
    
    filteredQuizAttempts.forEach(attempt => {
      const activity = activitiesMap.get(attempt.userId);
      if (activity) {
        activity.quizAttempts++;
      }
    });

    filteredSimRecords.forEach(record => {
      const activity = activitiesMap.get(record.userId);
      if (activity) {
        activity.simulationsCompleted++;
      }
    });
    
    activitiesMap.forEach(activity => {
        const userQuizAttemptsInPeriod = filteredQuizAttempts.filter(qa => qa.userId === activity.id);
        if (userQuizAttemptsInPeriod.length > 0) {
            const totalScore = userQuizAttemptsInPeriod.reduce((sum, qa) => sum + (qa.totalQuestions > 0 ? (qa.score / qa.totalQuestions) : 0), 0);
            activity.averageQuizScore = (totalScore / userQuizAttemptsInPeriod.length) * 100;
        }

        const userSimRecordsInPeriod = filteredSimRecords.filter(sr => sr.userId === activity.id);
        const successfulSims = userSimRecordsInPeriod.filter(sr => isSuccessOutcome(sr.evaluation)).length;
        if (userSimRecordsInPeriod.length > 0) {
            activity.simulationSuccessRate = (successfulSims / userSimRecordsInPeriod.length) * 100;
        }
        activity.totalActivities = activity.quizAttempts + activity.simulationsCompleted;
    });

    const finalActivities = Array.from(activitiesMap.values())
        .sort((a,b) => (b.lastLogin && a.lastLogin) ? new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime() : (b.totalActivities - a.totalActivities));
    setUserActivities(finalActivities);

    const activeUserIdsInPeriod = new Set<string>();
    filteredQuizAttempts.forEach(qa => activeUserIdsInPeriod.add(qa.userId));
    filteredSimRecords.forEach(sr => activeUserIdsInPeriod.add(sr.userId));

    let overallAvgQuizScore: number | null = null;
    if (filteredQuizAttempts.length > 0) {
        const totalOverallScore = filteredQuizAttempts.reduce((sum, qa) => sum + (qa.totalQuestions > 0 ? (qa.score / qa.totalQuestions) : 0), 0);
        overallAvgQuizScore = (totalOverallScore / filteredQuizAttempts.length) * 100;
    }

    let overallSimSuccessRate: number | null = null;
    if (filteredSimRecords.length > 0) {
        const totalSuccessfulSims = filteredSimRecords.filter(sr => isSuccessOutcome(sr.evaluation)).length;
        overallSimSuccessRate = (totalSuccessfulSims / filteredSimRecords.length) * 100;
    }
    
    const scoreRanges = [
        { range: '90-100%', min: 0.9, max: 1.0, count: 0 }, { range: '70-89%', min: 0.7, max: 0.899, count: 0 },
        { range: '50-69%', min: 0.5, max: 0.699, count: 0 }, { range: '<50%', min: 0, max: 0.499, count: 0 }
    ];
    filteredQuizAttempts.forEach(qa => {
        const percentage = qa.totalQuestions > 0 ? qa.score / qa.totalQuestions : 0;
        const range = scoreRanges.find(r => percentage >= r.min && percentage <= r.max + 0.0001); 
        if (range) range.count++;
    });
    const quizScoreDistributionPeriod = scoreRanges.map(r => ({ ...r, percentage: filteredQuizAttempts.length > 0 ? (r.count / filteredQuizAttempts.length) * 100 : 0 }));

    const outcomeCounts: Record<string, number> = {};
    filteredSimRecords.forEach(sr => {
        const outcome = sr.evaluation?.headerMessage || 'Não Avaliado';
        outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
    });
    const simulationOutcomeDistributionPeriod = Object.entries(outcomeCounts).map(([outcome, count]) => ({
        outcome, count, percentage: filteredSimRecords.length > 0 ? (count / filteredSimRecords.length) * 100 : 0
    })).sort((a,b) => b.count - a.count);

    setOverallStats({
        totalUsers: allKnownUsers.size,
        activeUsersPeriod: activeUserIdsInPeriod.size,
        totalSimulationsPeriod: filteredSimRecords.length,
        totalQuizAttemptsPeriod: filteredQuizAttempts.length,
        averageQuizScorePeriod: overallAvgQuizScore,
        simulationSuccessRatePeriod: overallSimSuccessRate,
        totalActivitiesPeriod: filteredQuizAttempts.length + filteredSimRecords.length,
        quizScoreDistributionPeriod,
        simulationOutcomeDistributionPeriod
    });

    setIsLoading(false);
  }, [currentUser, selectedPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleKpiCardClick = (title: string) => {
    setKpiModalContent({ title, summary: kpiSummaries[title] || "Informação não disponível." });
    setIsKpiModalOpen(true);
  };

  const allUserDisplayNamesForFilter = useMemo(() => {
    const usersForFilter = new Map<string, string>();
     if (currentUser?.type === 'admin') usersForFilter.set('admin', 'Admin');
     // No longer merging managedSimpleUsers here, relies on userActivities to populate the list
     
     userActivities.forEach(act => {
       if (!usersForFilter.has(act.id)) usersForFilter.set(act.id, act.displayName);
     });
    const sorted = Array.from(usersForFilter.entries()).map(([id, displayName]) => ({id, displayName}));
    sorted.sort((a,b) => a.displayName.localeCompare(b.displayName));
    return sorted;

  }, [userActivities, currentUser]);


  const filteredUserActivitiesForTable = useMemo(() => {
    if (!filterUser) return userActivities;
    return userActivities.filter(ua => ua.id.toLowerCase() === filterUser.toLowerCase());
  },[userActivities, filterUser]);

  const kpiCardData = useMemo(() => {
    if (!overallStats) return [];
    return [
        { title: 'Total de Usuários Registrados', value: overallStats.totalUsers.toString(), icon: 'fa-users', color: 'bg-sky-500' },
        { title: 'Usuários Ativos no Período', value: overallStats.activeUsersPeriod.toString(), icon: 'fa-user-clock', color: 'bg-teal-500' },
        { title: 'Simulações no Período', value: overallStats.totalSimulationsPeriod.toString(), icon: 'fa-comments', color: 'bg-green-500' },
        { title: 'Tentativas de Quiz no Período', value: overallStats.totalQuizAttemptsPeriod.toString(), icon: 'fa-file-alt', color: 'bg-yellow-500' },
        { title: 'Média Quiz (Período)', value: overallStats.averageQuizScorePeriod !== null ? `${overallStats.averageQuizScorePeriod.toFixed(1)}%` : 'N/A', icon: 'fa-graduation-cap', color: 'bg-purple-500' },
        { title: 'Sucesso Simulações (Período)', value: overallStats.simulationSuccessRatePeriod !== null ? `${overallStats.simulationSuccessRatePeriod.toFixed(1)}%` : 'N/A', icon: 'fa-bullseye', color: 'bg-pink-500' },
        { title: 'Total Atividades (Período)', value: overallStats.totalActivitiesPeriod.toString(), icon: 'fa-tasks', color: 'bg-orange-500' },
    ];
  }, [overallStats]);

  if (isLoading || !overallStats) {
    return <div className="py-12"><LoadingSpinner text="Carregando dados do painel admin..." /></div>;
  }

  return (
    <section id="admin-panel" className="py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="section-title !mb-0 !border-b-0">Painel Administrativo Geral</h1>
        <div className="w-full sm:w-auto">
            <label htmlFor="period-filter" className="sr-only">Filtrar Período:</label>
            <select
                id="period-filter"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="themed-input themed-select w-full !text-sm"
            >
                {periodOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 mb-8">
        {kpiCardData.map(kpi => (
          <GlassCard 
            key={kpi.title} 
            className="p-4 flex items-center shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleKpiCardClick(kpi.title)}
            role="button"
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') handleKpiCardClick(kpi.title); }}
            aria-haspopup="dialog"
          >
            <div className={`p-3 rounded-lg ${kpi.color} text-white mr-4 text-xl w-12 h-12 flex items-center justify-center flex-shrink-0`}>
              <i className={`fas ${kpi.icon}`}></i>
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--color-text)]">{kpi.value}</p>
              <p className="text-xs text-[var(--color-text-light)]">{kpi.title}</p>
            </div>
          </GlassCard>
        ))}
      </div>
       <KpiModal 
        isOpen={isKpiModalOpen} 
        onClose={() => setIsKpiModalOpen(false)}
        title={kpiModalContent.title}
        summary={kpiModalContent.summary}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
        <GlassCard className="p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-3 text-[var(--color-primary)]">Distribuição de Notas dos Quizzes (Período)</h2>
          {overallStats.quizScoreDistributionPeriod.length > 0 && overallStats.totalQuizAttemptsPeriod > 0 ? (
            <ul className="space-y-2.5 text-xs">
              {overallStats.quizScoreDistributionPeriod.map(item => (
                <li key={item.range}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[var(--color-text-light)]">{item.range}</span>
                    <span className="font-medium text-[var(--color-text)]">{item.count} ({item.percentage.toFixed(1)}%)</span>
                  </div>
                  <ProgressBar percentage={item.percentage} />
                </li>
              ))}
            </ul>
          ) : <p className="text-[var(--color-text-light)] text-sm">Nenhuma tentativa de quiz registrada no período.</p>}
        </GlassCard>

        <GlassCard className="p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-3 text-[var(--color-primary)]">Resultados das Simulações (Período)</h2>
           {overallStats.simulationOutcomeDistributionPeriod.length > 0 && overallStats.totalSimulationsPeriod > 0 ? (
            <ul className="space-y-2 text-xs">
              {overallStats.simulationOutcomeDistributionPeriod.map(item => (
                 <li key={item.outcome}>
                    <div className="flex justify-between mb-0.5">
                        <span className="text-[var(--color-text-light)] truncate max-w-[60%]" title={item.outcome}>{item.outcome}</span>
                        <span className="font-medium text-[var(--color-text)]">{item.count} ({item.percentage.toFixed(1)}%)</span>
                    </div>
                    <ProgressBar percentage={item.percentage} colorClass={item.outcome.toLowerCase().includes('sucesso') || item.outcome.toLowerCase().includes('venda realizada') ? 'bg-green-500' : 'bg-red-400'} heightClass="h-1.5" />
                 </li>
              ))}
            </ul>
           ) : <p className="text-[var(--color-text-light)] text-sm">Nenhum registro de simulação encontrado no período.</p>}
        </GlassCard>
      </div>
      
      <GlassCard className="mb-8 p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary)]">Atividade dos Usuários ({selectedPeriod === 'allTime' ? 'Todo o Período' : periodOptions.find(p=>p.value === selectedPeriod)?.label})</h2>
         <div className="mb-4">
            <label htmlFor="user-filter" className="block text-xs font-medium text-[var(--color-text-light)] mb-1">Filtrar por Usuário:</label>
            <select 
                id="user-filter"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="themed-input themed-select w-full md:w-1/3 !text-sm"
            >
                <option value="">Todos os Usuários</option>
                {allUserDisplayNamesForFilter.map(user => (
                    <option key={user.id} value={user.id}>{user.displayName}</option>
                ))}
            </select>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
            <thead className="bg-[var(--color-input-bg)]">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Usuário</th>
                <th scope="col" className="px-3 py-2 text-left font-medium text-[var(--color-text)] hidden md:table-cell">Último Login</th>
                <th scope="col" className="px-3 py-2 text-center font-medium text-[var(--color-text)]">Quizzes</th>
                <th scope="col" className="px-3 py-2 text-center font-medium text-[var(--color-text)]">Média Quiz</th>
                <th scope="col" className="px-3 py-2 text-center font-medium text-[var(--color-text)]">Simulações</th>
                <th scope="col" className="px-3 py-2 text-center font-medium text-[var(--color-text)]">Sucesso Sim.</th>
                <th scope="col" className="px-3 py-2 text-center font-medium text-[var(--color-text)]">Total Ativ.</th>
                <th scope="col" className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredUserActivitiesForTable.map(user => (
                <tr key={user.id} className="hover:bg-[var(--color-input-bg)] transition-colors">
                  <td className="px-3 py-2 text-[var(--color-text-light)] whitespace-nowrap">{user.displayName}</td>
                  <td className="px-3 py-2 text-[var(--color-text-light)] hidden md:table-cell whitespace-nowrap">{formatDate(user.lastLogin)}</td>
                  <td className="px-3 py-2 text-[var(--color-text-light)] text-center">{user.quizAttempts}</td>
                  <td className="px-3 py-2 text-[var(--color-text-light)] text-center">{user.averageQuizScore !== null ? `${user.averageQuizScore.toFixed(1)}%` : 'N/A'}</td>
                  <td className="px-3 py-2 text-[var(--color-text-light)] text-center">{user.simulationsCompleted}</td>
                  <td className="px-3 py-2 text-[var(--color-text-light)] text-center">{user.simulationSuccessRate !== null ? `${user.simulationSuccessRate.toFixed(1)}%` : 'N/A'}</td>
                  <td className="px-3 py-2 text-[var(--color-text-light)] text-center">{user.totalActivities}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                     <Link to={`/${NavigationSection.AdminPanel}/collaborator/${user.id}`}>
                        <GlassButton className="!text-xs !py-1 !px-2.5">
                            <i className="fas fa-chart-bar mr-1" aria-hidden="true"></i> Detalhes
                        </GlassButton>
                      </Link>
                    </td>
                </tr>
              ))}
               {filteredUserActivitiesForTable.length === 0 && (
                <tr>
                    <td colSpan={8} className="px-4 py-3 text-center text-[var(--color-text-light)]">
                        Nenhum usuário encontrado para os filtros selecionados.
                    </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>
      </GlassCard>

    </section>
  );
};

export default AdminDashboard;
