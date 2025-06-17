
import React, { useState, useEffect, useCallback } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import LoadingSpinner from '../ui/LoadingSpinner';
import { GEMINI_SIMULATOR_PROMPT_TEMPLATE, CUSTOM_SIMULATOR_PROMPT_KEY } from '../../constants';

const PersonaCustomizationPanel: React.FC = () => {
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [editingPrompt, setEditingPrompt] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadPrompt = useCallback(() => {
    setIsLoading(true);
    const savedPrompt = localStorage.getItem(CUSTOM_SIMULATOR_PROMPT_KEY);
    const promptToUse = savedPrompt || GEMINI_SIMULATOR_PROMPT_TEMPLATE;
    setCurrentPrompt(promptToUse);
    setEditingPrompt(promptToUse); // Initialize editingPrompt as well
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadPrompt();
  }, [loadPrompt]);

  const handleEdit = () => {
    setEditingPrompt(currentPrompt); // Ensure editing starts with the current saved/default prompt
    setIsEditing(true);
    setMessage(null);
  };

  const handleSave = () => {
    if (editingPrompt.trim() === '') {
      setMessage({ type: 'error', text: 'O prompt não pode estar vazio.' });
      return;
    }
    localStorage.setItem(CUSTOM_SIMULATOR_PROMPT_KEY, editingPrompt);
    setCurrentPrompt(editingPrompt);
    setIsEditing(false);
    setMessage({ type: 'success', text: 'Prompt da IA do Simulador salvo com sucesso!' });
  };

  const handleCancel = () => {
    setEditingPrompt(currentPrompt); // Revert to last saved/default state
    setIsEditing(false);
    setMessage(null);
  };

  const handleResetToDefault = () => {
    if (window.confirm("Tem certeza que deseja redefinir o prompt para o padrão original? Esta ação não pode ser desfeita.")) {
      localStorage.removeItem(CUSTOM_SIMULATOR_PROMPT_KEY);
      setCurrentPrompt(GEMINI_SIMULATOR_PROMPT_TEMPLATE);
      setEditingPrompt(GEMINI_SIMULATOR_PROMPT_TEMPLATE);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Prompt da IA redefinido para o padrão com sucesso!' });
    }
  };


  if (isLoading) {
    return (
      <section id="persona-customization" className="py-8">
        <LoadingSpinner text="Carregando configurações do prompt..." />
      </section>
    );
  }

  return (
    <section id="persona-customization" className="py-8">
      <h1 className="section-title">Customizar IA do Simulador</h1>
      <p className="mb-6 text-[var(--color-text-light)] text-sm">
        Neste painel, você pode visualizar e alterar o prompt base que instrui a Inteligência Artificial
        utilizada nas simulações de vendas. Alterações aqui impactarão o comportamento e as avaliações da IA.
      </p>

      {message && (
        <GlassCard className={`p-3 mb-6 text-sm ${message.type === 'success' ? 'bg-[rgba(var(--success-rgb),0.15)] text-[var(--success)] border-[rgba(var(--success-rgb),0.3)]' : 'bg-[rgba(var(--error-rgb),0.15)] text-[var(--error)] border-[rgba(var(--error-rgb),0.3)]'}`}>
          {message.text}
        </GlassCard>
      )}

      <GlassCard className="p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-3 text-[var(--color-primary)]">Prompt Atual da IA do Simulador</h2>
        
        <div className="mb-4 p-3 bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-md max-h-[400px] overflow-y-auto custom-scrollbar">
          {isEditing ? (
            <textarea
              value={editingPrompt}
              onChange={(e) => setEditingPrompt(e.target.value)}
              className="themed-textarea w-full min-h-[300px] text-xs leading-relaxed font-mono"
              rows={25}
              aria-label="Campo de edição do prompt da IA"
            />
          ) : (
            <pre className="whitespace-pre-wrap text-xs leading-relaxed font-mono text-[var(--color-text-light)]">
              {currentPrompt}
            </pre>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {!isEditing ? (
            <GlassButton onClick={handleEdit} className="themed-button">
              <i className="fas fa-edit mr-2"></i>Editar Prompt
            </GlassButton>
          ) : (
            <>
              <GlassButton onClick={handleSave} className="themed-button !bg-[var(--success)] hover:!bg-[rgba(var(--success-rgb),0.8)] !border-[var(--success)]">
                <i className="fas fa-save mr-2"></i>Salvar Prompt
              </GlassButton>
              <GlassButton onClick={handleCancel} className="themed-button !bg-gray-500 hover:!bg-gray-600 !border-gray-500">
                <i className="fas fa-times mr-2"></i>Cancelar Edição
              </GlassButton>
            </>
          )}
           <GlassButton 
            onClick={handleResetToDefault} 
            className="themed-button !bg-[rgba(var(--error-rgb),0.1)] !text-[var(--error)] hover:!bg-[rgba(var(--error-rgb),0.2)] !border-transparent"
            title="Redefinir prompt para o valor padrão do sistema"
            disabled={isEditing && currentPrompt === GEMINI_SIMULATOR_PROMPT_TEMPLATE}
          >
            <i className="fas fa-undo mr-2"></i>Redefinir para Padrão
          </GlassButton>
        </div>
        <p className="text-xs text-[var(--color-text-light)] mt-4">
          <strong>Atenção:</strong> Modificar este prompt pode alterar significativamente o comportamento da IA. 
          Use as variáveis (ex: <code>{'{SCENARIO_TITLE}'}</code>, <code>{'{BEHAVIORAL_PROFILE}'}</code>) conforme documentado no prompt original
          para garantir que a IA receba o contexto correto da simulação.
        </p>
      </GlassCard>
    </section>
  );
};

export default PersonaCustomizationPanel;
