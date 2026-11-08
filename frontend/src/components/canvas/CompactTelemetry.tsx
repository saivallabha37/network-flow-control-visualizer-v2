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

/** Minimal space-time SVG diagram showing last N events as ladder bounce lines */
function SpaceTimeMini({ events, virtualTimeMs }: { events: ReadonlyArray<SimulationEvent>; virtualTimeMs: number }) {
  const svgWidth = 500;
  const svgHeight = 72;
  const paddingX = 48;
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
  const recent = relevantEvents.slice(-16);
  const totalTime = Math.max(virtualTimeMs, 100);

  const eventToX = (ts: number) => paddingX + (ts / totalTime) * lineWidth;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Sender line */}
      <line x1={paddingX} y1={16} x2={svgWidth - paddingX} y2={16} stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.5" />
      <text x={6} y={20} fontSize="8" fill="#818cf8" fontFamily="monospace">Host A</text>

      {/* Receiver line */}
      <line x1={paddingX} y1={56} x2={svgWidth - paddingX} y2={56} stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.5" />
      <text x={6} y={60} fontSize="8" fill="#34d399" fontFamily="monospace">Host B</text>

      {/* Event trajectories */}
      {recent.map((evt, i) => {
        const x = Math.min(eventToX(evt.virtualTimestamp), svgWidth - paddingX);
        const isData = evt.type === 'FRAME_TRANSMITTED' || evt.type === 'FRAME_DELIVERED' || evt.type === 'FRAME_DROPPED';
        const isAck = evt.type === 'ACK_TRANSMITTED' || evt.type === 'ACK_DELIVERED' || evt.type === 'ACK_DROPPED';
        const isTimeout = evt.type === 'TIMEOUT' || evt.type === 'RETRANSMISSION';
        const dropped = evt.type === 'FRAME_DROPPED' || evt.type === 'ACK_DROPPED';

        if (isData) {
          const y1 = 16, y2 = dropped ? 36 : 56;
          return (
            <g key={`${evt.id}-${i}`}>
              <line
                x1={x} y1={y1} x2={x + (dropped ? 16 : 20)} y2={y2}
                stroke={dropped ? '#f43f5e' : '#6366f1'}
                strokeWidth="1.5"
                strokeDasharray={dropped ? '3,2' : undefined}
                markerEnd={dropped ? undefined : 'url(#arrowData)'}
                strokeOpacity={0.8}
              />
              {dropped && (
                <text x={x + 18} y={y2 + 4} fontSize="8" fill="#f43f5e" fontFamily="monospace">✕</text>
              )}
            </g>
          );
        }
        if (isAck) {
          const y1 = 56, y2 = dropped ? 36 : 16;
          return (
            <g key={`${evt.id}-${i}`}>
              <line
                x1={x} y1={y1} x2={x - (dropped ? 12 : 16)} y2={y2}
                stroke={dropped ? '#f59e0b' : '#06b6d4'}
                strokeWidth="1.5"
                strokeDasharray={dropped ? '3,2' : undefined}
                strokeOpacity={0.8}
              />
              {dropped && (
                <text x={x - 20} y={y2 + 4} fontSize="8" fill="#f59e0b" fontFamily="monospace">✕</text>
              )}
            </g>
          );
        }
        if (isTimeout) {
          return (
            <line
              key={`${evt.id}-${i}`}
              x1={x} y1={8} x2={x} y2={64}
              stroke="#f43f5e"
              strokeWidth="1"
              strokeDasharray="2,2"
              strokeOpacity={0.5}
            />
          );
        }
        return null;
      })}

      {/* Arrow markers */}
      <defs>
        <marker id="arrowData" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#6366f1" />
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
      <div className="border-t border-slate-800 bg-slate-900/80 px-4 py-2 flex items-center justify-between gap-4">
        <span className="text-[11px] text-slate-400 font-mono truncate">{latestExplanation}</span>
        <button
          type="button"
          onClick={() => setMinimised(false)}
          className="shrink-0 text-[10px] text-slate-500 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <ChevronUp className="w-3 h-3" />
          Show Telemetry
        </button>
      </div>
    );
  }

  return (
    <div
      className={`border-t border-slate-800 bg-slate-900/90 flex flex-col transition-all ${collapsed ? 'h-10' : 'h-48'}`}
    >
      {/* Strip header */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-800/60 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
            Space-Time Diagram · Event Telemetry
          </span>
          <span className="font-mono text-[10px] text-slate-500">{events.length} events</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setMinimised(true)}
            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
            title="Minimise to ticker"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Space-Time diagram */}
          <div className="flex-1 px-4 py-2 overflow-hidden flex items-center">
            <SpaceTimeMini events={events} virtualTimeMs={virtualTimeMs} />
          </div>

          {/* Pedagogical ticker */}
          <div className="w-80 shrink-0 border-l border-slate-800 px-4 py-2 flex flex-col justify-center overflow-hidden">
            <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1 font-semibold">What just happened</div>
            <div
              key={flashKey}
              ref={explanationRef}
              className="text-[11px] text-slate-200 leading-relaxed font-medium"
              style={{ animation: 'fadeSlideIn 0.3s ease' }}
            >
              {latestExplanation}
            </div>
            {events.length > 1 && (
              <div className="mt-2 text-[10px] text-slate-500 font-mono border-t border-slate-800 pt-2">
                Previous: {(() => {
                  const prev = events[events.length - 2];
                  if (!prev) return '—';
                  return prev.type.replace(/_/g, ' ').toLowerCase();
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

