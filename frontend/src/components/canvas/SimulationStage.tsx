import React, { useRef, useState } from 'react';
import { ProtocolType, SimulationState, SimulationEvent, InFlightPacket } from '@agent';
import {
  classifySenderSlot,
  getDualSequenceDisplay,
  deriveSenderTimers,
  deriveAckedSeqs,
  deriveReceiverBufferedSeqs,
  SlotState,
} from '../../utils/window-visuals';
import { Server, Inbox, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface InFlightBadgeProps {
  pkt: InFlightPacket;
  onDeliver: (id: string) => void;
  onDrop: (id: string) => void;
}

const InFlightBadge: React.FC<InFlightBadgeProps> = ({ pkt, onDeliver, onDrop }) => {
  const isData = pkt.type === 'DATA';
  const isDelayed = pkt.status === 'DELAYED';
  const [hovered, setHovered] = useState(false);

  // Animate from left-side to right-side based on dispatch vs scheduled times
  // We animate purely via CSS — position anchored at center of lane, drifting right/left
  const translateX = isData ? '45%' : '-45%';

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-y-1/2"
      style={{
        transform: `translateY(-50%) translateX(${translateX})`,
        transition: 'transform 0.4s cubic-bezier(.4,0,.2,1)',
        zIndex: 10,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border shadow-lg cursor-pointer select-none transition-all ${
          isData
            ? 'bg-indigo-950/90 border-indigo-500/60 text-indigo-200 hover:border-indigo-400 hover:shadow-indigo-500/30'
            : 'bg-cyan-950/90 border-cyan-500/60 text-cyan-200 hover:border-cyan-400 hover:shadow-cyan-500/30'
        } ${isDelayed ? 'ring-1 ring-amber-500/60' : ''}`}
        style={{ backdropFilter: 'blur(4px)' }}
      >
        <span className="font-mono text-[11px] font-bold">
          {isData ? `DATA #${pkt.frame.seqNum}` : `ACK #${pkt.frame.ackNum ?? 0}`}
        </span>
        {isDelayed && (
          <span className="text-[9px] font-mono px-1 py-0 rounded bg-amber-600/30 text-amber-300 border border-amber-500/40">
            +delay
          </span>
        )}

        {/* Hover action popup */}
        {hovered && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDeliver(pkt.id); }}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold shadow-lg border border-emerald-500 cursor-pointer transition-all whitespace-nowrap"
            >
              <CheckCircle2 className="w-3 h-3" />
              Deliver
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDrop(pkt.id); }}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-rose-700 hover:bg-rose-600 text-white text-[10px] font-bold shadow-lg border border-rose-500 cursor-pointer transition-all whitespace-nowrap"
            >
              <XCircle className="w-3 h-3" />
              Drop
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface WindowTrackProps {
  protocol: ProtocolType;
  seqSpace: number;
  base: number;
  nextSeq: number;
  windowSize: number;
  ackedSeqs: Set<number>;
  events: ReadonlyArray<SimulationEvent>;
  virtualTimeMs: number;
  timeoutMs: number;
  isReceiver?: boolean;
  receiverBase?: number;
  bufferedSeqs?: Set<number>;
  deliveredPayloads?: ReadonlyArray<string>;
}

const WindowTrack: React.FC<WindowTrackProps> = ({
  protocol,
  seqSpace,
  base,
  nextSeq,
  windowSize,
  ackedSeqs,
  isReceiver = false,
  receiverBase = 0,
  bufferedSeqs,
}) => {
  const slots = Array.from({ length: seqSpace }, (_, i) => i);
  const displayBase = isReceiver ? receiverBase : base;

  const getSlotStyle = (seq: number): { border: string; bg: string; text: string; badge: string; badgeBg: string } => {
    if (isReceiver) {
      const rxWindowSize = protocol === 'selective-repeat' ? windowSize : 1;
      const isExpected = seq === receiverBase;
      const inWindow = (() => {
        for (let o = 0; o < rxWindowSize; o++) {
          if ((receiverBase + o) % seqSpace === seq) return true;
        }
        return false;
      })();
      const isBuf = bufferedSeqs?.has(seq);

      if (isExpected) return {
        border: 'border-emerald-500',
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-200',
        badge: 'Rn',
        badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-500/50',
      };
      if (isBuf) return {
        border: 'border-purple-500',
        bg: 'bg-purple-500/20',
        text: 'text-purple-200',
        badge: 'BUF',
        badgeBg: 'bg-purple-950 text-purple-300 border-purple-500/50',
      };
      if (inWindow) return {
        border: 'border-cyan-500/40',
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-200',
        badge: 'OK',
        badgeBg: 'bg-cyan-950 text-cyan-400 border-cyan-500/40',
      };
      return {
        border: 'border-slate-800',
        bg: 'bg-slate-900/30',
        text: 'text-slate-600',
        badge: '—',
        badgeBg: 'bg-slate-900 text-slate-600 border-slate-800',
      };
    }

    const slotState: SlotState = classifySenderSlot(seq, base, nextSeq, windowSize, seqSpace, ackedSeqs);
    switch (slotState) {
      case 'ACKED': return {
        border: 'border-emerald-500/50',
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-200',
        badge: 'ACK',
        badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
      };
      case 'OUTSTANDING': return {
        border: 'border-amber-500',
        bg: 'bg-amber-500/15',
        text: 'text-amber-200',
        badge: 'FLY',
        badgeBg: 'bg-amber-950 text-amber-300 border-amber-500/40',
      };
      case 'READY': return {
        border: 'border-cyan-500/40',
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-200',
        badge: 'RDY',
        badgeBg: 'bg-cyan-950 text-cyan-400 border-cyan-500/40',
      };
      default: return {
        border: 'border-slate-800/60',
        bg: 'bg-slate-900/20',
        text: 'text-slate-600',
        badge: '—',
        badgeBg: 'bg-slate-900 text-slate-600 border-slate-800',
      };
    }
  };

  return (
    <div className="flex gap-1">
      {slots.map((seq) => {
        const style = getSlotStyle(seq);
        const { displayTag } = getDualSequenceDisplay(seq, displayBase, seqSpace);
        const isBase = !isReceiver && seq === base;
        const isNext = !isReceiver && seq === nextSeq;
        const isRn = isReceiver && seq === receiverBase;

        return (
          <div
            key={seq}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center rounded-lg border p-1 transition-all ${style.border} ${style.bg} ${style.text} relative`}
            style={{ minHeight: 52 }}
          >
            {/* Pointer badge */}
            {(isBase || isNext || isRn) && (
              <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-bold font-mono px-1 py-0.5 rounded border whitespace-nowrap z-10 ${
                isRn ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50' :
                isBase ? 'bg-indigo-950 text-indigo-300 border-indigo-500/50' :
                'bg-cyan-950 text-cyan-300 border-cyan-500/50'
              }`}>
                {isRn ? 'Rn' : isBase && isNext ? 'Sf=Sn' : isBase ? 'Sf' : 'Sn'}
              </div>
            )}
            <span className="font-mono font-bold text-xs">{displayTag}</span>
            <span className={`text-[8px] font-semibold mt-0.5 font-mono px-1 rounded border ${style.badgeBg}`}>
              {style.badge}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export interface SimulationStageProps {
  protocol: ProtocolType;
  engineState: SimulationState | null;
  inFlightPackets: ReadonlyArray<InFlightPacket>;
  events: ReadonlyArray<SimulationEvent>;
  virtualTimeMs: number;
  timeoutMs: number;
  onDeliverPacket: (id: string) => void;
  onDropPacket: (id: string) => void;
}

export const SimulationStage: React.FC<SimulationStageProps> = ({
  protocol,
  engineState,
  inFlightPackets,
  events,
  virtualTimeMs,
  timeoutMs,
  onDeliverPacket,
  onDropPacket,
}) => {
  const laneRef = useRef<HTMLDivElement>(null);

  if (!engineState) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <span className="text-slate-500 text-sm">Initializing engine…</span>
      </div>
    );
  }

  const { senderWindow, receiverBase, deliveredPayloads } = engineState;
  const { base, nextSeqNum: nextSeq, windowSize } = senderWindow;

  let seqSpace = 8;
  if (protocol === 'stop-and-wait') seqSpace = 2;

  const ackedSeqs = deriveAckedSeqs(protocol, events, base, windowSize, seqSpace);
  const bufferedSeqs = deriveReceiverBufferedSeqs(events);

  const { sharedTimer } = deriveSenderTimers(protocol, engineState, events, timeoutMs, virtualTimeMs);
  const timerInfo = sharedTimer.timerInfo;

  const dataPackets = inFlightPackets.filter((p) => p.type === 'DATA');
  const ackPackets = inFlightPackets.filter((p) => p.type === 'ACK');

  // Timer ring params
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const timerStroke = circumference - timerInfo.progress * circumference;
  const timerColor = timerInfo.isExpired ? '#f43f5e' : timerInfo.isWarning ? '#f59e0b' : '#06b6d4';

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#94a3b8 1px,transparent 1px),linear-gradient(90deg,#94a3b8 1px,transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative flex-1 flex flex-col p-6 gap-4 overflow-hidden">
        {/* ===== HOST A (SENDER) ===== */}
        <div className="flex gap-4 items-start">
          {/* Sender machine box */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-950 to-slate-900 border-2 border-indigo-500/50 shadow-lg shadow-indigo-900/40 flex flex-col items-center justify-center gap-1">
              <Server className="w-7 h-7 text-indigo-400" />
              <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider">Host A</span>
              <span className="text-[8px] text-indigo-500 font-mono">SENDER</span>
            </div>

            {/* Timer ring */}
            <div className="relative flex flex-col items-center">
              <svg width="52" height="52" className="-rotate-90">
                <circle cx="26" cy="26" r={radius} stroke="#1e293b" strokeWidth="4" fill="none" />
                <circle
                  cx="26" cy="26" r={radius}
                  stroke={timerColor}
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={timerStroke}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {timerInfo.isExpired
                  ? <span className="text-[9px] font-bold text-rose-400 animate-pulse">OUT</span>
                  : <span className="text-[9px] font-bold text-slate-200">{timerInfo.percentage}%</span>
                }
              </div>
              <span className="text-[9px] text-slate-500 mt-0.5 font-mono">ARQ Timer</span>
            </div>
          </div>

          {/* Sender window track */}
          <div className="flex-1 flex flex-col gap-2 mt-2">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Sender Window · [{base}…{(base + windowSize - 1) % seqSpace}] · N={windowSize}
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="text-slate-400">Sf=<strong className="text-amber-300">{base}</strong></span>
                <span className="text-slate-400">Sn=<strong className="text-cyan-300">{nextSeq}</strong></span>
                <span className="text-slate-400">M=<strong className="text-slate-300">{seqSpace}</strong></span>
              </div>
            </div>
            <div className="pt-4">
              <WindowTrack
                protocol={protocol}
                seqSpace={seqSpace}
                base={base}
                nextSeq={nextSeq}
                windowSize={windowSize}
                ackedSeqs={ackedSeqs}
                events={events}
                virtualTimeMs={virtualTimeMs}
                timeoutMs={timeoutMs}
              />
            </div>
          </div>
        </div>

        {/* ===== PHYSICAL CHANNEL ===== */}
        <div ref={laneRef} className="flex-1 flex flex-col gap-2 justify-center">
          {/* DATA lane: A → B */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">
                DATA frames · Host A <ArrowRight className="w-3 h-3 inline" /> Host B
              </span>
              <span className="ml-auto text-[10px] font-mono text-slate-500">
                {dataPackets.length > 0 ? `${dataPackets.length} in transit` : 'channel idle'}
              </span>
            </div>
            <div className="relative h-14 rounded-xl bg-slate-900/80 border border-indigo-500/20 overflow-visible"
              style={{ boxShadow: dataPackets.length > 0 ? '0 0 16px rgba(99,102,241,0.08)' : undefined }}
            >
              {/* Animated wire glow */}
              <div className="absolute inset-y-1/2 inset-x-4 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

              {dataPackets.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-600 font-mono">
                  No DATA frames · Send a frame using the Control Deck
                </div>
              ) : (
                dataPackets.map((pkt) => (
                  <InFlightBadge
                    key={pkt.id}
                    pkt={pkt}
                    onDeliver={onDeliverPacket}
                    onDrop={onDropPacket}
                  />
                ))
              )}
            </div>
          </div>

          {/* ACK lane: B → A */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold">
                ACK frames · Host B <ArrowRight className="w-3 h-3 inline" /> Host A
              </span>
              <span className="ml-auto text-[10px] font-mono text-slate-500">
                {ackPackets.length > 0 ? `${ackPackets.length} in transit` : 'channel idle'}
              </span>
            </div>
            <div
              className="relative h-14 rounded-xl bg-slate-900/80 border border-cyan-500/20 overflow-visible"
              style={{ boxShadow: ackPackets.length > 0 ? '0 0 16px rgba(6,182,212,0.08)' : undefined }}
            >
              <div className="absolute inset-y-1/2 inset-x-4 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
              {ackPackets.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-600 font-mono">
                  No ACK frames · Deliver a DATA frame at Host B to emit an ACK
                </div>
              ) : (
                ackPackets.map((pkt) => (
                  <InFlightBadge
                    key={pkt.id}
                    pkt={pkt}
                    onDeliver={onDeliverPacket}
                    onDrop={onDropPacket}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ===== HOST B (RECEIVER) ===== */}
        <div className="flex gap-4 items-start">
          {/* Receiver machine box */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-950 to-slate-900 border-2 border-emerald-500/50 shadow-lg shadow-emerald-900/40 flex flex-col items-center justify-center gap-1">
              <Inbox className="w-7 h-7 text-emerald-400" />
              <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">Host B</span>
              <span className="text-[8px] text-emerald-600 font-mono">RECEIVER</span>
            </div>

            {/* Delivered count badge */}
            <div className="text-center">
              <div className="text-lg font-black font-mono text-emerald-400">{deliveredPayloads.length}</div>
              <div className="text-[9px] text-slate-500 leading-tight">delivered</div>
            </div>
          </div>

          {/* Receiver window track */}
          <div className="flex-1 flex flex-col gap-2 mt-2">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Receiver Window · Rn={receiverBase}
                {protocol === 'selective-repeat' ? ` · N=${windowSize}` : ' · N=1'}
              </div>
              {bufferedSeqs.size > 0 && (
                <span className="text-[10px] font-mono text-purple-300">
                  Buffered: [{Array.from(bufferedSeqs).sort((a, b) => a - b).join(',')}]
                </span>
              )}
            </div>
            <div className="pt-4">
              <WindowTrack
                protocol={protocol}
                seqSpace={seqSpace}
                base={base}
                nextSeq={nextSeq}
                windowSize={windowSize}
                ackedSeqs={ackedSeqs}
                events={events}
                virtualTimeMs={virtualTimeMs}
                timeoutMs={timeoutMs}
                isReceiver
                receiverBase={receiverBase}
                bufferedSeqs={bufferedSeqs}
                deliveredPayloads={deliveredPayloads}
              />
            </div>

            {/* Delivered inbox strip */}
            {deliveredPayloads.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1 max-h-12 overflow-y-auto">
                {deliveredPayloads.map((payload, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                    <span>{payload}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};