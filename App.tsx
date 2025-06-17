
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.tsx'; 
import Footer from './components/Footer';
import HomeSection from './components/HomeSection';
import FlashcardSection from './components/FlashcardSection/FlashcardSection';
import QuizSection from './components/QuizSection/QuizSection';
import SimulatorSection from './components/SimulatorSection/SimulatorSection';
import ObjectionTrainerSection from './components/ObjectionTrainerSection/ObjectionTrainerSection'; 
import AdminDashboard from './components/AdminSection/AdminDashboard'; 
import CollaboratorDashboard from './components/AdminSection/CollaboratorDashboard'; 
import UserManagementPanel from './components/AdminSection/UserManagementPanel';
import ReportsSection from './components/AdminSection/ReportsSection'; 
import PersonaCustomizationPanel from './components/AdminSection/PersonaCustomizationPanel'; 
import ProtectedRoute from './components/ProtectedRoute';
import { NavigationSection, AuthenticatedUser, SimpleUser, AdminUser, SimpleUserCredentials } from './types'; 
import { NAV_ITEMS, BASE_SIMPLE_USER_NAMES, LOCAL_STORAGE_SIMPLE_USERS_KEY, LOCAL_STORAGE_SIMPLE_USERS_CREDENTIALS_KEY, DEFAULT_SIMPLE_USER_PASSWORD } from './constants'; 


const ScrollToSection: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const sectionIdFromPath = location.pathname.substring(1); 
    const sectionIdFromHash = location.hash.substring(2); 
    let sectionId = sectionIdFromHash || sectionIdFromPath;

    if (sectionId) {
      const element = document.getElementById(sectionId); 
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      } else if (sectionId === NavigationSection.Home || sectionId === '') {
         setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      }
    } else {
       setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  }, [location]);

  return null;
};


