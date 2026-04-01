import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { FloorPlanState } from '@/lib/useFloorPlan';

const modeLabels: Record<string, string> = {
  select: 'Select',
  draw: 'Drawing Wall',
  move: 'Move Point',
  delete: 'Delete Point',
  measure: 'Measure',
};

// const shortcuts = [
//   { key: 'B', action: 'Draw' },
//   { key: 'M', action: 'Move' },
//   { key: 'D', action: 'Delete' },
//   { key: 'V', action: 'Select' },
//   { key: 'G', action: 'Grid' },
//   { key: 'Esc', action: 'Finish' },
// ];

export default function BottomBar({ state }: { state: FloorPlanState }) {
  const { mode, zoom, polylines } = state;
  const roomCount = polylines.filter(p => p.closed).length;
  const wallCount = polylines.filter(p => !p.closed).length;

  return (
    <div className="h-8 border-t border-border bg-card flex items-center justify-between px-3 select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${mode === 'draw' ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
          <span className="text-[11px] font-medium text-foreground">{modeLabels[mode]}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {roomCount} rooms · {wallCount} walls
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* <div className="hidden md:flex items-center gap-1.5">
          {shortcuts.map(s => (
            <div key={s.key} className="flex items-center gap-0.5">
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-mono">{s.key}</Badge>
              <span className="text-[10px] text-muted-foreground">{s.action}</span>
            </div>
          ))}
        </div> */}
        <span className="text-[10px] font-mono text-muted-foreground">
          {(zoom * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}