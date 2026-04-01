import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MousePointer2, Pencil, Move, Trash2, Grid3X3, Ruler, Magnet,
} from 'lucide-react';
import type { FloorPlanState } from '@/lib/useFloorPlan';

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { id: 'draw', icon: Pencil, label: 'Draw Wall', shortcut: 'B' },
  { id: 'move', icon: Move, label: 'Move Point', shortcut: 'M' },
  { id: 'delete', icon: Trash2, label: 'Delete Point', shortcut: 'D' },
  { id: 'measure', icon: Ruler, label: 'Measure', shortcut: '' },
];

export default function LeftToolbar({ state }: { state: FloorPlanState }) {
  const { mode, setMode, showGrid, setShowGrid, snapToGridEnabled, setSnapToGridEnabled,
    startNewPolyline } = state;

  const handleToolClick = (toolId: string) => {
    if (toolId === 'draw') {
      startNewPolyline();
    }
    setMode(toolId as import('@/lib/floorPlanUtils').Mode);
  };

  return (
    <div className="w-12 border-r border-border bg-card flex flex-col items-center py-3 gap-1 select-none">
      <TooltipProvider delayDuration={200}>
        {tools.map(tool => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleToolClick(tool.id)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150
                  ${mode === tool.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
              >
                <tool.icon className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {tool.label} {tool.shortcut && <span className="opacity-60 ml-1">[{tool.shortcut}]</span>}
            </TooltipContent>
          </Tooltip>
        ))}

        <div className="w-6 border-t border-border my-2" />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150
                ${showGrid
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            Grid {showGrid ? 'On' : 'Off'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setSnapToGridEnabled(!snapToGridEnabled)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150
                ${snapToGridEnabled
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
              <Magnet className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            Snap to Grid {snapToGridEnabled ? 'On' : 'Off'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}