import React, { useEffect, useRef, useState } from 'react';
import { SimulationEvent } from '@agent';
import { ChevronDown, ChevronUp, Minus } from 'lucide-react';

interface CompactTelemetryProps {
  events: ReadonlyArray<SimulationEvent>;
  virtualTimeMs: number;
}

/** Returns a brief one-line pedagogical summary for the most recent event */
function getLatestExplanation(events: ReadonlyArray<SimulationEvent>): string {
  if (events.length === 0) {
    return 'Simulation ready. Use the Control Deck to send frames and observe protocol behaviour.';
  }
  const evt = events[events.length - 1];
  const d = evt.details ?? {};
  switch (evt.type) {
    case 'SIMULATION_STARTED':
      return `Simulation started (${d.protocol}). Sender and receiver initialised.`;
    case 'FRAME_TRANSMITTED':
      return `Host A transmitted DATA #${d.seqNum} ("${d.payload ?? ''}") → entering DATA lane.`;
    case 'FRAME_DELIVERED':
      return `Host B accepted DATA #${d.seqNum} in-order → emitting ACK #${d.seqNum}.`;
    case 'FRAME_DROPPED':
      return `DATA #${d.seqNum} dropped in channel ✗ — ARQ timer still counting.`;
    case 'FRAME_BUFFERED':
      return `DATA #${d.seqNum} out-of-order at Host B — buffered (Selective Repeat).`;
    case 'ACK_TRANSMITTED':
      return `Host B sent ACK #${d.ackNum} → entering ACK lane back to Host A.`;
    case 'ACK_DELIVERED':
      return `Host A received ACK #${d.ackNum} → sliding window base advances.`;
    case 'ACK_DROPPED':
      return `ACK #${d.ackNum} lost in channel ✗ — Host A will time out and retransmit.`;
    case 'TIMEOUT':
      return d.isManual
        ? `Manual timeout triggered! Host A will retransmit unacknowledged frames.`
        : `Retransmission timer expired at ${evt.virtualTimestamp} ms — Host A retransmitting.`;
    case 'RETRANSMISSION':
      return `Retransmitting DATA #${d.seqNum} (attempt ${d.attempt ?? 1}) back into the channel.`;
    case 'SENDER_WINDOW_SLID':
      return `Sender window slid forward — base pointer advanced, freeing window capacity.`;
    case 'PAYLOAD_DELIVERED':
      return `Application layer received "${d.payload ?? ''}" in sequential order ✓`;
    case 'PACKET_DELAYED':
      return `Packet delayed +${d.additionalMs ?? 0} ms by channel fault injection.`;
    default:
      return d.description || evt.type;
  }
}

/** Minimal space-time SVG diagram showing last N events as ladder bounce lines with vivid markers */
function SpaceTimeMini({ events, virtualTimeMs }: { events: ReadonlyArray<SimulationEvent>; virtualTimeMs: number }) {
  const svgWidth = 560;
  const svgHeight = 84;
  const paddingX = 54;
  const lineWidth = svgWidth - paddingX * 2;

  const relevantEvents = events.filter(
    (e) =>
      e.type === 'FRAME_TRANSMITTED' ||
      e.type === 'FRAME_DELIVERED' ||
      e.type === 'ACK_TRANSMITTED' ||
      e.type === 'ACK_DELIVERED' ||
      e.type === 'FRAME_DROPPED' ||
      e.type === 'ACK_DROPPED' ||
      e.type === 'TIMEOUT' ||
      e.type === 'RETRANSMISSION'
  );
  const recent = relevantEvents.slice(-18);
  const totalTime = Math.max(virtualTimeMs, 100);

  const eventToX = (ts: number) => paddingX + (ts / totalTime) * lineWidth;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Background timeline grid lines */}
      <line x1={paddingX} y1={20} x2={svgWidth - paddingX} y2={20} stroke="#0284c7" strokeWidth="2" strokeOpacity="0.7" />
      <text x={8} y={24} fontSize="9" fontWeight="bold" fill="#38bdf8" fontFamily="monospace">Host A</text>

      <line x1={paddingX} y1={64} x2={svgWidth - paddingX} y2={64} stroke="#10b981" strokeWidth="2" strokeOpacity="0.7" />
      <text x={8} y={68} fontSize="9" fontWeight="bold" fill="#34d399" fontFamily="monospace">Host B</text>

      {/* Trajectories */}
      {recent.map((evt, i) => {
        const x = Math.min(eventToX(evt.virtualTimestamp), svgWidth - paddingX);
        const isData = evt.type === 'FRAME_TRANSMITTED' || evt.type === 'FRAME_DELIVERED' || evt.type === 'FRAME_DROPPED';
        const isAck = evt.type === 'ACK_TRANSMITTED' || evt.type === 'ACK_DELIVERED' || evt.type === 'ACK_DROPPED';
        const isTimeout = evt.type === 'TIMEOUT' || evt.type === 'RETRANSMISSION';
        const dropped = evt.type === 'FRAME_DROPPED' || evt.type === 'ACK_DROPPED';

        if (isData) {
          const y1 = 20, y2 = dropped ? 42 : 64;
          return (
            <g key={`${evt.id}-${i}`}>
              <line
                x1={x} y1={y1} x2={x + (dropped ? 18 : 26)} y2={y2}
                stroke={dropped ? '#ef4444' : '#0284c7'}
                strokeWidth={dropped ? '2' : '2'}
                strokeDasharray={dropped ? '4,3' : undefined}
                markerEnd={dropped ? undefined : 'url(#arrowData)'}
                strokeOpacity={0.9}
              />
              {dropped && (
                <g transform={`translate(${x + 16}, ${y2 - 2})`}>
                  <rect x="-1" y="-8" width="38" height="12" rx="3" fill="#ef4444" />
                  <text x="3" y="1" fontSize="7.5" fontWeight="bold" fill="#ffffff" fontFamily="monospace">✕ LOST</text>
                </g>
              )}
            </g>
          );
        }
        if (isAck) {
          const y1 = 64, y2 = dropped ? 42 : 20;
          return (
            <g key={`${evt.id}-${i}`}>
              <line
                x1={x} y1={y1} x2={x + (dropped ? 16 : 24)} y2={y2}
                stroke={dropped ? '#ef4444' : '#ea580c'}
                strokeWidth={dropped ? '2' : '2'}
                strokeDasharray={dropped ? '4,3' : undefined}
                markerEnd={dropped ? undefined : 'url(#arrowAck)'}
                strokeOpacity={0.9}
              />
              {dropped && (
                <g transform={`translate(${x + 14}, ${y2 - 2})`}>
                  <rect x="-1" y="-8" width="40" height="12" rx="3" fill="#ef4444" />
                  <text x="2" y="1" fontSize="7.5" fontWeight="bold" fill="#ffffff" fontFamily="monospace">✕ ACK LOST</text>
                </g>
              )}
            </g>
          );
        }
        if (isTimeout) {
          return (
            <g key={`${evt.id}-${i}`}>
              <line
                x1={x} y1={10} x2={x} y2={74}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="3,3"
                strokeOpacity={0.8}
              />
              <rect x={x - 18} y={2} width="36" height="11" rx="2" fill="#991b1b" stroke="#ef4444" strokeWidth="0.5" />
              <text x={x - 14} y={10} fontSize="7" fontWeight="bold" fill="#fecaca" fontFamily="monospace">TIMEOUT</text>
            </g>
          );
        }
        return null;
      })}

      {/* High-visibility Arrow Markers */}
      <defs>
        <marker id="arrowData" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
        </marker>
        <marker id="arrowAck" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#f97316" />
        </marker>
      </defs>
    </svg>
  );
}

