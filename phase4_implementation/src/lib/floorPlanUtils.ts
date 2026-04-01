
export const GRID_SIZE = 20;
export const SNAP_THRESHOLD = 10;
export const POINT_RADIUS = 6;
export const WALL_THICKNESS = 4;
export const CLOSE_THRESHOLD = 15;

export const ROOM_COLORS = [
  { name: 'Sky Blue', fill: 'rgba(56, 189, 248, 0.15)', stroke: '#38bdf8' },
  { name: 'Emerald', fill: 'rgba(52, 211, 153, 0.15)', stroke: '#34d399' },
  { name: 'Amber', fill: 'rgba(251, 191, 36, 0.15)', stroke: '#fbbf24' },
  { name: 'Rose', fill: 'rgba(251, 113, 133, 0.15)', stroke: '#fb7185' },
  { name: 'Violet', fill: 'rgba(167, 139, 250, 0.15)', stroke: '#a78bfa' },
  { name: 'Cyan', fill: 'rgba(34, 211, 238, 0.15)', stroke: '#22d3ee' },
  { name: 'Orange', fill: 'rgba(251, 146, 60, 0.15)', stroke: '#fb923c' },
  { name: 'Teal', fill: 'rgba(45, 212, 191, 0.15)', stroke: '#2dd4bf' },
];

export const DEFAULT_WALL_COLOR = '#3b82f6';

export type Point = { x: number; y: number };

export type Polyline = {
  points: Point[];
  closed: boolean;
  color: string;
  label: string;
  fillColor: string;
  roomColorIndex: number;
};

export type ClosestPoint = {
  polyIndex: number;
  ptIndex: number;
  point: Point;
  distance: number;
};

export type Mode = 'select' | 'draw' | 'move' | 'delete' | 'measure';

export function snapToGrid(x: number, y: number, gridSize: number = GRID_SIZE): Point {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
}

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

export function findClosestPoint(pos: Point, polylines: Polyline[], threshold: number = 20): ClosestPoint | null {
  let closest: ClosestPoint | null = null;
  let minDist = threshold;

  polylines.forEach((poly, polyIndex) => {
    poly.points.forEach((pt, ptIndex) => {
      const d = distance(pos, pt);
      if (d < minDist) {
        minDist = d;
        closest = { polyIndex, ptIndex, point: pt, distance: d };
      }
    });
  });

  return closest;
}

export function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  // Convert pixels to meters (assume 20px = 1m)
  const pixelsPerMeter = GRID_SIZE;
  return Math.abs(area / 2) / (pixelsPerMeter * pixelsPerMeter);
}

export function getPolygonCentroid(points: Point[]): Point {
  let cx = 0, cy = 0;
  points.forEach(p => { cx += p.x; cy += p.y; });
  return { x: cx / points.length, y: cy / points.length };
}

export function getSegmentLength(p1: Point, p2: Point): string {
  const d = distance(p1, p2);
  return (d / GRID_SIZE).toFixed(2); // in meters
}

export function screenToCanvas(screenX: number, screenY: number, pan: Point, zoom: number): Point {
  return {
    x: (screenX - pan.x) / zoom,
    y: (screenY - pan.y) / zoom,
  };
}

export function canvasToScreen(canvasX: number, canvasY: number, pan: Point, zoom: number): Point {
  return {
    x: canvasX * zoom + pan.x,
    y: canvasY * zoom + pan.y,
  };
}

export function createEmptyPolyline(color: string = DEFAULT_WALL_COLOR): Polyline {
  return {
    points: [],
    closed: false,
    color,
    label: '',
    fillColor: ROOM_COLORS[0].fill,
    roomColorIndex: 0,
  };
}

export function serializeProject(polylines: Polyline[], settings: Record<string, unknown>): string {
  return JSON.stringify({ polylines, settings, version: 1 });
}

export function deserializeProject(jsonStr: string): { polylines: Polyline[]; settings: Record<string, unknown> } {
  const data = JSON.parse(jsonStr) as { polylines?: Polyline[]; settings?: Record<string, unknown> };
  return {
    polylines: data.polylines || [],
    settings: data.settings || {},
  };
}
