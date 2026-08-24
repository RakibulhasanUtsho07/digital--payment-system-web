import React, { useState } from "react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];

export function OperationalHeatmap() {
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: string; events: number; errors: number } | null>(null);

  // Generate deterministic activity values for demo
  const getDensityClass = (dIdx: number, hIdx: number) => {
    const val = (dIdx * 3 + hIdx * 7) % 10;
    if (val > 7) return "bg-rose-500/80 border-rose-400"; // Spike
    if (val > 5) return "bg-amber-500/60 border-amber-400"; // Medium load
    if (val > 2) return "bg-blue-600/40 border-blue-500/50"; // Low load
    return "bg-slate-800/50 border-slate-800"; // Normal
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Operational Heatmap</h3>
          <p className="text-xs text-slate-400">Log activity & failure distribution over time</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-800 rounded-sm" /> Normal</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-600/60 rounded-sm" /> Active</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500/80 rounded-sm" /> Warnings</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500/80 rounded-sm" /> Failures</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Hours Header */}
          <div className="grid grid-cols-7 gap-1.5 mb-2 pl-12 text-[10px] text-slate-500 font-mono">
            {hours.map((h) => (
              <div key={h} className="text-center">{h}</div>
            ))}
          </div>

          {/* Grid Rows */}
          <div className="space-y-1.5">
            {days.map((day, dIdx) => (
              <div key={day} className="flex items-center gap-2">
                <span className="w-10 text-xs font-mono text-slate-400 text-right shrink-0">{day}</span>
                <div className="grid grid-cols-6 gap-1.5 flex-1">
                  {hours.map((hour, hIdx) => {
                    const events = ((dIdx + 1) * (hIdx + 1) * 821) % 4000 + 1000;
                    const errors = (dIdx * 3 + hIdx * 7) % 10 > 7 ? Math.floor(events * 0.08) : 2;

                    return (
                      <div
                        key={hour}
                        onMouseEnter={() => setHoveredCell({ day, hour, events, errors })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`h-7 rounded border transition-all cursor-pointer hover:scale-105 ${getDensityClass(dIdx, hIdx)}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip display */}
      <div className="h-6 text-xs text-slate-400 font-mono flex items-center justify-between border-t border-slate-800/80 pt-2">
        {hoveredCell ? (
          <span>{hoveredCell.day} at {hoveredCell.hour} — <strong className="text-white">{hoveredCell.events.toLocaleString()} events</strong> ({hoveredCell.errors} errors)</span>
        ) : (
          <span className="text-slate-600 italic">Hover over matrix cells to inspect event density</span>
        )}
      </div>
    </div>
  );
}
