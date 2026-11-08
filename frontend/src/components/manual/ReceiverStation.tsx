import React from 'react';
import { ProtocolType, SimulationEvent, SimulationState } from '@agent';
import { Inbox, ShieldCheck, CheckCircle2, ArrowDownCircle, AlertCircle } from 'lucide-react';
import {
  deriveReceiverBufferedSeqs,
  getDualSequenceDisplay,
} from '../../utils/window-visuals';

interface ReceiverStationProps {
  protocol: ProtocolType;
  engineState: SimulationState | null;
  events?: ReadonlyArray<SimulationEvent>;
}

export const ReceiverStation: React.FC<ReceiverStationProps> = ({
  protocol,
  engineState,
  events = [],
}) => {
  if (!engineState) return null;

  const { receiverBase, deliveredPayloads, senderWindow } = engineState;
  const windowSize = senderWindow.windowSize;

  let seqSpace = 8;
  if (protocol === 'stop-and-wait') seqSpace = 2;
  else if (protocol === 'go-back-n') seqSpace = 8;
  else if (protocol === 'selective-repeat') seqSpace = 8;

  const rxWindowSize = protocol === 'selective-repeat' ? windowSize : 1;
  const slots = Array.from({ length: seqSpace }, (_, i) => i);

  // Derive buffered frames at receiver for Selective Repeat
  const bufferedSeqs = deriveReceiverBufferedSeqs(events);

  // Check if a sequence number is within the receiver window [receiverBase .. receiverBase + rxWindowSize - 1] modulo seqSpace
  const isInsideReceiverWindow = (seq: number): boolean => {
    if (protocol !== 'selective-repeat') {
      return seq === receiverBase;
    }
    for (let offset = 0; offset < rxWindowSize; offset++) {
      if ((receiverBase + offset) % seqSpace === seq) {
        return true;
      }
    }
    return false;
  };

  const rxWindowEndSeq = (receiverBase + rxWindowSize - 1) % seqSpace;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl flex flex-col justify-between">
      {/* Station Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Receiver Station (Host B)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                {protocol}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">In-Order Acceptance &amp; Selective Buffer</p>
          </div>
        </div>

        {/* Expected Frame Rn Telemetry */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="text-right">
            <span className="text-slate-500 text-[10px] block uppercase">Next Expected (Rn)</span>
            <span className="text-emerald-300 font-bold text-sm">
              Frame #{receiverBase}
            </span>
          </div>
        </div>
      </div>

      {/* Receiver Sliding Window Track */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
              Receiver Window Track
            </span>
            <span className="text-[10px] font-mono text-slate-500">(M = {seqSpace})</span>
          </div>

          <span className="text-[10px] font-mono text-slate-400">
            Window Size: <strong className="text-emerald-400">{rxWindowSize}</strong>
          </span>
        </div>

        {/* Window Bracket Header Banner */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Receiver Bracket: <strong>[{receiverBase} .. {rxWindowEndSeq}]</strong>
            </span>
          </div>
          <span className="text-[10px] text-emerald-400">
            {protocol === 'selective-repeat'
              ? `Buffering Out-of-Order (N = ${rxWindowSize})`
              : 'Strict In-Order (N = 1)'}
          </span>
        </div>

        {/* Sequence Track Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-3 bg-slate-950/70 rounded-xl border border-slate-800/90 relative">
          {slots.map((seq) => {
            const isExpectedRn = seq === receiverBase;
            const inRxWindow = isInsideReceiverWindow(seq);
            const isBuffered = bufferedSeqs.has(seq);

            const { displayTag, hasWrapped } = getDualSequenceDisplay(
              seq,
              receiverBase,
              seqSpace
            );

            let slotStyle = 'border-slate-800/80 bg-slate-900/30 text-slate-600 opacity-60';
            let statusBadge = 'Outside';
            let badgeBg = 'bg-slate-950 text-slate-600 border-slate-800';

            if (isExpectedRn) {
              slotStyle =
                'border-emerald-500 bg-emerald-500/20 text-emerald-200 font-bold ring-2 ring-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]';
              statusBadge = 'Rn (Expected)';
              badgeBg = 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50';
            } else if (isBuffered) {
              // Selective Repeat: Out-of-order buffered frame
              slotStyle =
                'border-purple-500 bg-purple-500/20 text-purple-200 font-semibold ring-1 ring-purple-400 animate-pulse';
              statusBadge = 'BUFFERED (HOLD)';
              badgeBg = 'bg-purple-950/90 text-purple-300 border-purple-500/50';
            } else if (inRxWindow) {
              slotStyle = 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200';
              statusBadge = 'Acceptable';
              badgeBg = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
            }

            return (
              <div
                key={seq}
                className={`p-2 rounded-xl border text-center transition-all flex flex-col justify-between min-h-[96px] ${slotStyle}`}
              >
                {/* Pointer Tag */}
                <div className="h-4 flex items-center justify-center">
                  {isExpectedRn ? (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border bg-emerald-950 text-emerald-300 border-emerald-500/50">
                      Rn (Next)
                    </span>
                  ) : isBuffered ? (
                    <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded border bg-purple-950 text-purple-300 border-purple-500/50">
                      HOLD
                    </span>
                  ) : null}
                </div>

                {/* Modulo + Wraparound Identifier */}
                <div className="py-1">
                  <div className="font-mono text-base font-extrabold tracking-tight">
                    {displayTag}
                  </div>
                  {hasWrapped && (
                    <span className="text-[8px] font-mono uppercase text-emerald-400 block -mt-0.5">
                      Wrapped
                    </span>
                  )}
                </div>

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

      {/* Selective Repeat Out-of-Order Buffer Alert Callout */}
      {protocol === 'selective-repeat' && bufferedSeqs.size > 0 && (
        <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/40 text-xs text-purple-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            <strong>Receiver Buffering:</strong> Frames{' '}
            <span className="font-mono font-bold text-purple-300">
              [{Array.from(bufferedSeqs).sort((a, b) => a - b).join(', ')}]
            </span>{' '}
            are buffered out-of-order. Waiting for missing Frame #{receiverBase} to cascade in-order delivery.
          </span>
        </div>
      )}

      {/* Application Layer Delivered Payloads Inbox */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Delivered to Upper Layer ({deliveredPayloads.length})</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">In-Order Sequential Stream</span>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 min-h-[72px] max-h-[96px] overflow-y-auto">
          {deliveredPayloads.length === 0 ? (
            <div className="text-center py-2 text-slate-500 text-xs">
              No payloads delivered yet. Deliver a DATA frame to begin in-order acceptance.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {deliveredPayloads.map((payload, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{payload}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Receiver Legend Footer */}
      <div className="text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            Expected Sequence: <strong className="text-emerald-300">Rn = {receiverBase}</strong>
          </span>
        </span>
        <span className="text-[10px] text-slate-500 font-mono">
          {protocol === 'go-back-n'
            ? 'Strict In-Order: Out-of-order discarded'
            : protocol === 'selective-repeat'
            ? 'Buffering Out-of-Order in Window'
            : 'Stop-and-Wait Alternating Bit (0/1)'}
        </span>
      </div>
    </div>
  );
};
