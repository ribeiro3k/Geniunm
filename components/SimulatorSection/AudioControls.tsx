
import React from 'react';
import LoadingSpinner from '../ui/LoadingSpinner'; 

interface AudioControlsProps {
  isRecording: boolean;
  isTranscribing: boolean; 
  onStartRecord: () => void;
  onStopRecord: () => void;
  disabled: boolean; 
}

const AudioControls: React.FC<AudioControlsProps> = ({ 
    isRecording, 
    isTranscribing, 
    onStartRecord, 
    onStopRecord, 
    disabled 
}) => {
  const isDisabled = disabled || isTranscribing; 

  return (
    <div 
      id="audio-controls" 
      className="flex items-center justify-center h-10 w-10" 
    >
      {!isRecording && !isTranscribing && (
        <button 
          id="record-button" 
          title="Gravar Áudio" 
          onClick={onStartRecord}
          disabled={isDisabled}
          className="text-[var(--text-primary)] hover:text-[var(--accent-primary)] disabled:text-[var(--text-secondary)] disabled:cursor-not-allowed transition-colors p-2 rounded-full flex items-center justify-center"
          aria-label="Iniciar gravação de áudio"
        >
          <i className="fas fa-microphone text-lg"></i>
        </button>
      )}
      {isRecording && !isTranscribing && (
        <button 
          id="stop-button" 
          title="Parar Gravação" 
          onClick={onStopRecord}
          className="text-[rgba(var(--error-rgb),0.9)] hover:text-[rgba(var(--error-rgb),0.7)] transition-colors p-2 rounded-full flex items-center justify-center"
          aria-label="Parar gravação de áudio"
        >
          <i className="fas fa-stop text-lg"></i>
        </button>
      )}
      {isTranscribing && (
        <div className="p-1 flex items-center justify-center">
             <LoadingSpinner size="sm" />
        </div>
      )}
      
    </div>
  );
};

export default AudioControls;
