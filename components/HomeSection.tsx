
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import GlassCard from './ui/GlassCard'; 
import GlassButton from './ui/GlassButton';
import { AuthenticatedUser, NavigationSection } from '../types';
import { NAV_ITEMS, DEFAULT_SIMPLE_USER_PASSWORD } from '../constants';

interface HomeSectionProps {
  currentUser: AuthenticatedUser;
  onAdminLogin: (password: string) => boolean;
  onSimpleLogin: (username: string, password: string) => boolean;
  simpleUserList: string[];
  onGoogleLoginPlaceholder: () => void;
}

const HomeSection: React.FC<HomeSectionProps> = ({ 
  currentUser, 
  onAdminLogin, 
  onSimpleLogin, 
  simpleUserList, 
  onGoogleLoginPlaceholder 
}) => {
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const [simpleUsername, setSimpleUsername] = useState(simpleUserList[0] || '');
  const [simplePassword, setSimplePassword] = useState('');
  const [simpleLoginError, setSimpleLoginError] = useState('');

  const handleAdminLoginAttempt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onAdminLogin(adminPassword)) {
      setAdminLoginError('');
      setAdminPassword('');
      setShowAdminLogin(false);
    } else {
      setAdminLoginError('Senha de Admin incorreta.');
      setAdminPassword(''); 
    }
  };

  const handleSimpleLoginAttempt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onSimpleLogin(simpleUsername, simplePassword)) {
      setSimpleLoginError('');
      setSimplePassword('');
    } else {
      setSimpleLoginError('Usuário ou senha simplificada incorretos.');
      setSimplePassword('');
    }
  };


  if (!currentUser) {
    return (
      <section id="login-home" className="py-8 flex-grow flex items-center justify-center w-full">
        <GlassCard className="p-6 md:p-8 max-w-md w-full"> {/* themed-surface */}
          <div className="text-center mb-6">
            <img src="/logo.png" alt="Geniunm Logo" className="w-20 h-20 mx-auto mb-3" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <h2 className="font-display text-3xl md:text-4xl text-[var(--color-primary)] mb-1">Bem-vindo(a)</h2>
            <p className="text-[var(--color-text-light)] text-sm">
              Plataforma de Treinamento Geniunm.
            </p>
          </div>

          {/* Simple Login Form - Primary */}
          <form onSubmit={handleSimpleLoginAttempt} className="mb-5">
            <h3 className="text-lg font-medium text-[var(--color-text)] mb-3">Login Simplificado</h3>
            <div className="mb-3">
              <label htmlFor="simple-username" className="block text-xs font-medium text-[var(--color-text-light)] mb-1">Usuário:</label>
              <select
                id="simple-username"
                className="themed-input themed-select w-full !text-sm"
                value={simpleUsername}
                onChange={(e) => {setSimpleUsername(e.target.value); setSimpleLoginError('');}}
                disabled={simpleUserList.length === 0}
              >
                {simpleUserList.length > 0 ? simpleUserList.map(user => <option key={user} value={user}>{user}</option>) : <option value="">Nenhum usuário</option>}
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="simple-password" className="block text-xs font-medium text-[var(--color-text-light)] mb-1">Senha:</label>
              <input
                type="password"
                id="simple-password"
                className="themed-input w-full !text-sm"
                value={simplePassword}
                onChange={(e) => {setSimplePassword(e.target.value); setSimpleLoginError('');}}
                placeholder="******"
                required
              />
            </div>
            {simpleLoginError && (
              <p className="text-xs text-[var(--error)] mb-3 text-center bg-[rgba(var(--error-rgb),0.1)] p-1.5 rounded-md border border-[rgba(var(--error-rgb),0.2)]">{simpleLoginError}</p>
            )}
            <GlassButton type="submit" className="w-full !py-2.5" disabled={simpleUserList.length === 0}> {/* themed-button */}
              Entrar
            </GlassButton>
          </form>

          <div className="my-4 text-center">
            <span className="text-xs text-[var(--color-text-light)] uppercase">Ou</span>
          </div>
          
          {/* Admin and Google Login - Secondary */}
          <div className="space-y-2.5">
            <GlassButton 
              onClick={() => { setShowAdminLogin(prev => !prev); setAdminLoginError(''); setAdminPassword('');}}
              className="w-full !py-2 !text-sm !bg-[var(--color-input-bg)] hover:!bg-[var(--color-border)] !text-[var(--color-text)] !border-[var(--color-border)]"
            >
              <i className="fas fa-user-shield mr-2 text-[var(--color-accent)]"></i>Acesso Administrativo
            </GlassButton>

            {showAdminLogin && (
              <form onSubmit={handleAdminLoginAttempt} className="mt-2 pt-2 border-t border-[var(--color-border)]">
                <div className="mb-2">
                  <label htmlFor="admin-password" className="block text-xs font-medium text-[var(--color-text-light)] mb-1">Senha Admin:</label>
                  <input
                    type="password"
                    id="admin-password"
                    className="themed-input w-full !text-sm"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="********"
                    required
                    autoFocus
                  />
                </div>
                {adminLoginError && (
                  <p className="text-xs text-[var(--error)] mb-2 text-center bg-[rgba(var(--error-rgb),0.1)] p-1.5 rounded-md border border-[rgba(var(--error-rgb),0.2)]">{adminLoginError}</p>
                )}
                <GlassButton type="submit" className="w-full !py-2 !text-sm !bg-[rgba(var(--color-primary-rgb),0.85)] hover:!bg-[var(--color-primary)]">
                  Entrar como Admin
                </GlassButton>
              </form>
            )}

            <GlassButton 
              onClick={onGoogleLoginPlaceholder}
              className="w-full !py-2 !text-sm !bg-[var(--color-input-bg)] hover:!bg-[var(--color-border)] !text-[var(--color-text)] !border-[var(--color-border)] flex items-center justify-center"
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google G" className="w-4 h-4 mr-2" />
              Entrar com Google (Demonstração)
            </GlassButton>
          </div>
           <p className="text-xs text-[var(--color-text-light)] mt-5 text-center">
             <strong>Nota:</strong> Senha padrão para usuários simplificados é "{DEFAULT_SIMPLE_USER_PASSWORD}", a menos que alterada pelo admin.
           </p>
        </GlassCard>
      </section>
    );
  }

  const getIconForSection = (section: NavigationSection): string => {
    switch (section) {
        case NavigationSection.Flashcards: return "fa-layer-group";
        case NavigationSection.Quiz: return "fa-question-circle";
        case NavigationSection.Simulador: return "fa-comments";
        case NavigationSection.ObjectionTrainer: return "fa-microphone-alt";
        case NavigationSection.AdminPanel: return "fa-tachometer-alt";
        case NavigationSection.UserManagement: return "fa-users-cog";
        default: return "fa-arrow-right";
    }
  };

  const welcomeNavItems = NAV_ITEMS.filter(item => item.section !== NavigationSection.Home && 
    (item.adminOnly ? currentUser?.type === 'admin' : true)
  );

  return (
    <section id="home" className="py-8">
      <GlassCard className="text-center p-6 md:p-10"> {/* themed-surface */}
        <img src="/logo.png" alt="Geniunm Logo" className="w-24 h-24 mx-auto mb-4" onError={(e) => (e.currentTarget.style.display = 'none')} />
        <h1 className="section-title !text-3xl md:!text-4xl !text-center !border-b-0"> {/* Center title on welcome, remove border */}
          Olá, {currentUser.type === 'admin' ? currentUser.username : 
                  currentUser.type === 'simple' ? currentUser.username : 
                  currentUser.type === 'google' ? currentUser.name : 'Usuário'}!
        </h1>
        <p className="text-lg text-[var(--color-text-light)] mb-8">
          Bem-vindo(a) de volta à Plataforma de Treinamento Geniunm. Escolha uma ferramenta abaixo para começar.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-xl mx-auto">
          {welcomeNavItems.map(item => (
            <Link 
                key={item.section} 
                to={item.href.startsWith('#') ? item.href.substring(1) : item.href}
                className="block"
            >
              <GlassButton className="w-full h-full text-md py-4 transition transform hover:scale-105 hover:shadow-lg !font-medium"> {/* themed-button */}
                <i className={`fas ${getIconForSection(item.section)} mr-2.5 text-[var(--color-primary-dark)] opacity-70`}></i>
                {item.label}
              </GlassButton>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-sm text-[var(--color-text-light)]">
          "O sucesso é a soma de pequenos esforços repetidos dia após dia."
        </p>
      </GlassCard>
    </section>
  );
};

export default HomeSection;
