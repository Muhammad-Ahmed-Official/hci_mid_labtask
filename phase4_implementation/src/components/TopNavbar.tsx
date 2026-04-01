import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FilePlus, Save, FolderOpen, Download, Undo2, Redo2, Sun, Moon, BookOpen,
} from 'lucide-react';
import { serializeProject, deserializeProject } from '@/lib/floorPlanUtils';
import GuideModal from './GuideModal';

export default function TopNavbar({ state, darkMode, setDarkMode, canvasRef } : any) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGuide, setShowGuide] = useState(false);

  const handleNew = () => {
    if (state.polylines.length > 0) {
      if (!window.confirm('Start a new project? Unsaved changes will be lost.')) return;
    }
    state.clearAll();
  };

  const handleSave = () => {
    const data = serializeProject(state.polylines, {
      zoom: state.zoom,
      pan: state.pan,
      showGrid: state.showGrid,
    });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'floorplan.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = (e:any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = deserializeProject(ev.target?.result as string);
      state.loadProject(data);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportPNG = () => {
    const canvas = canvasRef?.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'floorplan.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const NavButton = ({ icon: Icon, label, onClick, shortcut }:any) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {label} {shortcut && <span className="ml-1 opacity-60">{shortcut}</span>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="h-12 border-b border-border bg-card flex items-center justify-between px-3 select-none">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-xs">FP</span>
        </div>
        <span className="font-semibold text-sm tracking-tight hidden sm:block">FloorPlanForge</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        <NavButton icon={FilePlus} label="New" onClick={handleNew} />
        <NavButton icon={Save} label="Save" onClick={handleSave} shortcut="Ctrl+S" />
        <NavButton icon={FolderOpen} label="Load" onClick={() => fileInputRef.current?.click()} />
        <NavButton icon={Download} label="Export PNG" onClick={handleExportPNG} />
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleLoad} className="hidden" />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <NavButton icon={Undo2} label="Undo" onClick={state.undo} shortcut="Ctrl+Z" />
        <NavButton icon={Redo2} label="Redo" onClick={state.redo} shortcut="Ctrl+Y" />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <Button
          variant="default"
          size="sm"
          onClick={() => setShowGuide(true)}
          className="h-8 gap-1.5 text-xs font-medium"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Guide</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDarkMode(!darkMode)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </Button>
      </div>

      <GuideModal open={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}