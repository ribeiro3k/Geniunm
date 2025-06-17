
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';
import { NavigationSection, AuthenticatedUser } from '../types';
import GlassButton from './ui/GlassButton';

interface SidebarProps {
  onNavigate: (section: NavigationSection) => void;
  onGeniunmTextClick?: () => void;
  currentUser: AuthenticatedUser;
  onLogout: () => void;
  isMobileMenuOpen: boolean; // New prop
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onNavigate, 
  onGeniunmTextClick, 
  currentUser, 
  onLogout,
  isMobileMenuOpen 
}) => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<NavigationSection>(NavigationSection.Home);

  useEffect(() => {
    const hashSection = location.hash.substring(2); 
    const pathSection = location.pathname.substring(1);
    const currentPath = hashSection || pathSection || NavigationSection.Home;
    setActiveSection(currentPath as NavigationSection);
  }, [location]);

  const handleNavClick = (section: NavigationSection) => {
    onNavigate(section); // This now primarily closes mobile menu if open
  };

  const NavLinkItem: React.FC<{ item: typeof NAV_ITEMS[0], iconClass: string }> = ({ item, iconClass }) => (
     <Link
        to={item.href.startsWith('#') ? item.href.substring(1) : item.href}
        className={`nav-link ${activeSection === item.section ? 'active' : ''}`}
        onClick={() => handleNavClick(item.section)}
        aria-current={activeSection === item.section ? 'page' : undefined}
        title={item.label}
    >
        <i className={`fas ${iconClass}`}></i>
        <span>{item.label}</span>
    </Link>
  );

  const getUserDisplayName = () => {
    if (!currentUser) return '';
    if (currentUser.type === 'admin') return 'Admin';
    if (currentUser.type === 'simple') return currentUser.username;
    if (currentUser.type === 'google') return currentUser.name.split(' ')[0]; // First name for Google user
    return '';
  };
  
  const getIconForSection = (section: NavigationSection): string => {
    switch (section) {
        case NavigationSection.Home: return "fa-home";
        case NavigationSection.Flashcards: return "fa-layer-group";
        case NavigationSection.Quiz: return "fa-question-circle";
        case NavigationSection.Simulador: return "fa-comments";
        case NavigationSection.ObjectionTrainer: return "fa-microphone-alt";
        default: return "fa-circle-notch";
    }
  };

  const sidebarBaseClasses = "w-64 bg-[var(--color-surface)] shadow-xl flex flex-col h-screen border-r border-[var(--color-border)] transition-transform duration-300 ease-in-out";
  const mobileClasses = `fixed inset-y-0 left-0 z-30 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`;
  const desktopClasses = "md:sticky md:translate-x-0 md:flex-shrink-0";


  return (
    <aside className={`${sidebarBaseClasses} ${mobileClasses} ${desktopClasses}`}>
      {/* Sidebar Header */}
      <div className="p-6 text-center border-b border-[var(--color-border)]">
        <Link to={`/${NavigationSection.Home}`} onClick={() => handleNavClick(NavigationSection.Home)} className="inline-block">
            <img 
              src="/logo.png" 
              alt="Logo Geniunm" 
              className="h-16 w-16 mx-auto mb-2 transition-transform hover:scale-110" 
              onError={(e) => (e.currentTarget.style.display = 'none')} 
            />
        </Link>
        <h1 
          className="text-2xl font-semibold text-[var(--color-primary)] font-display"
          onClick={onGeniunmTextClick} 
          style={{cursor: onGeniunmTextClick ? 'pointer' : 'default'}}
          title={onGeniunmTextClick ? "Clique para uma surpresa..." : ""}
        >
          Geniunm
        </h1>
        <p className="text-xs text-[var(--color-text-light)]">Treinamento de Consultores</p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => (
          <NavLinkItem key={item.section} item={item} iconClass={getIconForSection(item.section)} />
        ))}
      </nav>

      {/* User Info & Logout */}
      {currentUser && (
        <div className="p-4 mt-auto border-t border-[var(--color-border)]">
          <div className="flex items-center mb-3">
            {/* Simple avatar based on user type */}
            <div className="w-10 h-10 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-lg font-medium mr-3">
              {currentUser.type === 'admin' ? 'A' : 
               currentUser.type === 'simple' ? currentUser.username.charAt(0).toUpperCase() : 
               currentUser.type === 'google' ? currentUser.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text)] leading-tight">{getUserDisplayName()}</p>
              <p className="text-xs text-[var(--color-text-light)] leading-tight">
                {currentUser.type === 'admin' ? 'Administrador' : currentUser.type === 'simple' ? 'Usuário Teste' : currentUser.email}
              </p>
            </div>
          </div>
          <GlassButton 
            onClick={onLogout} 
            className="w-full !text-sm !py-2 !bg-[rgba(var(--color-primary-rgb),0.15)] !text-[var(--color-primary)] hover:!bg-[rgba(var(--color-primary-rgb),0.25)] !border-[rgba(var(--color-primary-rgb),0.2)]"
            title="Sair da plataforma"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>Sair
          </GlassButton>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
