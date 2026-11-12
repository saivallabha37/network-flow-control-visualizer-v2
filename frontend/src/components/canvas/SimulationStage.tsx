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
import { Server, Inbox, CheckCircle2, XCircle } from 'lucide-react';

interface InFlightBadgeProps {
  pkt: InFlightPacket;
  onDeliver: (id: string) => void;
  onDrop: (id: string) => void;
}

const InFlightBadge: React.FC<InFlightBadgeProps> = ({ pkt, onDeliver, onDrop }) => {
  const isData = pkt.type === 'DATA';
  const isDelayed = pkt.status === 'DELAYED';
  const [hovered, setHovered] = useState(false);

  // Animate smoothly between Host A and Host B
  const translateX = isData ? '35%' : '-35%';

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-y-1/2"
      style={{
        transform: `translateY(-50%) translateX(${translateX})`,
        transition: 'transform 0.5s cubic-bezier(.4,0,.2,1)',
        zIndex: 20,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold shadow-2xl cursor-pointer select-none transition-all ${
          isData
            ? 'bg-[#0284c7] border-[#38bdf8] text-white shadow-sky-500/40 hover:scale-105'
            : 'bg-[#ea580c] border-[#f97316] text-white shadow-orange-500/40 hover:scale-105'
        } ${isDelayed ? 'ring-2 ring-amber-400' : ''}`}
        style={{
          boxShadow: isData
            ? '0 8px 24px rgba(2, 132, 199, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.4)'
            : '0 8px 24px rgba(234, 88, 12, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
        }}
      >
        <span className="font-mono text-xs">
          {isData ? `DATA #${pkt.frame.seqNum}` : `ACK #${pkt.frame.ackNum ?? 0}`}
        </span>

        {isDelayed && (
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-amber-200 border border-amber-300/40">
            +DELAY
          </span>
        )}

        {/* Action tooltip on hover */}
        {hovered && (
          <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30 bg-[#0a0f1d] p-1 rounded-xl border border-white/20 shadow-2xl">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDeliver(pkt.id); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-md cursor-pointer transition-all whitespace-nowrap"
            >
              <CheckCircle2 className="w-3 h-3" />
              Deliver
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDrop(pkt.id); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold shadow-md cursor-pointer transition-all whitespace-nowrap"
            >
              <XCircle className="w-3 h-3" />
              Drop (Lost)
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
        border: 'border-emerald-400 ring-2 ring-emerald-500/40',
        bg: 'bg-emerald-500/20 shadow-md shadow-emerald-500/20',
        text: 'text-emerald-100 font-black',
        badge: 'EXPECTED',
        badgeBg: 'bg-emerald-600 text-white font-bold',
      };
      if (isBuf) return {
        border: 'border-[#8b5cf6] ring-2 ring-[#8b5cf6]/50',
        bg: 'bg-[#8b5cf6]/30 shadow-md shadow-purple-500/30',
        text: 'text-purple-100 font-black',
        badge: 'BUFFERED',
        badgeBg: 'bg-[#8b5cf6] text-white font-bold',
      };
      if (inWindow) return {
        border: 'border-sky-500/40',
        bg: 'bg-sky-500/10',
        text: 'text-sky-200',
        badge: 'WINDOW',
        badgeBg: 'bg-sky-950 text-sky-400 border border-sky-500/30',
      };
      return {
        border: 'border-white/10',
        bg: 'bg-black/30',
        text: 'text-slate-600',
        badge: '—',
        badgeBg: 'bg-transparent text-slate-600',
      };
    }

    const slotState: SlotState = classifySenderSlot(seq, base, nextSeq, windowSize, seqSpace, ackedSeqs);
    switch (slotState) {
      case 'ACKED': return {
        border: 'border-emerald-500/60',
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-200 font-bold',
        badge: 'ACKED',
        badgeBg: 'bg-emerald-950 text-emerald-300 border border-emerald-500/40',
      };
      case 'OUTSTANDING': return {
        border: 'border-[#ea580c] ring-2 ring-[#ea580c]/50',
        bg: 'bg-[#ea580c]/25 shadow-md shadow-orange-500/30',
        text: 'text-orange-100 font-black',
        badge: 'IN-FLIGHT',
        badgeBg: 'bg-[#ea580c] text-white font-bold',
      };
      case 'READY': return {
        border: 'border-[#0284c7] ring-1 ring-sky-400/40',
        bg: 'bg-[#0284c7]/20',
        text: 'text-sky-200 font-bold',
        badge: 'READY',
        badgeBg: 'bg-[#0284c7] text-white font-bold',
      };
      default: return {
        border: 'border-white/5',
        bg: 'bg-black/30',
        text: 'text-slate-600',
        badge: '—',
        badgeBg: 'bg-transparent text-slate-600',
      };
    }
  };

  return (
    <div className="flex gap-1.5 w-full">
      {slots.map((seq) => {
        const style = getSlotStyle(seq);
        const { displayTag } = getDualSequenceDisplay(seq, displayBase, seqSpace);
        const isBase = !isReceiver && seq === base;
        const isNext = !isReceiver && seq === nextSeq;
        const isRn = isReceiver && seq === receiverBase;

        return (
          <div
            key={seq}
            className={`flex-1 min-w-0 flex flex-col items-center justify-between rounded-xl border p-1.5 transition-all ${style.border} ${style.bg} ${style.text} relative`}
            style={{ minHeight: 62 }}
          >
            {/* Pointer badge pinned above */}
            {(isBase || isNext || isRn) && (
              <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] font-black font-mono px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap z-10 ${
                isRn ? 'bg-emerald-500 text-white shadow-emerald-500/50' :
                isBase && isNext ? 'bg-amber-500 text-black shadow-amber-500/50' :
                isBase ? 'bg-amber-500 text-black shadow-amber-500/50' :
                'bg-sky-400 text-black shadow-sky-400/50'
              }`}>
                {isRn ? 'Rn' : isBase && isNext ? 'Sf=Sn' : isBase ? 'Sf (base)' : 'Sn (next)'}
              </div>
            )}
            <span className="font-mono font-black text-sm mt-1">{displayTag}</span>
            <span className={`text-[8px] font-bold uppercase tracking-wider font-mono px-1.5 py-0.5 rounded-md ${style.badgeBg}`}>
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
      <div className="flex-1 flex items-center justify-center bg-[#0a0f1d]">
        <div className="text-slate-400 text-sm font-mono flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-400 animate-ping" />
          Initializing Simulation Canvas…
        </div>
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

  // Countdown timer dial calculation
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const timerStroke = circumference - timerInfo.progress * circumference;
  const timerColor = timerInfo.isExpired ? '#ef4444' : timerInfo.isWarning ? '#ea580c' : '#10b981';

  return (
    <div className="flex-1 flex flex-col bg-[#0a0f1d] bg-dot-grid overflow-hidden relative select-none">
      {/* Central Workbench Stage */}
      <div className="relative flex-1 flex flex-col p-5 gap-3.5 justify-between overflow-hidden">

        {/* ===== SENDER NODE (Host A, Left) with Sliding Window Track ===== */}
        <div className="p-4 rounded-2xl bg-[#0d1424]/90 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col sm:flex-row gap-5 items-center">
          {/* Machine Terminal Box & Analog Countdown Timer */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0284c7]/20 via-[#0a0f1d] to-[#0284c7]/10 border-2 border-[#0284c7] shadow-lg shadow-sky-600/30 flex flex-col items-center justify-center gap-0.5">
              <Server className="w-6 h-6 text-[#38bdf8]" />
              <span className="text-[10px] font-black text-white uppercase tracking-wider">Host A</span>
              <span className="text-[8px] text-sky-400 font-mono font-bold">TRANSMITTER</span>
            </div>

            {/* Analog Countdown Timer Dial */}
            <div className="relative flex flex-col items-center">
              <svg width="56" height="56" className="-rotate-90">
                <circle cx="28" cy="28" r={radius} stroke="#1e293b" strokeWidth="4.5" fill="none" />
                <circle
                  cx="28" cy="28" r={radius}
                  stroke={timerColor}
                  strokeWidth="4.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={timerStroke}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-200"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {timerInfo.isExpired ? (
                  <span className="text-[10px] font-black text-red-400 animate-pulse">TIMEOUT</span>
                ) : (
                  <span className="text-[11px] font-mono font-bold text-white">{timerInfo.percentage}%</span>
                )}
              </div>
              <span className="text-[9px] text-slate-400 mt-0.5 font-mono font-bold">ARQ Timer</span>
            </div>
          </div>

          {/* Horizontal Window Track (0...7) mounted above Host A */}
          <div className="flex-1 min-w-0 w-full space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="font-bold text-sky-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span>Sender Window [{base} … {(base + windowSize - 1) % seqSpace}] (N = {windowSize})</span>
              </div>
              <div className="font-mono text-xs flex items-center gap-3">
                <span className="text-slate-400">Sf (base): <strong className="text-amber-400">{base}</strong></span>
                <span className="text-slate-400">Sn (next): <strong className="text-sky-400">{nextSeq}</strong></span>
                <span className="text-slate-500 font-semibold">M = {seqSpace}</span>
              </div>
            </div>

            <div className="pt-3">
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

        {/* ===== DUAL TRANSMISSION WIRES (Upper: DATA A➔B, Lower: ACK B➔A) ===== */}
        <div ref={laneRef} className="flex-1 flex flex-col justify-center gap-3 my-1">
          {/* Upper Glowing Wire: DATA Frames (A ➔ B) */}
          <div className="relative">
            <div className="flex items-center justify-between text-xs mb-1 px-1">
              <span className="font-bold text-sky-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0284c7]" />
                DATA WIRE (Host A ➔ Host B)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {dataPackets.length > 0 ? (
                  <strong className="text-sky-300">{dataPackets.length} DATA frames in flight</strong>
                ) : (
                  'Channel idle'
                )}
              </span>
            </div>

            <div
              className="relative h-16 rounded-2xl bg-[#0d1424]/80 backdrop-blur-md border border-sky-500/30 overflow-visible transition-all"
              style={{
                boxShadow: dataPackets.length > 0
                  ? '0 0 24px rgba(2, 132, 199, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
                  : 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Glowing horizontal wire line */}
              <div className="absolute inset-y-1/2 inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent opacity-80" />

              {dataPackets.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 font-mono">
                  Wire idle · Click "Send Next Frame" on the Control Deck
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

          {/* Lower Glowing Wire: ACK Frames (B ➔ A) */}
          <div className="relative">
            <div className="flex items-center justify-between text-xs mb-1 px-1">
              <span className="font-bold text-orange-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
                ACK WIRE (Host B ➔ Host A)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {ackPackets.length > 0 ? (
                  <strong className="text-orange-300">{ackPackets.length} ACK frames in flight</strong>
                ) : (
                  'Channel idle'
                )}
              </span>
            </div>

            <div
              className="relative h-16 rounded-2xl bg-[#0d1424]/80 backdrop-blur-md border border-orange-500/30 overflow-visible transition-all"
              style={{
                boxShadow: ackPackets.length > 0
                  ? '0 0 24px rgba(234, 88, 12, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
                  : 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Glowing horizontal wire line */}
              <div className="absolute inset-y-1/2 inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-[#f97316] to-transparent opacity-80" />

              {ackPackets.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 font-mono">
                  Wire idle · Deliver a DATA packet at Host B to emit an ACK
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

        {/* ===== RECEIVER NODE (Host B, Right) with Window & Inbox ===== */}
        <div className="p-4 rounded-2xl bg-[#0d1424]/90 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col sm:flex-row gap-5 items-center">
          {/* Machine Terminal Box & Delivered Count */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-[#0a0f1d] to-emerald-500/10 border-2 border-emerald-400 shadow-lg shadow-emerald-600/30 flex flex-col items-center justify-center gap-0.5">
              <Inbox className="w-6 h-6 text-emerald-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-wider">Host B</span>
              <span className="text-[8px] text-emerald-400 font-mono font-bold">RECEIVER</span>
            </div>

            <div className="text-center px-2">
              <div className="text-2xl font-black font-mono text-emerald-400 leading-none">
                {deliveredPayloads.length}
              </div>
              <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-1 font-bold">Delivered</div>
            </div>
          </div>

          {/* Receiver Window Track with Expected Rn and Purple Out-of-Order Buffers */}
          <div className="flex-1 min-w-0 w-full space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="font-bold text-emerald-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  Receiver Window (Rn = <strong className="text-white">{receiverBase}</strong>
                  {protocol === 'selective-repeat' ? `, N = ${windowSize}` : ', N = 1'})
                </span>
              </div>
              {bufferedSeqs.size > 0 && (
                <div className="font-mono text-xs text-[#a78bfa] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
                  <span>Buffered: [{Array.from(bufferedSeqs).sort((a, b) => a - b).join(',')}]</span>
                </div>
              )}
            </div>

            <div className="pt-3">
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

            {/* Delivered Application Inbox (Sequential verification) */}
            {deliveredPayloads.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-thin">
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase shrink-0">Inbox:</span>
                {deliveredPayloads.slice(-6).map((payload, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[10px] font-mono shrink-0"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    <span>{payload}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};