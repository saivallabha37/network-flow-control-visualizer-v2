import React from 'react';
import { InFlightPacket } from '@agent';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
} from 'lucide-react';

interface ChannelLanesProps {
  inFlightPackets: ReadonlyArray<InFlightPacket>;
  onDeliverPacket: (packetId: string) => void;
  onDropPacket: (packetId: string) => void;
  onDelayPacket: (packetId: string, additionalMs: number) => void;
}

export const ChannelLanes: React.FC<ChannelLanesProps> = ({
  inFlightPackets,
  onDeliverPacket,
  onDropPacket,
  onDelayPacket,
}) => {
  const dataPackets = inFlightPackets.filter((p) => p.type === 'DATA');
  const ackPackets = inFlightPackets.filter((p) => p.type === 'ACK');

  const renderPacketCard = (pkt: InFlightPacket) => {
    const isData = pkt.type === 'DATA';
    const isDelayed = pkt.status === 'DELAYED';

    return (
      <div
        key={pkt.id}
        className={`w-full sm:w-72 p-3.5 rounded-xl border transition-all shadow-lg flex flex-col justify-between space-y-3 ${
          isData
            ? 'bg-slate-900 border-indigo-500/40 shadow-indigo-950/40 ring-1 ring-indigo-500/20'
            : 'bg-slate-900 border-cyan-500/40 shadow-cyan-950/40 ring-1 ring-cyan-500/20'
        }`}
      >
        {/* Packet Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-extrabold font-mono px-2 py-0.5 rounded ${
                isData
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              {isData ? `DATA #${pkt.frame.seqNum}` : `ACK #${pkt.frame.ackNum ?? 0}`}
            </span>
            {isDelayed && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                DELAYED
              </span>
            )}
          </div>

          <span className="text-[10px] font-mono text-slate-500">
            ID: {pkt.id.split('-').slice(-2).join('-')}
          </span>
        </div>

        {/* Packet Content / Metadata */}
        <div className="space-y-1.5 text-xs">
          {isData && pkt.frame.payload && (
            <div className="text-slate-200 font-mono text-[11px] bg-slate-950/80 px-2 py-1 rounded border border-slate-800/80 truncate">
              "{pkt.frame.payload}"
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Sent: {pkt.dispatchTimeMs} ms</span>
            <span>Arrival: {pkt.scheduledDeliveryTimeMs} ms</span>
          </div>
        </div>

        {/* Interactive Action Controls */}
        <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => onDeliverPacket(pkt.id)}
            title="Deliver packet immediately to destination"
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-medium transition-all active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Deliver</span>
          </button>

          <button
            type="button"
            onClick={() => onDropPacket(pkt.id)}
            title="Deliberately drop/lose packet in transit"
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[11px] font-medium transition-all active:scale-95 cursor-pointer"
          >
            <XCircle className="w-3 h-3" />
            <span>Drop</span>
          </button>

          <button
            type="button"
            onClick={() => onDelayPacket(pkt.id, 200)}
            title="Postpone arrival by +200ms"
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-[11px] font-medium transition-all active:scale-95 cursor-pointer"
          >
            <Clock className="w-3 h-3" />
            <span>+200ms</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-6 shadow-xl">
      {/* Channel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Bidirectional Transmission Channel
          </h3>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-indigo-300">
            DATA: <strong>{dataPackets.length}</strong> in flight
          </span>
          <span className="text-cyan-300">
            ACK: <strong>{ackPackets.length}</strong> in flight
          </span>
        </div>
      </div>

      {/* Lane 1: DATA Frames (Sender -> Receiver) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="font-semibold text-indigo-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <span>DATA Lane (Sender &rarr; Receiver)</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
            </span>
          </div>

          <span className="text-[10px] text-slate-500 font-mono">
            {dataPackets.length === 0 ? 'Channel Idle' : `${dataPackets.length} Transiting`}
          </span>
        </div>

        <div className="min-h-[140px] p-3 rounded-xl bg-slate-950/80 border border-indigo-500/20 flex flex-wrap items-center gap-3 overflow-x-auto">
          {dataPackets.length === 0 ? (
            <div className="w-full text-center py-6 text-slate-500 text-xs">
              No DATA frames in transit. Click <strong className="text-indigo-400">"Send Frame (Next)"</strong> in the Sender Station to transmit a frame.
            </div>
          ) : (
            dataPackets.map(renderPacketCard)
          )}
        </div>
      </div>

      {/* Lane 2: ACK Frames (Receiver -> Sender) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold text-cyan-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>ACK Lane (Receiver &rarr; Sender)</span>
            </span>
          </div>

          <span className="text-[10px] text-slate-500 font-mono">
            {ackPackets.length === 0 ? 'Channel Idle' : `${ackPackets.length} Transiting`}
          </span>
        </div>

        <div className="min-h-[140px] p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20 flex flex-wrap items-center gap-3 overflow-x-auto">
          {ackPackets.length === 0 ? (
            <div className="w-full text-center py-6 text-slate-500 text-xs">
              No ACK frames in transit. Deliver an in-order DATA frame at the Receiver to trigger an ACK.
            </div>
          ) : (
            ackPackets.map(renderPacketCard)
          )}
        </div>
      </div>
    </div>
  );
};
