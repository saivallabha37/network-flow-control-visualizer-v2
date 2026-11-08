import React from 'react';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
  BookOpen,
  FlaskConical,
} from 'lucide-react';
import { ViewId } from '../types/navigation';
import { LayeredStackFlow } from '../components/internals/LayeredStackFlow';
import { FrameDissector } from '../components/internals/FrameDissector';
import { StateMachineDiagram } from '../components/internals/StateMachineDiagram';

interface ProtocolInternalsViewProps {
  onNavigate: (view: ViewId) => void;
}

export const ProtocolInternalsView: React.FC<ProtocolInternalsViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 pb-16">
      {/* View Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950/25 to-slate-900 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Layered Network Architecture &amp; Protocol Engineering</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Protocol Internals &amp; Frame Anatomy Lab
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Understand how application messages transform into physical wire frames, how bitwise CRC-32 integrity
            guarantees error detection before state transitions, and how sender/receiver state machines coordinate
            flow control across lossy channels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('manual-lab')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-950/60 cursor-pointer"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Open Manual Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Educational Callouts: Why Flow Control in Layer 2 vs Layer 4? */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
            <Cpu className="w-4 h-4" />
            <span>Why Flow Control in Both Data-Link (L2) and Transport (L4)?</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In point-to-point physical links (e.g., HDLC, satellite up-links, IEEE 802.11 Wi-Fi frames),
            <strong> Data-Link flow control</strong> prevents a fast transmitter from overflowing the receiver's physical buffer
            over single hops. In the Internet architecture, <strong>Transport Layer (TCP)</strong> provides end-to-end sliding
            window flow control across multi-hop heterogeneous networks with dynamic buffer sizing.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Why Error Detection Precedes Protocol State Transitions?</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            A state machine must <em>never</em> advance internal pointers or adjust sequence windows based on corrupted headers.
            If a bit flip corrupts an ACK number or sequence number, acting on it could falsely acknowledge unreceived data
            or cause sequence desynchronization. Therefore, the Data-Link layer always computes CRC-32 first and discards
            corrupted frames silently, letting the sender's timeout mechanism recover.
          </p>
        </div>
      </div>

      {/* Section 1: 3-Tier Layered Stack Flow */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span>1. Three-Tier Encapsulation &amp; Decapsulation Stack</span>
        </div>
        <LayeredStackFlow />
      </div>

      {/* Section 2: Interactive Frame Bitfield Dissector & CRC-32 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>2. Wire Frame Dissector &amp; Physical Bit-Flip Laboratory</span>
        </div>
        <FrameDissector />
      </div>

      {/* Section 3: Protocol State Machine Inspector */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>3. Protocol Finite State Machine (FSM) Visualizer</span>
        </div>
        <StateMachineDiagram />
      </div>
    </div>
  );
};
