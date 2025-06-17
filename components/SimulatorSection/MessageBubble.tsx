
import React from 'react';
import { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isNextMessageSameSender?: boolean; // To adjust bubble tail (not explicitly used with new simpler tails but kept for potential future use)
}

const MessageTick: React.FC<{ status: Message['status'] }> = ({ status }) => {
  if (!status || status === 'pending_send') {
    return <i className="fas fa-clock message-tick"></i>; 
  }
  if (status === 'error') {
    return <i className="fas fa-exclamation-circle message-tick"></i>;
  }
  
  if (status === 'sent') {
    return <i className="fas fa-check message-tick"></i>;
  }
  if (status === 'delivered' || status === 'read') {
    // For SaaS, often a single check or double check is fine. Read state might be indicated differently or not at all.
    // Using double check for delivered/read for now, color can differentiate.
    const iconClass = status === 'read' ? "fas fa-check-double message-tick text-[var(--color-accent)]" : "fas fa-check-double message-tick";
    return <i className={iconClass}></i>;
  }
  return null;
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const profileInitial = !message.isUser && message.senderDisplayName && !message.avatarUrl
    ? message.senderDisplayName.charAt(0).toUpperCase() 
    : null;

  const bubbleSideClasses = message.isUser ? 'ml-auto message-bubble-user' : 'mr-auto message-bubble-ai';
  const timestampAlignmentClass = message.isUser ? 'justify-end' : 'justify-start';
  
  return (
    <div className={`flex mb-2 items-end ${message.isUser ? 'justify-end' : 'justify-start'}`}>
      {!message.isUser && (message.avatarUrl || profileInitial) && (
        <div 
          className="w-8 h-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-sm font-semibold mr-2 flex-shrink-0 overflow-hidden"
          title={message.senderDisplayName}
          aria-label={`Foto de perfil de ${message.senderDisplayName}`}
        >
          {message.avatarUrl ? (
            <img src={message.avatarUrl} alt={message.senderDisplayName} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
          ) : (
            profileInitial
          )}
        </div>
      )}
       {!message.isUser && !message.avatarUrl && !profileInitial && ( // Placeholder for spacing if no avatar data
        <div className="w-8 mr-2 flex-shrink-0" />
      )}
      <div 
        className={`message-bubble-base ${bubbleSideClasses}`}
      >
        <p className="text-sm whitespace-pre-wrap">
          {message.isAudioMessage && message.isUser && (
            <i className="fas fa-microphone-alt mr-1.5 text-xs opacity-70 align-middle" title="Mensagem de áudio"></i>
          )}
          {message.text}
        </p>
        <div className={`message-bubble-timestamp flex items-center ${timestampAlignmentClass}`}>
          <span className="text-xs">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {message.isUser && message.status && (
            <MessageTick status={message.status} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;