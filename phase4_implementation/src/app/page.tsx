'use client'

import { useRef, useEffect, useState, useCallback } from 'react';
import useFloorPlanState from '@/lib/useFloorPlan';
import FloorPlanCanvas from '@/components/FloorPlanCanvas';
import TopNavbar from '@/components/TopNavbar';
import LeftToolbar from '@/components/LeftToolbar';
import RightPanel from '@/components/RightPanel';
import BottomBar from '@/components/BottomBar';

export default function Home() {
  const state = useFloorPlanState();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [darkMode, setDarkMode] = useState(true);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Initialize with dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't capture shortcuts when typing in inputs
    const target = e.target as HTMLElement | null;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();

    if (key === 'b') {
      state.startNewPolyline();
      state.setMode('draw');
    } else if (key === 'm') {
      state.setMode('move');
    } else if (key === 'd') {
      state.setMode('delete');
    } else if (key === 'v') {
      state.setMode('select');
    } else if (key === 'g') {
      state.setShowGrid(v => !v);
    } else if (key === 'r') {
      // Force redraw by toggling zoom slightly
      state.setZoom(z => { const nz = z + 0.001; setTimeout(() => state.setZoom(z), 50); return nz; });
    } else if (key === 'escape') {
      if (state.mode === 'draw') {
        state.finishPolyline();
      }
      state.setMode('select');
      state.setSelectedPoint(null);
      state.setSelectedPoly(null);
      state.setMeasurePoints([]);
    } else if (key === 'q') {
      if (window.confirm('Are you sure you want to leave FloorPlanForge?')) {
        window.close();
      }
    } else if (key === 'z' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (e.shiftKey) {
        state.redo();
      } else {
        state.undo();
      }
    } else if (key === 'y' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      state.redo();
    } else if (key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      // Trigger save via navbar (handled there)
    }
  }, [state]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <TopNavbar state={state} darkMode={darkMode} setDarkMode={setDarkMode} canvasRef={canvasContainerRef} />
      <div className="flex flex-1 overflow-hidden">
        <LeftToolbar state={state} />
        <div ref={canvasContainerRef} className="flex-1 relative overflow-hidden bg-background">
          <FloorPlanCanvas state={state} containerRef={canvasContainerRef} />
        </div>
         <RightPanel state={state} /> 
      </div>
      <BottomBar state={state} />
    </div>
  );
}
