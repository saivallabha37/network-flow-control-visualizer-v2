import React from 'react';
import { ProtocolType, SimulationEvent, SimulationState } from '@agent';
import { Send, RotateCcw, Server, ShieldCheck } from 'lucide-react';
import {
  classifySenderSlot,
  getDualSequenceDisplay,
  deriveSenderTimers,
  deriveAckedSeqs,
  SlotState,
} from '../../utils/window-visuals';
import { TimerIndicator } from './TimerIndicator';

interface SenderStationProps {
  protocol: ProtocolType;
  engineState: SimulationState | null;
  events?: ReadonlyArray<SimulationEvent>;
  virtualTimeMs?: number;
  timeoutMs?: number;
  canSend: boolean;
  canTimeout: boolean;
  remainingPayloadCount: number;
  onSendNextFrame: () => void;
  onTriggerTimeout: (targetSeq?: number) => void;
}

export const SenderStation: React.FC<SenderStationProps> = ({
  protocol,
  engineState,
  events = [],
  virtualTimeMs = 0,
  timeoutMs = 400,
  canSend,
  canTimeout,
  remainingPayloadCount,
  onSendNextFrame,
  onTriggerTimeout,
}) => {
  if (!engineState) return null;

  const { senderWindow } = engineState;
  const base = senderWindow.base;
  const nextSeq = senderWindow.nextSeqNum;
  const windowSize = senderWindow.windowSize;
  const outstandingCount = senderWindow.bufferSize;

  // Determine sequence number space M
  let seqSpace = 8;
  if (protocol === 'stop-and-wait') seqSpace = 2;
  else if (protocol === 'go-back-n') seqSpace = 8;
  else if (protocol === 'selective-repeat') seqSpace = 8;

  // Generate sequence slots [0 .. seqSpace - 1]
  const slots = Array.from({ length: seqSpace }, (_, i) => i);

  // Derive ACKed slots (especially relevant for Selective Repeat)
  const ackedSeqs = deriveAckedSeqs(protocol, events, base, windowSize, seqSpace);

  // Derive timers for shared and individual models
  const { sharedTimer, individualTimers } = deriveSenderTimers(
    protocol,
    engineState,
    events,
    timeoutMs,
    virtualTimeMs
  );

  // Window bounds string: [Sf .. (Sf + N - 1) % M]
  const windowEndSeq = (base + windowSize - 1) % seqSpace;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl flex flex-col justify-between">
      {/* Station Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Sender Station (Host A)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                {protocol}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Sliding Window &amp; Retransmission State</p>
          </div>
        </div>

        {/* Window Capacity Telemetry */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="text-right">
            <span className="text-slate-500 text-[10px] block uppercase">Window Capacity (N)</span>
            <span className="text-indigo-300 font-bold">
              {outstandingCount} / {windowSize} <span className="text-slate-500 text-[10px]">frames</span>
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onSendNextFrame}
          disabled={!canSend}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md cursor-pointer ${
            canSend
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/60 active:scale-98'
              : 'bg-slate-800/80 text-slate-500 border border-slate-800 cursor-not-allowed'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send Frame (Next)</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 font-mono">
            {remainingPayloadCount} left
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTriggerTimeout()}
          disabled={!canTimeout}
          title={
            canTimeout
              ? 'Trigger immediate retransmission timeout for unacknowledged frames'
              : 'No outstanding frames awaiting ACK'
          }
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border cursor-pointer ${
            canTimeout
              ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-200 border-amber-500/40 shadow-sm active:scale-98'
              : 'bg-slate-800/40 text-slate-600 border-slate-800/80 cursor-not-allowed'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Trigger Timeout (Sf)</span>
        </button>
      </div>

      {/* Shared Timer Indicator for Stop-and-Wait & Go-Back-N */}
      {protocol !== 'selective-repeat' && (
        <TimerIndicator
          model="bar"
          elapsedMs={sharedTimer.elapsedMs}
          timeoutMs={timeoutMs}
          timerInfo={sharedTimer.timerInfo}
          isRunning={sharedTimer.isRunning}
          label={`Sender Retransmission Timer (Sf = ${base})`}
          sublabel={
            sharedTimer.isRunning
              ? `Tracking oldest unacknowledged frame ${base}`
              : 'Sender window idle (no unacked frames)'
          }
        />
      )}

      {/* Sliding Window Sequence Track */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
              Sender Sequence Track
            </span>
            <span className="text-[10px] font-mono text-slate-500">(M = {seqSpace})</span>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <strong className="text-amber-400">Sf (Base):</strong> {base}
            </span>
            <span className="flex items-center gap-1 font-mono">
              <strong className="text-cyan-400">Sn (Next):</strong> {nextSeq}
            </span>
          </div>
        </div>

        {/* Window Bracket Header Banner */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-300 font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>
              Sliding Bracket: <strong>[{base} .. {windowEndSeq}]</strong>
            </span>
          </div>
          <span className="text-[10px] text-indigo-400">
            Capacity N = {windowSize} {windowSize === 1 ? 'frame' : 'frames'}
          </span>
        </div>

        {/* Sequence Track Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-3 bg-slate-950/70 rounded-xl border border-slate-800/90 relative">
          {slots.map((seq) => {
            const slotState: SlotState = classifySenderSlot(
              seq,
              base,
              nextSeq,
              windowSize,
              seqSpace,
              ackedSeqs
            );
            const { displayTag, hasWrapped } = getDualSequenceDisplay(seq, base, seqSpace);

            const isBase = seq === base;
            const isNext = seq === nextSeq;

            // Slot Color Hierarchy
            let slotStyle = 'border-slate-800 bg-slate-900/40 text-slate-500';
            let statusBadge = 'Out of Window';
            let badgeBg = 'bg-slate-900 text-slate-500 border-slate-800';

            switch (slotState) {
              case 'ACKED':
                slotStyle = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200';
                statusBadge = 'ACKED';
                badgeBg = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
                break;
              case 'OUTSTANDING':
                slotStyle =
                  'border-amber-500 bg-amber-500/15 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50';
                statusBadge = 'In Flight';
                badgeBg = 'bg-amber-950/80 text-amber-300 border-amber-500/40';
                break;
              case 'READY':
                slotStyle = 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200';
                statusBadge = 'Ready';
                badgeBg = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
                break;
              case 'OUT_OF_WINDOW':
              default:
                slotStyle = 'border-slate-800/80 bg-slate-900/30 text-slate-600 opacity-60';
                statusBadge = 'Outside';
                badgeBg = 'bg-slate-950 text-slate-600 border-slate-800';
                break;
            }

            // Pointer tags (Sf, Sn)
            let pointerTag = '';
            if (isBase && isNext) {
              pointerTag = 'Sf=Sn';
            } else if (isBase) {
              pointerTag = 'Sf (Base)';
            } else if (isNext) {
              pointerTag = 'Sn (Next)';
            }

            // Per-frame timer for Selective Repeat
            const indivTimer = individualTimers.get(seq);

            return (
              <div
                key={seq}
                className={`p-2 rounded-xl border text-center transition-all flex flex-col justify-between min-h-[96px] ${slotStyle}`}
              >
                {/* Pointer Tag */}
                <div className="h-4 flex items-center justify-center">
                  {pointerTag && (
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        isBase
                          ? 'bg-indigo-950/90 text-indigo-300 border-indigo-500/50'
                          : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50'
                      }`}
                    >
                      {pointerTag}
                    </span>
                  )}
                </div>

                {/* Modulo + Wraparound Identifier */}
                <div className="py-1">
                  <div className="font-mono text-base font-extrabold tracking-tight">
                    {displayTag}
                  </div>
                  {hasWrapped && (
                    <span className="text-[8px] font-mono uppercase text-indigo-400 block -mt-0.5">
                      Wrapped
                    </span>
                  )}
                </div>

                {/* Individual Mini-Dial Timer for Selective Repeat */}
                {protocol === 'selective-repeat' && slotState === 'OUTSTANDING' && indivTimer && (
                  <div className="flex justify-center my-0.5">
                    <TimerIndicator
                      model="mini-dial"
                      elapsedMs={indivTimer.elapsedMs}
                      timeoutMs={timeoutMs}
                      timerInfo={indivTimer.timerInfo}
                      interactive={true}
                      onClick={() => onTriggerTimeout(seq)}
                    />
                  </div>
                )}

                {/* Slot Status Badge */}
                <div className="mt-1">
                  <span
                    className={`text-[8px] uppercase tracking-wider font-semibold px-1 py-0.5 rounded border block truncate ${badgeBg}`}
                  >
                    {statusBadge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Protocol Legend Footer */}
      <div className="text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            Window: <strong className="text-indigo-300">[{base} .. {windowEndSeq}]</strong>
          </span>
        </span>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> ACKED
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> OUTSTANDING
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> READY
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" /> OUTSIDE
          </span>
        </div>
      </div>
    </div>
  );
};
