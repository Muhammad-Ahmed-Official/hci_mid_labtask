// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Button } from '@/components/ui/button';
// import { Separator } from '@/components/ui/separator';
// import { Badge } from '@/components/ui/badge';
// import { Trash2 } from 'lucide-react';
// import { ROOM_COLORS, calculatePolygonArea, getSegmentLength, distance } from '@/lib/floorPlanutils';

// export default function RightPanel({ state }) {
//   const { polylines, selectedPoly, selectedPoint, updatePolylineProps, deletePolyline } = state;

//   const poly = selectedPoly !== null && selectedPoly >= 0 ? polylines[selectedPoly] : null;

//   if (!poly) {
//     return (
//       <div className="w-56 border-l border-border bg-card p-4 select-none hidden lg:flex flex-col">
//         <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Properties</h3>
//         <p className="text-xs text-muted-foreground leading-relaxed">
//           Select a wall or room to view and edit its properties.
//         </p>
//         <Separator className="my-4" />
//         <div className="space-y-2">
//           <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Guide</h4>
//           <p className="text-xs text-muted-foreground leading-relaxed">
//             • Press <Badge variant="secondary" className="text-[10px] px-1 py-0">B</Badge> to start drawing walls
//           </p>
//           <p className="text-xs text-muted-foreground leading-relaxed">
//             • Click near the first point to close a room
//           </p>
//           <p className="text-xs text-muted-foreground leading-relaxed">
//             • Double-click to finish an open wall
//           </p>
//           <p className="text-xs text-muted-foreground leading-relaxed">
//             • Alt + drag or middle-click to pan
//           </p>
//           <p className="text-xs text-muted-foreground leading-relaxed">
//             • Scroll to zoom in/out
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const area = poly.closed ? calculatePolygonArea(poly.points) : null;
//   const perimeter = poly.points.reduce((sum, pt, i) => {
//     if (i === 0) return 0;
//     return sum + distance(poly.points[i - 1], pt);
//   }, 0) + (poly.closed && poly.points.length > 1 ? distance(poly.points[poly.points.length - 1], poly.points[0]) : 0);
//   const perimeterM = (perimeter / 20).toFixed(2);

//   const selectedPt = selectedPoint ? poly.points[selectedPoint.ptIndex] : null;

//   return (
//     <div className="w-56 border-l border-border bg-card p-4 select-none hidden lg:flex flex-col gap-4 overflow-y-auto">
//       <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
//         {poly.closed ? 'Room Properties' : 'Wall Properties'}
//       </h3>

//       {/* Label */}
//       <div className="space-y-1.5">
//         <Label className="text-xs text-muted-foreground">Label</Label>
//         <Input
//           value={poly.label || ''}
//           onChange={(e) => updatePolylineProps(selectedPoly, { label: e.target.value })}
//           placeholder="e.g. Living Room"
//           className="h-8 text-xs"
//         />
//       </div>

//       {/* Color */}
//       <div className="space-y-1.5">
//         <Label className="text-xs text-muted-foreground">Wall Color</Label>
//         <div className="flex items-center gap-2">
//           <input
//             type="color"
//             value={poly.color || '#3b82f6'}
//             onChange={(e) => updatePolylineProps(selectedPoly, { color: e.target.value })}
//             className="w-8 h-8 rounded cursor-pointer border-0"
//           />
//           <span className="text-xs font-mono text-muted-foreground">{poly.color || '#3b82f6'}</span>
//         </div>
//       </div>

//       {/* Room Color */}
//       {poly.closed && (
//         <div className="space-y-1.5">
//           <Label className="text-xs text-muted-foreground">Room Color</Label>
//           <div className="grid grid-cols-4 gap-1.5">
//             {ROOM_COLORS.map((rc, i) => (
//               <button
//                 key={i}
//                 onClick={() => updatePolylineProps(selectedPoly, {
//                   fillColor: rc.fill,
//                   roomColorIndex: i,
//                 })}
//                 className={`w-8 h-8 rounded-md border-2 transition-all ${
//                   poly.roomColorIndex === i ? 'border-primary scale-110' : 'border-transparent'
//                 }`}
//                 style={{ backgroundColor: rc.stroke + '33' }}
//               />
//             ))}
//           </div>
//         </div>
//       )}

//       <Separator />

//       {/* Stats */}
//       <div className="space-y-2">
//         <Label className="text-xs text-muted-foreground">Info</Label>
//         <div className="grid grid-cols-2 gap-2 text-xs">
//           <div className="bg-muted rounded-md p-2">
//             <div className="text-muted-foreground">Points</div>
//             <div className="font-semibold">{poly.points.length}</div>
//           </div>
//           <div className="bg-muted rounded-md p-2">
//             <div className="text-muted-foreground">Perimeter</div>
//             <div className="font-semibold">{perimeterM}m</div>
//           </div>
//           {area !== null && (
//             <div className="bg-muted rounded-md p-2 col-span-2">
//               <div className="text-muted-foreground">Area</div>
//               <div className="font-semibold text-primary">{area.toFixed(2)} m²</div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Selected Point Coords */}
//       {selectedPt && (
//         <>
//           <Separator />
//           <div className="space-y-1.5">
//             <Label className="text-xs text-muted-foreground">Selected Point</Label>
//             <div className="flex gap-2">
//               <div className="bg-muted rounded-md p-2 flex-1 text-xs">
//                 <span className="text-muted-foreground">X: </span>
//                 <span className="font-mono font-medium">{selectedPt.x}</span>
//               </div>
//               <div className="bg-muted rounded-md p-2 flex-1 text-xs">
//                 <span className="text-muted-foreground">Y: </span>
//                 <span className="font-mono font-medium">{selectedPt.y}</span>
//               </div>
//             </div>
//           </div>
//         </>
//       )}

//       <div className="mt-auto">
//         <Button
//           variant="destructive"
//           size="sm"
//           className="w-full text-xs h-8"
//           onClick={() => deletePolyline(selectedPoly)}
//         >
//           <Trash2 className="w-3.5 h-3.5 mr-1.5" />
//           Delete {poly.closed ? 'Room' : 'Wall'}
//         </Button>
//       </div>
//     </div>
//   );
// }