

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';
import { NavigationSection, AuthenticatedUser, NavItem as NavItemType } from '../types';
import GlassButton from './ui/GlassButton';

interface SidebarProps {
  onNavigate: (section: NavigationSection) => void;
  onGeniunmTextClick?: () => void;
  currentUser: AuthenticatedUser;
  onLogout: () => void;
  isMobileMenuOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onNavigate, 
  onGeniunmTextClick, 
  currentUser, 
  onLogout,
  isMobileMenuOpen
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<NavigationSection>(NavigationSection.Home);

  useEffect(() => {
    const hashSection = location.hash.substring(2); 
    const pathSection = location.pathname.substring(1);
    const currentPath = hashSection || pathSection || NavigationSection.Home;
    
    setActiveSection(currentPath as NavigationSection);

  }, [location]);


  const handleNavClick = (section: NavigationSection) => {
    onNavigate(section); // This mainly closes mobile menu
    // Actual navigation handled by Link components
  };

  const NavLinkItem: React.FC<{ item: NavItemType }> = ({ item }) => {
    const baseClasses = `nav-link`;
    const isActive = activeSection === item.section;
    
    return (
     <Link
        to={item.href.startsWith('#') ? item.href.substring(1) : item.href}
        className={`${baseClasses} ${isActive ? 'active' : ''}`}
        onClick={() => handleNavClick(item.section)}
        aria-current={isActive ? 'page' : undefined}
        title={item.label}
    >
        {item.icon && <i className={`fas ${item.icon}`}></i>}
        <span>{item.label}</span>
    </Link>
    );
  };

  const getUserDisplayName = () => {
    if (!currentUser) return '';
    if (currentUser.type === 'admin') return currentUser.username;
    if (currentUser.type === 'simple') return currentUser.username;
    if (currentUser.type === 'google') return currentUser.name.split(' ')[0]; 
    return '';
  };
  
  const sidebarBaseClasses = "w-64 bg-[var(--color-surface)] shadow-xl flex flex-col h-screen border-r border-[var(--color-border)] transition-transform duration-300 ease-in-out";
  const mobileClasses = `fixed inset-y-0 left-0 z-30 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`;
  const desktopClasses = "md:sticky md:translate-x-0 md:flex-shrink-0";

  const visibleNavItems = useMemo(() => {
    if (currentUser?.type === 'admin') {
        return NAV_ITEMS.filter(item => 
            item.section === NavigationSection.AdminPanel || 
            item.section === NavigationSection.UserManagement ||
            item.section === NavigationSection.Reports ||
            item.section === NavigationSection.PersonaCustomization
        );
    }
    return NAV_ITEMS.filter(item => !item.adminOnly);
  }, [currentUser]);


  return (
    <aside className={`${sidebarBaseClasses} ${mobileClasses} ${desktopClasses}`}>
      {/* Sidebar Header */}
      <div className="p-6 text-center border-b border-[var(--color-border)]">
        <Link 
            to={currentUser?.type === 'admin' ? `/${NavigationSection.AdminPanel}` : `/${NavigationSection.Home}`} 
            onClick={() => handleNavClick(currentUser?.type === 'admin' ? NavigationSection.AdminPanel : NavigationSection.Home)} 
            className="inline-block"
        >
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
        {visibleNavItems.map((item) => (
          <NavLinkItem key={item.section} item={item} />
        ))}
      </nav>

      {/* User Info & Logout */}
      {currentUser && (
        <div className="p-4 mt-auto border-t border-[var(--color-border)]">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-lg font-medium mr-3">
              {currentUser.type === 'admin' ? currentUser.username.charAt(0).toUpperCase() : 
               currentUser.type === 'simple' ? currentUser.username.charAt(0).toUpperCase() : 
               currentUser.type === 'google' ? currentUser.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text)] leading-tight">{getUserDisplayName()}</p>
              <p className="text-xs text-[var(--color-text-light)] leading-tight">
                {currentUser.type === 'admin' ? 'Administrador' : currentUser.type === 'simple' ? 'Usuário Simplificado' : currentUser.type === 'google' ? currentUser.email : 'Visitante'}
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
