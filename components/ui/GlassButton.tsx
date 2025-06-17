
import React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const GlassButton: React.FC<GlassButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`themed-button transition ${className}`} // Changed from glass-button-base to themed-button
      {...props}
    >
      {children}
    </button>
  );
};

export default GlassButton;
