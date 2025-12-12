import { useState, useRef, useCallback } from 'react';
import { Move } from 'lucide-react';

interface ImagePositionPickerProps {
  imageUrl: string;
  position: string;
  onChange: (position: string) => void;
}

export const ImagePositionPicker = ({ imageUrl, position, onChange }: ImagePositionPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Parse position string like "50% 30%" to { x: 50, y: 30 }
  const parsePosition = (pos: string) => {
    const parts = pos.split(' ');
    return {
      x: parseInt(parts[0]) || 50,
      y: parseInt(parts[1]) || 50,
    };
  };

  const { x, y } = parsePosition(position);

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const newY = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

    onChange(`${Math.round(newX)}% ${Math.round(newY)}%`);
  }, [onChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updatePosition(e.clientX, e.clientY);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX, e.clientY);
  }, [isDragging, updatePosition]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Move className="h-4 w-4" />
        <span>Arraste para ajustar o ponto focal da imagem</span>
      </div>
      
      <div
        ref={containerRef}
        className="relative w-full h-48 rounded-xl overflow-hidden cursor-crosshair border-2 border-dashed border-border hover:border-primary transition-colors"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background image showing full image */}
        <img
          src={imageUrl}
          alt="Prévia da posição"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          style={{ objectPosition: '50% 50%' }}
          draggable={false}
        />
        
        {/* Overlay showing what will be visible */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3/4 h-3/4 rounded-lg overflow-hidden shadow-2xl border-2 border-white/50">
            <img
              src={imageUrl}
              alt="Área visível"
              className="w-full h-full object-cover"
              style={{ objectPosition: position }}
              draggable={false}
            />
          </div>
        </div>

        {/* Focal point indicator */}
        <div
          className="absolute w-8 h-8 -ml-4 -mt-4 pointer-events-none"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <div className={`w-full h-full rounded-full border-4 ${isDragging ? 'border-primary scale-125' : 'border-white'} shadow-lg transition-all duration-150 flex items-center justify-center bg-primary/30`}>
            <div className="w-2 h-2 rounded-full bg-white shadow-inner" />
          </div>
        </div>

        {/* Crosshair lines */}
        <div
          className="absolute left-0 right-0 h-px bg-white/30 pointer-events-none"
          style={{ top: `${y}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-white/30 pointer-events-none"
          style={{ left: `${x}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Posição: {position}</span>
        <button
          type="button"
          onClick={() => onChange('50% 50%')}
          className="text-primary hover:underline"
        >
          Centralizar
        </button>
      </div>
    </div>
  );
};
