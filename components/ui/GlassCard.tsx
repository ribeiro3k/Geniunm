
import React, { forwardRef } from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  // Allow any other div attributes like id
  [key: string]: any; 
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(({ children, className = '', onClick, ...rest }, ref) => {
  return (
    <div 
      ref={ref}
      className={`themed-surface p-6 ${className}`} // Changed from glass-card-base to themed-surface
      onClick={onClick}
      {...rest} // Spread any other props like id
    >
      {children}
    </div>
  );
});

GlassCard.displayName = 'GlassCard'; 

export default GlassCard;
