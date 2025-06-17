
import React from 'react';
import { FlashcardContent } from '../../types';

interface HistoryItemProps {
  item: FlashcardContent;
  onSelect: (item: FlashcardContent) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item, onSelect }) => {
  return (
    <div 
      className="history-item themed-surface-secondary hover:bg-[rgba(var(--accent-primary-rgb),0.1)] p-2 px-3 mb-2 rounded-md text-sm text-[var(--text-primary)] cursor-pointer transition-colors duration-150 ease-in-out border border-transparent hover:border-[var(--border-color-accent)]"
      onClick={() => onSelect(item)}
      title={`Ver card: ${item.theme}`}
    >
      {item.theme}
    </div>
  );
};

export default HistoryItem;
