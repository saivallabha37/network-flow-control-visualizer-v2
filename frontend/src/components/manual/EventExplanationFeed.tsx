import React, { useState, useEffect, useRef } from 'react';
import { SimulationEvent } from '@agent';
import {
  ListFilter,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Send,
  Radio,
  Layers,
  ArrowDownCircle,
} from 'lucide-react';

interface EventExplanationFeedProps {
  events: ReadonlyArray<SimulationEvent>;
}

export const EventExplanationFeed: React.FC<EventExplanationFeedProps> = ({ events }) => {
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  const getEventPedagogicalExplanation = (evt: SimulationEvent): string => {
    const d = evt.details;
    switch (evt.type) {
      case 'SIMULATION_STARTED':
        return `Manual simulation started for ${d.protocol}. The sender is initialized and ready to transmit frames within window capacity.`;

      case 'FRAME_TRANSMITTED':
        return `Sender transmitted DATA frame #${d.seqNum} (payload: "${d.payload ?? ''}"). Slot ${d.seqNum} is now occupied and awaiting acknowledgement.`;

      case 'FRAME_DELIVERED':
        return `Receiver accepted DATA frame #${d.seqNum}. Sequence number matches receiver expectation. Upper layer payload delivery is triggered.`;

      case 'FRAME_DROPPED':
        return `DATA frame #${d.seqNum} was dropped in the channel. The receiver never received this packet. Sender retransmission timer continues running.`;

      case 'FRAME_BUFFERED':
        return `DATA frame #${d.seqNum} arrived out-of-order. Because Selective Repeat has receiver buffering, it stores this valid frame in slot ${d.seqNum} awaiting earlier missing frames.`;

      case 'ACK_TRANSMITTED':
        return `Receiver generated and transmitted ACK #${d.ackNum} back to sender across the channel.`;

      case 'ACK_DELIVERED':
        return `ACK #${d.ackNum} arrived at sender. Sender validates the acknowledgement and advances its sliding window base.`;

      case 'ACK_DROPPED':
        return `ACK #${d.ackNum} was lost in transit! The sender remains unacknowledged and will eventually time out even though the receiver already accepted the data.`;

      case 'TIMEOUT':
        return d.isManual
          ? `Instructor manually triggered retransmission timeout! Sender initiates recovery protocol.`
          : `Retransmission timer expired at ${evt.virtualTimestamp}ms. Sender initiates recovery protocol.`;

      case 'RETRANSMISSION':
        return `Retransmitting frame #${d.seqNum} (Attempt: ${d.attempt ?? 1}). Frame is re-injected into the channel.`;

      case 'SENDER_WINDOW_SLID':
        return `Sender window advanced! Base pointer moved forward, freeing capacity for subsequent transmissions.`;

      case 'PACKET_DELAYED':
        return `Packet delayed in channel. Delivery timestamp extended by +${d.additionalMs}ms.`;

      case 'PAYLOAD_DELIVERED':
        return `Application layer delivered payload "${d.payload ?? ''}" in strictly sequential order.`;

      default:
        return d.description || evt.type;
    }
  };

  const getBadgeDetails = (type: string) => {
    switch (type) {
      case 'FRAME_TRANSMITTED':
        return { label: 'DATA SENT', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', icon: Send };
      case 'FRAME_DELIVERED':
        return { label: 'DATA DELIVERED', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: CheckCircle2 };
      case 'FRAME_DROPPED':
        return { label: 'DATA LOST', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', icon: XCircle };
      case 'FRAME_BUFFERED':
        return { label: 'BUFFERED', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: Layers };
      case 'ACK_TRANSMITTED':
        return { label: 'ACK SENT', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: Radio };
      case 'ACK_DELIVERED':
        return { label: 'ACK DELIVERED', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: CheckCircle2 };
      case 'ACK_DROPPED':
        return { label: 'ACK LOST', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', icon: XCircle };
      case 'TIMEOUT':
        return { label: 'TIMEOUT', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Clock };
      case 'RETRANSMISSION':
        return { label: 'RETRANSMIT', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40', icon: RotateCcw };
      case 'PACKET_DELAYED':
        return { label: 'DELAYED', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: Clock };
      case 'PAYLOAD_DELIVERED':
        return { label: 'APP DELIVERED', color: 'bg-emerald-600/25 text-emerald-200 border-emerald-500/50', icon: ArrowDownCircle };
      default:
        return { label: type, color: 'bg-slate-800 text-slate-400 border-slate-700', icon: ListFilter };
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Feed Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Pedagogical Event Feed &amp; Protocol Explanation
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {events.length} events
          </span>
        </div>

        <button
          type="button"
          onClick={() => setAutoScroll((prev) => !prev)}
          className={`text-[10px] font-mono px-2 py-1 rounded transition-colors cursor-pointer ${
            autoScroll
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {autoScroll ? 'Auto-Scroll ON' : 'Auto-Scroll OFF'}
        </button>
      </div>

      {/* Events List */}
      <div
        ref={scrollRef}
        className="space-y-2.5 max-h-72 overflow-y-auto pr-1 select-text font-sans"
      >
        {events.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Simulation ready. Send a frame to observe protocol actions and state transition explanations.
          </div>
        ) : (
          events.map((evt) => {
            const badge = getBadgeDetails(evt.type);
            const Icon = badge.icon;
            const explanation = getEventPedagogicalExplanation(evt);

            return (
              <div
                key={evt.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-start gap-3 text-xs"
              >
                <div className="shrink-0 mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${badge.color}`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{badge.label}</span>
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-slate-200 leading-relaxed font-medium">
                    {explanation}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                    <span>Virtual Time: {evt.virtualTimestamp} ms</span>
                    {evt.details.seqNum !== undefined && (
                      <span>Seq: {evt.details.seqNum}</span>
                    )}
                    {evt.details.ackNum !== undefined && (
                      <span>ACK: {evt.details.ackNum}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
