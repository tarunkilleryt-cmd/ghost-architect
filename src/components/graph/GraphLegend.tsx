import { Badge } from '@/components/ui/badge';

export function GraphLegend() {
  return (
    <div className="absolute bottom-4 right-4 z-10 rounded-lg bg-card/95 p-4 shadow-lg backdrop-blur-sm border">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Legend
      </h4>
      
      <div className="space-y-3">
        {/* Importance levels */}
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Importance</span>
          <div className="flex flex-wrap gap-1.5">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--node-critical))' }} />
              <span className="text-xs">Critical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--node-high))' }} />
              <span className="text-xs">High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--node-medium))' }} />
              <span className="text-xs">Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--node-low))' }} />
              <span className="text-xs">Low</span>
            </div>
          </div>
        </div>

        {/* Edge types */}
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Connections</span>
          <div className="flex flex-wrap gap-1.5">
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-4 rounded" style={{ backgroundColor: 'hsl(var(--edge-import))' }} />
              <span className="text-xs">Import</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-4 rounded" style={{ backgroundColor: 'hsl(var(--edge-inheritance))' }} />
              <span className="text-xs">Inheritance</span>
            </div>
          </div>
        </div>

        {/* Interaction hints */}
        <div className="pt-2 border-t border-border text-xs text-muted-foreground space-y-1">
          <p>• Click nodes to see details</p>
          <p>• Scroll to zoom</p>
          <p>• Drag to pan</p>
        </div>
      </div>
    </div>
  );
}
