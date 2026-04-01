import { useState, useCallback, useRef, Dispatch, SetStateAction } from 'react';
import { createEmptyPolyline, ROOM_COLORS, Polyline, Point, Mode } from './floorPlanUtils';

const MAX_HISTORY = 50;

type SelectedPoint = { polyIndex: number; ptIndex: number };

type ProjectSettings = {
  zoom?: number;
  pan?: Point;
  showGrid?: boolean;
};

export default function useFloorPlanState() {
  const [polylines, setPolylines] = useState<Polyline[]>([]);
  const [activePolyIndex, setActivePolyIndex] = useState<number>(-1);
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null);
  const [selectedPoly, setSelectedPoly] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>('select');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [snapToGridEnabled, setSnapToGridEnabled] = useState<boolean>(true);
  const [measurePoints, setMeasurePoints] = useState<Point[]>([]);

  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const pushHistory = useCallback((newPolylines: Polyline[]) => {
    const serialized = JSON.stringify(newPolylines);
    // Trim future history
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(serialized);
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    }
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const updatePolylines = useCallback((newPolylines: Polyline[], addToHistory = true) => {
    setPolylines(newPolylines);
    if (addToHistory) {
      pushHistory(newPolylines);
    }
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prev = JSON.parse(historyRef.current[historyIndexRef.current]) as Polyline[];
      setPolylines(prev);
      setActivePolyIndex(-1);
      setSelectedPoint(null);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const next = JSON.parse(historyRef.current[historyIndexRef.current]) as Polyline[];
      setPolylines(next);
      setActivePolyIndex(-1);
      setSelectedPoint(null);
    }
  }, []);

  const startNewPolyline = useCallback((color?: string) => {
    if (polylines.length >= 100) return;
    const newPoly = createEmptyPolyline(color);
    const newPolylines = [...polylines, newPoly];
    updatePolylines(newPolylines);
    setActivePolyIndex(newPolylines.length - 1);
    setMode('draw');
  }, [polylines, updatePolylines]);

  const addPointToActive = useCallback((point: Point) => {
    if (activePolyIndex < 0 || activePolyIndex >= polylines.length) return;
    const newPolylines = polylines.map((p, i) => {
      if (i !== activePolyIndex) return p;
      return { ...p, points: [...p.points, point] };
    });
    updatePolylines(newPolylines);
  }, [activePolyIndex, polylines, updatePolylines]);

  const closeActivePolyline = useCallback(() => {
    if (activePolyIndex < 0) return;
    const poly = polylines[activePolyIndex];
    if (poly.points.length < 3) return;

    const colorIdx = activePolyIndex % ROOM_COLORS.length;
    const newPolylines = polylines.map((p, i) => {
      if (i !== activePolyIndex) return p;
      return {
        ...p,
        closed: true,
        label: p.label || `Room ${activePolyIndex + 1}`,
        fillColor: ROOM_COLORS[colorIdx].fill,
        roomColorIndex: colorIdx,
      };
    });
    updatePolylines(newPolylines);
    setActivePolyIndex(-1);
    setMode('select');
  }, [activePolyIndex, polylines, updatePolylines]);

  const finishPolyline = useCallback(() => {
    setActivePolyIndex(-1);
    setMode('select');
  }, []);

  const movePoint = useCallback((polyIndex: number, ptIndex: number, newPos: Point) => {
    const newPolylines = polylines.map((p, i) => {
      if (i !== polyIndex) return p;
      const newPoints = p.points.map((pt, j) => (j === ptIndex ? newPos : pt));
      return { ...p, points: newPoints };
    });
    setPolylines(newPolylines); // Don't push history on every drag frame
  }, [polylines]);

  const commitMove = useCallback(() => {
    pushHistory(polylines);
  }, [polylines, pushHistory]);

  const deletePoint = useCallback((polyIndex: number, ptIndex: number) => {
    let newPolylines = polylines.map((p, i) => {
      if (i !== polyIndex) return p;
      const newPoints = p.points.filter((_, j) => j !== ptIndex);
      return { ...p, points: newPoints, closed: newPoints.length < 3 ? false : p.closed };
    });
    // Remove polylines with no points
    newPolylines = newPolylines.filter(p => p.points.length > 0);
    updatePolylines(newPolylines);
    setSelectedPoint(null);
  }, [polylines, updatePolylines]);

  const deletePolyline = useCallback((polyIndex: number) => {
    const newPolylines = polylines.filter((_, i) => i !== polyIndex);
    updatePolylines(newPolylines);
    setSelectedPoly(null);
    setSelectedPoint(null);
    if (activePolyIndex === polyIndex) setActivePolyIndex(-1);
  }, [polylines, updatePolylines, activePolyIndex]);

  const updatePolylineProps = useCallback((polyIndex: number, props: Partial<Polyline>) => {
    const newPolylines = polylines.map((p, i) => {
      if (i !== polyIndex) return p;
      return { ...p, ...props };
    });
    updatePolylines(newPolylines);
  }, [polylines, updatePolylines]);

  const clearAll = useCallback(() => {
    updatePolylines([]);
    setActivePolyIndex(-1);
    setSelectedPoint(null);
    setSelectedPoly(null);
    setMode('select');
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, [updatePolylines]);

  const loadProject = useCallback((data: { polylines?: Polyline[]; settings?: ProjectSettings }) => {
    setPolylines(data.polylines || []);
    pushHistory(data.polylines || []);
    setActivePolyIndex(-1);
    setSelectedPoint(null);
    setSelectedPoly(null);
    setMode('select');
    if (data.settings?.zoom) setZoom(data.settings.zoom);
    if (data.settings?.pan) setPan(data.settings.pan);
    if (data.settings?.showGrid !== undefined) setShowGrid(data.settings.showGrid);
  }, [pushHistory]);

  return {
    polylines, activePolyIndex, selectedPoint, selectedPoly, mode, zoom, pan,
    showGrid, snapToGridEnabled, measurePoints,
    setMode, setZoom, setPan, setShowGrid, setSnapToGridEnabled,
    setSelectedPoint, setSelectedPoly, setMeasurePoints,
    updatePolylines, startNewPolyline, addPointToActive, closeActivePolyline,
    finishPolyline, movePoint, commitMove, deletePoint, deletePolyline,
    updatePolylineProps, clearAll, loadProject, undo, redo,
    setActivePolyIndex,
  };
}

export type FloorPlanState = ReturnType<typeof useFloorPlanState>;
