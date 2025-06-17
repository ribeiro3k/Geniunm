
import React from 'react';
import GlassCard from '../ui/GlassCard'; // Renders as themed-surface

interface SortableItemProps {
  id: string;
  text: string;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd: (event: React.DragEvent<HTMLDivElement>) => void;
  isDragging?: boolean;
  className?: string; // To allow feedback styling from parent
}

const SortableItem: React.FC<SortableItemProps> = ({ 
    id, 
    text, 
    onDragStart, 
    onDragOver, 
    onDrop, 
    onDragEnd,
    isDragging,
    className 
}) => {
  return (
    // GlassCard applies .themed-surface by default. Additional classes are for drag state and feedback.
    <GlassCard
      id={id}
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onDragOver={(e) => onDragOver(e, id)}
      onDrop={(e) => onDrop(e, id)}
      onDragEnd={onDragEnd}
      className={`sortable-item p-4 cursor-grab ${isDragging ? 'dragging' : ''} ${className || ''}`}
    >
      <p className="text-[var(--text-primary)]">{text}</p>
    </GlassCard>
  );
};

export default SortableItem;
