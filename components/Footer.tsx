
import React from 'react';

interface FooterProps {
  onGeniunmTextClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onGeniunmTextClick }) => {
  return (
    <footer className="bg-[var(--color-surface)] p-5 text-center text-[var(--color-text-light)] border-t border-[var(--color-border)]">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm">
          <div className="mb-3 md:mb-0 flex items-center">
            <img src="/logo.png" alt="Logo Geniunm" className="h-6 w-6 inline-block mr-2" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <span 
              className="text-[var(--color-text)] font-medium font-display" 
              onClick={onGeniunmTextClick} 
              style={{cursor: onGeniunmTextClick ? 'pointer' : 'default'}}
              title={onGeniunmTextClick ? "Clique para uma surpresa..." : ""}
            >
                Geniunm
            </span>
          </div>
          <div className='text-xs'>
            <p>&copy; {new Date().getFullYear()} Geniunm - Todos os direitos reservados</p>
            <p className="mt-0.5">Criado pelo Coord. Gabriel R. - Polo HUB Cuiabá</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