const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [geniunmClickCount, setGeniunmClickCount] = useState(0);
  const [bossBattleTriggered, setBossBattleTriggered] = useState(false);
  const [isSimulatorPage, setIsSimulatorPage] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.matchMedia("(max-width: 767px)").matches);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const [currentUser, setCurrentUser] = useState<AuthenticatedUser>(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [simpleUserList, setSimpleUserList] = useState<string[]>([]);

  const refreshSimpleUserListFromStorage = useCallback(() => {
    let currentSimpleUsernames = BASE_SIMPLE_USER_NAMES;
    const storedSimpleUsernamesJSON = localStorage.getItem(LOCAL_STORAGE_SIMPLE_USERS_KEY);
    if (storedSimpleUsernamesJSON) {
      try {
        currentSimpleUsernames = JSON.parse(storedSimpleUsernamesJSON);
      } catch (e) { console.error("Error parsing simple usernames list from localStorage", e); }
    }
    setSimpleUserList(currentSimpleUsernames);
    localStorage.setItem(LOCAL_STORAGE_SIMPLE_USERS_KEY, JSON.stringify(currentSimpleUsernames));
  }, []);


  useEffect(() => {
    refreshSimpleUserListFromStorage();

    const storedCredentialsJSON = localStorage.getItem(LOCAL_STORAGE_SIMPLE_USERS_CREDENTIALS_KEY);
    const currentSimpleUsernames = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SIMPLE_USERS_KEY) || JSON.stringify(BASE_SIMPLE_USER_NAMES));

    if (storedCredentialsJSON) {
      try {
        JSON.parse(storedCredentialsJSON); 
      } catch (e) {
        console.error("Error parsing credentials from localStorage, resetting.", e);
        const initialCredentials = currentSimpleUsernames.map((username: string) => ({
          username,
          passwordPlainText: DEFAULT_SIMPLE_USER_PASSWORD,
        }));
        localStorage.setItem(LOCAL_STORAGE_SIMPLE_USERS_CREDENTIALS_KEY, JSON.stringify(initialCredentials));
      }
    } else {
      const initialCredentials = currentSimpleUsernames.map((username: string) => ({
        username,
        passwordPlainText: DEFAULT_SIMPLE_USER_PASSWORD,
      }));
      localStorage.setItem(LOCAL_STORAGE_SIMPLE_USERS_CREDENTIALS_KEY, JSON.stringify(initialCredentials));
    }
  }, [refreshSimpleUserListFromStorage]);


  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);


  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => {
        setIsSmallScreen(e.matches);
        if (!e.matches) setIsMobileMenuOpen(false); 
    }
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const handleNavigate = (section: NavigationSection) => {
    if (isSmallScreen) setIsMobileMenuOpen(false);
  };
  

  const handleGeniunmTextClick = () => {
    setGeniunmClickCount(prev => {
        const newCount = prev + 1;
        if (newCount >= 5 && currentUser) {
            setBossBattleTriggered(true);
            return 0; 
        }
        return newCount;
    });
  };

  const resetBossBattleTrigger = () => {
    setBossBattleTriggered(false);
  };

  const handleAdminLogin = (password: string): boolean => {
    if (password === "fenix@2025") { 
      const adminUser: AdminUser = { type: 'admin', username: 'admin', id: 'admin' };
      setCurrentUser(adminUser);
      localStorage.setItem('geniunmUserLastLogin_admin', new Date().toISOString());
      navigate(`/${NavigationSection.AdminPanel}`, { replace: true });
      return true;
    }
    return false;
  };

  const handleSimpleLogin = (username: string, passwordInput: string): boolean => {
    const credentialsJSON = localStorage.getItem(LOCAL_STORAGE_SIMPLE_USERS_CREDENTIALS_KEY);
    if (!credentialsJSON) return false;

    try {
      const credentialsList: SimpleUserCredentials[] = JSON.parse(credentialsJSON);
      const userCredential = credentialsList.find(cred => cred.username === username);
      
      if (userCredential && userCredential.passwordPlainText === passwordInput) {
        const simpleUser: SimpleUser = { type: 'simple', username, id: username };
        setCurrentUser(simpleUser);
        localStorage.setItem(`geniunmUserLastLogin_${username}`, new Date().toISOString());
        return true;
      }
    } catch (e) {
      console.error("Error parsing credentials during login:", e);
      return false;
    }
    return false;
  };

  const handleGoogleLoginPlaceholder = () => {
    const googleUser: AuthenticatedUser = { 
        type: 'google', 
        id: 'googleuser@example.com',
        email: 'googleuser@example.com', 
        name: 'Usuário Google', 
        avatarUrl: undefined 
    };
    setCurrentUser(googleUser);
    localStorage.setItem(`geniunmUserLastLogin_${googleUser.id}`, new Date().toISOString());
    alert("Login com Google (Simulado).\nEm uma aplicação real, aqui ocorreria a autenticação OAuth.");
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setGeniunmClickCount(0); 
    setIsMobileMenuOpen(false);
    navigate(`/${NavigationSection.Home}`, { replace: true });
  };


  useEffect(() => {
    const currentPathname = location.pathname;
    const currentHash = location.hash; 
    
    let effectivePath = currentHash.startsWith("#/") ? currentHash.substring(1) : currentPathname;
    if (effectivePath.startsWith('/')) effectivePath = effectivePath.substring(1);

    setIsSimulatorPage(effectivePath === NavigationSection.Simulador);


    let sectionName = "Início"; 
    const navItem = NAV_ITEMS.find(item => item.section === effectivePath);

    if (navItem) {
        sectionName = navItem.label;
    } else if (effectivePath.startsWith(`${NavigationSection.AdminPanel}/collaborator/`)) {
        sectionName = "Detalhes do Colaborador";
    }
    
    if (sectionName && sectionName !== 'Início') {
      document.title = `Geniunm - ${sectionName}`;
    } else {
      document.title = 'Geniunm - Treinamento de Consultores';
    }

    if (currentUser?.type === 'admin') {
      const isAdminRelatedPath = effectivePath === NavigationSection.AdminPanel || 
                                 effectivePath.startsWith(`${NavigationSection.AdminPanel}/`) ||
                                 effectivePath === NavigationSection.UserManagement ||
                                 effectivePath === NavigationSection.Reports ||
                                 effectivePath === NavigationSection.PersonaCustomization; 
      if (!isAdminRelatedPath) { 
        if (effectivePath !== NavigationSection.Home) {
            navigate(`/${NavigationSection.AdminPanel}`, { replace: true });
        }
      }
    }
  }, [location, currentUser, navigate]);
  
  const appContainerClass = `min-h-screen flex text-[var(--color-text)] ${currentUser ? 'flex-row' : 'flex-col'}`;
  const mainContentAreaClass = `flex-1 flex flex-col overflow-y-auto ${currentUser && isSimulatorPage && isSmallScreen ? 'p-0' : 'p-4 md:p-6 lg:p-8'}`;
  
  const contentWrapperClass = currentUser 
    ? (isSimulatorPage ? 'flex-grow w-full' : 'flex-grow container mx-auto w-full') 
    : 'flex-grow flex flex-col items-center justify-center w-full';


  return (
    <div className={appContainerClass}>
      {currentUser && ( 
        <>
          <button
            className="fixed top-3 left-3 z-40 md:hidden themed-button !p-2 !px-3 !rounded-md !bg-[var(--color-surface)] !text-[var(--color-text)] !border-[var(--color-border)] hover:!bg-[var(--color-border)]"
            onClick={toggleMobileMenu}
            aria-label="Abrir menu"
            aria-expanded={isMobileMenuOpen}
          >
            <i className="fas fa-bars text-lg"></i>
          </button>
          {isMobileMenuOpen && isSmallScreen && (
            <div
              className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={toggleMobileMenu}
              aria-label="Fechar menu"
            ></div>
          )}
          <Sidebar
            onNavigate={handleNavigate} 
            onGeniunmTextClick={handleGeniunmTextClick}
            currentUser={currentUser}
            onLogout={handleLogout}
            isMobileMenuOpen={isMobileMenuOpen} 
          />
        </>
      )}
      <main className={mainContentAreaClass}>
        <div className={contentWrapperClass}>
            <ScrollToSection />
            <Routes>
            <Route 
                path={`/${NavigationSection.Home}`} 
                element={ 
                  currentUser?.type === 'admin' ? <Navigate to={`/${NavigationSection.AdminPanel}`} replace /> :
                  <HomeSection 
                    currentUser={currentUser} 
                    onAdminLogin={handleAdminLogin}
                    onSimpleLogin={handleSimpleLogin}
                    simpleUserList={simpleUserList} 
                    onGoogleLoginPlaceholder={handleGoogleLoginPlaceholder}
                  />
                } 
            />
            
            <Route element={<ProtectedRoute user={currentUser} redirectPath={`/${NavigationSection.Home}`} />}>
                <Route path={`/${NavigationSection.Flashcards}`} element={ currentUser?.type === 'admin' ? <Navigate to={`/${NavigationSection.AdminPanel}`} replace /> : <FlashcardSection />} />
                <Route path={`/${NavigationSection.Quiz}`} element={currentUser?.type === 'admin' ? <Navigate to={`/${NavigationSection.AdminPanel}`} replace /> : <QuizSection currentUser={currentUser} />} />
                <Route 
                  path={`/${NavigationSection.Simulador}`} 
                  element={currentUser?.type === 'admin' ? <Navigate to={`/${NavigationSection.AdminPanel}`} replace /> : 
                    <SimulatorSection 
                        currentUser={currentUser} 
                        bossBattleTriggerFromApp={bossBattleTriggered} 
                        onBossBattleTriggerConsumed={resetBossBattleTrigger}
                    />} 
                />
                <Route path={`/${NavigationSection.ObjectionTrainer}`} element={currentUser?.type === 'admin' ? <Navigate to={`/${NavigationSection.AdminPanel}`} replace /> : <ObjectionTrainerSection />} />
            </Route>
            
             <Route 
                path={`/${NavigationSection.AdminPanel}`} 
                element={
                    <ProtectedRoute user={currentUser} redirectPath={`/${NavigationSection.Home}`}>
                    {currentUser?.type === 'admin' ? 
                        <AdminDashboard currentUser={currentUser} /> : 
                        <Navigate to={`/${NavigationSection.Home}`} replace />}
                    </ProtectedRoute>
                } 
            />
             <Route 
                path={`/${NavigationSection.AdminPanel}/collaborator/:userId`}
                element={
                  <ProtectedRoute user={currentUser} redirectPath={`/${NavigationSection.Home}`}>
                    {currentUser?.type === 'admin' ? 
                        <CollaboratorDashboard /> : 
                        <Navigate to={`/${NavigationSection.Home}`} replace />}
                  </ProtectedRoute>
                }
              />
              <Route 
                path={`/${NavigationSection.UserManagement}`}
                element={
                  <ProtectedRoute user={currentUser} redirectPath={`/${NavigationSection.Home}`}>
                    {currentUser?.type === 'admin' ? 
                        <UserManagementPanel onUserListChange={refreshSimpleUserListFromStorage} /> : 
                        <Navigate to={`/${NavigationSection.Home}`} replace />}
                  </ProtectedRoute>
                }
              />
              <Route 
                path={`/${NavigationSection.Reports}`}
                element={
                  <ProtectedRoute user={currentUser} redirectPath={`/${NavigationSection.Home}`}>
                    {currentUser?.type === 'admin' ? 
                        <ReportsSection currentUser={currentUser}/> : 
                        <Navigate to={`/${NavigationSection.Home}`} replace />}
                  </ProtectedRoute>
                }
              />
              <Route 
                path={`/${NavigationSection.PersonaCustomization}`}
                element={
                  <ProtectedRoute user={currentUser} redirectPath={`/${NavigationSection.Home}`}>
                    {currentUser?.type === 'admin' ? 
                        <PersonaCustomizationPanel /> : 
                        <Navigate to={`/${NavigationSection.Home}`} replace />}
                  </ProtectedRoute>
                }
              />
            
            <Route path="/" element={<Navigate to={`/${NavigationSection.Home}`} replace />} />
            <Route path="*" element={<Navigate to={`/${NavigationSection.Home}`} replace />} /> 
            </Routes>
        </div>
        {currentUser && !(currentUser.type === 'admin') && <Footer onGeniunmTextClick={handleGeniunmTextClick} />}
         {currentUser && currentUser.type === 'admin' && (location.pathname.startsWith(`/${NavigationSection.AdminPanel}`) || location.pathname.startsWith(`/${NavigationSection.UserManagement}`) || location.pathname.startsWith(`/${NavigationSection.Reports}`) || location.pathname.startsWith(`/${NavigationSection.PersonaCustomization}`) || location.hash.startsWith(`#/${NavigationSection.AdminPanel}`) || location.hash.startsWith(`#/${NavigationSection.UserManagement}`) || location.hash.startsWith(`#/${NavigationSection.Reports}`) || location.hash.startsWith(`#/${NavigationSection.PersonaCustomization}`)) && <Footer />}
      </main>
    </div>
  );
};


const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
