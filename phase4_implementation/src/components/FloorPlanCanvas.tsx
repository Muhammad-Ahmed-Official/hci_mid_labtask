import React, { useRef, useEffect, useCallback, RefObject } from 'react';
import {
  GRID_SIZE, POINT_RADIUS, WALL_THICKNESS, CLOSE_THRESHOLD,
  snapToGrid, distance, findClosestPoint, screenToCanvas,
  calculatePolygonArea, getPolygonCentroid, getSegmentLength,
  ClosestPoint, Point,
} from '@/lib/floorPlanUtils';
import type { FloorPlanState } from '@/lib/useFloorPlan';

type Props = {
  state: FloorPlanState;
  containerRef: RefObject<HTMLDivElement | null>;
};

export default function FloorPlanCanvas({ state, containerRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPanning = useRef<boolean>(false);
  const isDragging = useRef<boolean>(false);
  const lastMouse = useRef<Point>({ x: 0, y: 0 });
  const dragTarget = useRef<ClosestPoint | null>(null);
  const hoverPos = useRef<Point | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const {
    polylines, activePolyIndex, selectedPoint, mode, zoom, pan,
    showGrid, snapToGridEnabled, measurePoints,
    setPan, setZoom, setSelectedPoint, setSelectedPoly,
    addPointToActive, closeActivePolyline, finishPolyline,
    movePoint, commitMove, deletePoint, setMode, setActivePolyIndex,
  } = state;

  // Drawing
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Grid
    if (showGrid) {
      const gridSize = GRID_SIZE;
      const startX = Math.floor(-pan.x / zoom / gridSize) * gridSize;
      const startY = Math.floor(-pan.y / zoom / gridSize) * gridSize;
      const endX = startX + w / zoom + gridSize * 2;
      const endY = startY + h / zoom + gridSize * 2;

      ctx.strokeStyle = 'rgba(128, 140, 160, 0.12)';
      ctx.lineWidth = 0.5 / zoom;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();

      // Major grid lines every 5
      ctx.strokeStyle = 'rgba(128, 140, 160, 0.25)';
      ctx.lineWidth = 1 / zoom;
      ctx.beginPath();
      const majorSize = gridSize * 5;
      const mStartX = Math.floor(-pan.x / zoom / majorSize) * majorSize;
      const mStartY = Math.floor(-pan.y / zoom / majorSize) * majorSize;
      for (let x = mStartX; x <= endX; x += majorSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = mStartY; y <= endY; y += majorSize) {
        ctx.moveTo(mStartX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    }

    // Draw polylines
    polylines.forEach((poly, pi) => {
      const pts = poly.points;
      if (pts.length === 0) return;

      // Fill closed polygon
      if (poly.closed && pts.length >= 3) {
        ctx.fillStyle = poly.fillColor || 'rgba(56, 189, 248, 0.12)';
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fill();
      }

      // Draw walls
      ctx.strokeStyle = poly.color || '#3b82f6';
      ctx.lineWidth = WALL_THICKNESS / zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (pts.length > 1) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        if (poly.closed) ctx.closePath();
        ctx.stroke();
      }

      // Draw wall length labels
      for (let i = 0; i < pts.length - (poly.closed ? 0 : 1); i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        const len = getSegmentLength(p1, p2);
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        const fontSize = Math.max(9, 11 / zoom);
        ctx.font = `500 ${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${len}m`, mx, my - 6 / zoom);
      }

      // Draw points
      pts.forEach((pt, pti) => {
        const isSelected = selectedPoint?.polyIndex === pi && selectedPoint?.ptIndex === pti;
        const isActive = pi === activePolyIndex;
        const r = (isSelected ? POINT_RADIUS + 2 : POINT_RADIUS) / zoom;

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#f59e0b' : isActive ? '#22d3ee' : poly.color || '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5 / zoom;
        ctx.stroke();
      });

      // Room label + area
      if (poly.closed && pts.length >= 3) {
        const centroid = getPolygonCentroid(pts);
        const area = calculatePolygonArea(pts);
        const fontSize = Math.max(12, 14 / zoom);

        ctx.font = `600 ${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = poly.color || '#3b82f6';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(poly.label || `Room ${pi + 1}`, centroid.x, centroid.y - 10 / zoom);

        ctx.font = `400 ${fontSize * 0.8}px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
        ctx.fillText(`${area.toFixed(1)} m²`, centroid.x, centroid.y + 12 / zoom);
      }
    });

    // Draw active polyline preview (line from last point to cursor)
    if (mode === 'draw' && activePolyIndex >= 0 && hoverPos.current) {
      const activePoly = polylines[activePolyIndex];
      if (activePoly && activePoly.points.length > 0) {
        const lastPt = activePoly.points[activePoly.points.length - 1];
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([6 / zoom, 4 / zoom]);
        ctx.beginPath();
        ctx.moveTo(lastPt.x, lastPt.y);
        ctx.lineTo(hoverPos.current.x, hoverPos.current.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Measure tool line
    if (mode === 'measure' && measurePoints.length > 0) {
      const pts = measurePoints;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);

      if (pts.length === 2) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.stroke();
        const len = getSegmentLength(pts[0], pts[1]);
        const mx = (pts[0].x + pts[1].x) / 2;
        const my = (pts[0].y + pts[1].y) / 2;
        ctx.font = `600 ${14 / zoom}px Inter, sans-serif`;
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.fillText(`${len}m`, mx, my - 10 / zoom);
      } else if (hoverPos.current) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(hoverPos.current.x, hoverPos.current.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [polylines, activePolyIndex, selectedPoint, mode, zoom, pan, showGrid, measurePoints]);

  // Resize
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef?.current ?? canvas?.parentElement;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [draw, containerRef]);

  // Redraw on state change
  useEffect(() => {
    draw();
  }, [draw]);

  // Animation loop for smooth hover preview
  useEffect(() => {
    const loop = () => {
      draw();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  const getCanvasPos = useCallback((e: MouseEvent | React.MouseEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    let pos = screenToCanvas(sx, sy, pan, zoom);
    if (snapToGridEnabled) {
      pos = snapToGrid(pos.x, pos.y);
    }
    return pos;
  }, [pan, zoom, snapToGridEnabled]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const pos = getCanvasPos(e);

    if (mode === 'draw') {
      if (activePolyIndex >= 0) {
        const activePoly = polylines[activePolyIndex];
        // Check if clicking near first point to close
        if (activePoly.points.length >= 3) {
          const firstPt = activePoly.points[0];
          if (distance(pos, firstPt) < CLOSE_THRESHOLD / zoom) {
            closeActivePolyline();
            return;
          }
        }
        addPointToActive(pos);
      }
    } else if (mode === 'move') {
      const closest = findClosestPoint(pos, polylines, 20 / zoom);
      if (closest) {
        isDragging.current = true;
        dragTarget.current = closest;
        setSelectedPoint({ polyIndex: closest.polyIndex, ptIndex: closest.ptIndex });
        setSelectedPoly(closest.polyIndex);
      }
    } else if (mode === 'delete') {
      const closest = findClosestPoint(pos, polylines, 20 / zoom);
      if (closest) {
        deletePoint(closest.polyIndex, closest.ptIndex);
      }
    } else if (mode === 'select') {
      const closest = findClosestPoint(pos, polylines, 20 / zoom);
      if (closest) {
        setSelectedPoint({ polyIndex: closest.polyIndex, ptIndex: closest.ptIndex });
        setSelectedPoly(closest.polyIndex);
      } else {
        setSelectedPoint(null);
        setSelectedPoly(null);
      }
    } else if (mode === 'measure') {
      if (measurePoints.length === 0) {
        state.setMeasurePoints([pos]);
      } else if (measurePoints.length === 1) {
        state.setMeasurePoints([measurePoints[0], pos]);
      } else {
        state.setMeasurePoints([pos]);
      }
    }
  }, [mode, activePolyIndex, polylines, zoom, getCanvasPos, addPointToActive,
    closeActivePolyline, deletePoint, setSelectedPoint, setSelectedPoly, measurePoints, state]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    let pos = screenToCanvas(sx, sy, pan, zoom);
    if (snapToGridEnabled) pos = snapToGrid(pos.x, pos.y);
    hoverPos.current = pos;

    if (isPanning.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (isDragging.current && dragTarget.current) {
      movePoint(dragTarget.current.polyIndex, dragTarget.current.ptIndex, pos);
    }
  }, [pan, zoom, snapToGridEnabled, setPan, movePoint]);

  const handleMouseUp = useCallback(() => {
    if (isPanning.current) {
      isPanning.current = false;
    }
    if (isDragging.current) {
      isDragging.current = false;
      dragTarget.current = null;
      commitMove();
    }
  }, [commitMove]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));

    // Zoom toward cursor
    const newPanX = mx - (mx - pan.x) * (newZoom / zoom);
    const newPanY = my - (my - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [zoom, pan, setZoom, setPan]);

  const handleDoubleClick = useCallback(() => {
    if (mode === 'draw' && activePolyIndex >= 0) {
      const poly = polylines[activePolyIndex];
      if (poly.points.length >= 3) {
        closeActivePolyline();
      } else {
        finishPolyline();
      }
    }
  }, [mode, activePolyIndex, polylines, closeActivePolyline, finishPolyline]);

  const getCursorClass = () => {
    if (mode === 'draw') return 'cursor-crosshair';
    if (mode === 'move') return 'cursor-move';
    if (mode === 'measure') return 'cursor-crosshair';
    return '';
  };

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block ${getCursorClass()}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
