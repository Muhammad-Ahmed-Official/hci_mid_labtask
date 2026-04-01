import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MousePointer2, Pencil, Move, Trash2, Ruler, Grid3X3,
  ZoomIn, Undo2, Download, Save, FolderOpen, Magnet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type SectionProps = {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
};

const Section = ({ icon: Icon, title, children }: SectionProps) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-primary" />
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
    <div className="space-y-1.5 pl-6">{children}</div>
  </div>
);

type StepProps = {
  keys: string[];
  description: string;
};

const Step = ({ keys, description }: StepProps) => (
  <div className="flex items-start gap-2 text-xs text-muted-foreground">
    <div className="flex items-center gap-1 shrink-0 mt-0.5">
      {keys.map((k, i) => (
        <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">{k}</Badge>
      ))}
    </div>
    <span className="leading-relaxed">{description}</span>
  </div>
);

type GuideModalProps = {
  open: boolean;
  onClose: (open: boolean) => void;
};

export default function GuideModal({ open, onClose }: GuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-[10px]">FP</span>
            </div>
            FloorPlanForge — User Guide
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">

          <Section icon={Pencil} title="Drawing Walls & Rooms">
            <Step keys={['B']} description="Switch to Draw mode." />
            <Step keys={['Click']} description="Place each corner point of your wall or room." />
            <Step keys={['Click', '1st point']} description="Click near the first point to close the shape into a room." />
            <Step keys={['Dbl-click']} description="Double-click to finish an open wall without closing it." />
            <Step keys={['Esc']} description="Cancel / finish drawing and switch back to Select mode." />
          </Section>

          <Separator />

          <Section icon={MousePointer2} title="Selecting & Editing">
            <Step keys={['V']} description="Switch to Select mode. Click a point to select it." />
            <Step keys={['M']} description="Switch to Move mode. Click and drag any point to reposition it." />
            <Step keys={['D']} description="Switch to Delete mode. Click any point to remove it." />
            <Step keys={['Right panel']} description="When a room or wall is selected, edit its label and color in the right panel." />
          </Section>

          <Separator />

          <Section icon={Ruler} title="Measure Tool">
            <Step keys={['R']} description="Switch to Measure mode." />
            <Step keys={['Click', 'Click']} description="Click two points on the canvas to see the distance between them in meters." />
          </Section>

          <Separator />

          <Section icon={ZoomIn} title="Navigation">
            <Step keys={['Scroll']} description="Zoom in and out (centered on cursor)." />
            <Step keys={['Alt', 'Drag']} description="Pan the canvas. Also works with middle mouse button drag." />
          </Section>

          <Separator />

          <Section icon={Grid3X3} title="Grid & Snapping">
            <Step keys={['G']} description="Toggle the grid on/off." />
            <Step keys={['Magnet icon']} description="Toggle snap-to-grid. Points will snap to grid intersections when enabled." />
          </Section>

          <Separator />

          <Section icon={Undo2} title="Undo / Redo">
            <Step keys={['Ctrl', 'Z']} description="Undo the last action." />
            <Step keys={['Ctrl', 'Y']} description="Redo the last undone action." />
          </Section>

          <Separator />

          <Section icon={Save} title="File Management">
            <Step keys={['New']} description="Start a fresh empty project (you'll be asked to confirm)." />
            <Step keys={['Save']} description="Download your project as a .json file to your computer." />
            <Step keys={['Load']} description="Open a previously saved .json project file." />
            <Step keys={['Export PNG']} description="Save the current canvas view as an image." />
          </Section>

        </div>
      </DialogContent>
    </Dialog>
  );
}