export const CompactTelemetry: React.FC<CompactTelemetryProps> = ({ events, virtualTimeMs }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const latestExplanation = getLatestExplanation(events);
  const explanationRef = useRef<HTMLDivElement>(null);

  // Flash animation key for new events
  const [flashKey, setFlashKey] = useState(0);
  useEffect(() => {
    setFlashKey((k) => k + 1);
  }, [events.length]);

  if (minimised) {
    return (
      <div className="border-t border-white/10 bg-[#0d1424]/90 backdrop-blur-md px-4 py-2 flex items-center justify-between gap-4">
        <span className="text-xs text-sky-300 font-mono font-medium truncate">{latestExplanation}</span>
        <button
          type="button"
          onClick={() => setMinimised(false)}
          className="shrink-0 text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer font-bold"
        >
          <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
          Open Telemetry Strip
        </button>
      </div>
    );
  }

  return (
    <div
      className={`border-t border-white/10 bg-[#0d1424]/95 backdrop-blur-xl flex flex-col transition-all z-20 shadow-2xl ${
        collapsed ? 'h-10' : 'h-[190px]'
      }`}
    >
      {/* Dockable Strip Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/40 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-xs text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="uppercase tracking-wider">Ladder Bounce Space-Time Diagram</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400 font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
            {events.length} events logged
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={collapsed ? 'Expand Diagram' : 'Collapse Diagram'}
          >
            {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMinimised(true)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Minimise to bottom ticker"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Space-Time diagram canvas */}
          <div className="flex-1 px-4 py-2 overflow-hidden flex items-center bg-[#0a0f1d]/50">
            <SpaceTimeMini events={events} virtualTimeMs={virtualTimeMs} />
          </div>

          {/* Natural language explanation ticker */}
          <div className="w-[340px] shrink-0 border-l border-white/10 px-4 py-2.5 flex flex-col justify-between overflow-hidden bg-black/30">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 flex items-center justify-between">
                <span>Protocol Explanation Ticker</span>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
              </div>
              <div
                key={flashKey}
                ref={explanationRef}
                className="text-xs text-white font-medium leading-relaxed p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-inner"
                style={{ animation: 'fadeSlideIn 0.25s ease-out' }}
              >
                {latestExplanation}
              </div>
            </div>

            {events.length > 1 && (
              <div className="text-[10px] text-slate-400 font-mono pt-1.5 flex items-center justify-between border-t border-white/5">
                <span>PREVIOUS EVENT:</span>
                <span className="text-sky-300 font-bold">
                  {(() => {
                    const prev = events[events.length - 2];
                    if (!prev) return '—';
                    return prev.type.replace(/_/g, ' ');
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

