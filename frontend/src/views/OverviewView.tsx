import React from 'react';
import {
  FlaskConical,
  Radio,
  Sliders,
  Scale,
  Layers,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { ViewId } from '../types/navigation';
import { ProtocolType } from '@agent';

interface OverviewViewProps {
  onNavigate: (view: ViewId) => void;
  onSelectProtocol: (protocol: ProtocolType) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onSelectProtocol,
}) => {
  const handleLaunchProtocol = (proto: ProtocolType) => {
    onSelectProtocol(proto);
    onNavigate('auto-sim');
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Computer Networks Learning Platform V2</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Network Flow Control &amp; ARQ Visualizer
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Understand how sliding-window flow control and Automatic Repeat reQuest (ARQ)
            protocols ensure reliable data transfer over lossy channels. Observe sender
            and receiver windows, sequence-number modulo arithmetic, in-flight packet
            trajectories, and timer-driven retransmissions in real time.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('auto-sim')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-900/40 cursor-pointer"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Launch Automatic Simulator</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('manual-lab')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition-all cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Manual Interactive Lab</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('live-udp')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Live UDP Transport</span>
            </button>
          </div>
        </div>
      </div>

      {/* Protocol Architecture Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Supported ARQ Flow-Control Protocols</h3>
            <p className="text-xs text-slate-400">
              Select any protocol to inspect its mathematical boundaries, window behavior, and fault-recovery model.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Stop-and-Wait */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-5 flex flex-col justify-between transition-all group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  Window N = 1
                </span>
                <span className="text-[11px] text-slate-500 font-medium">1-Bit ARQ</span>
              </div>

              <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                Stop-and-Wait ARQ
              </h4>

              <p className="text-xs text-slate-400 leading-relaxed">
                The sender transmits a single frame and waits for its positive acknowledgement
                before sending the next. Alternating 1-bit sequence numbers (0 and 1) resolve
                duplicate detection.
              </p>

              <ul className="text-xs space-y-1.5 text-slate-300 pt-1">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Sender window = 1, Receiver window = 1</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Zero receiver buffer required</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Individual frame timeout timer</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleLaunchProtocol('stop-and-wait')}
              className="mt-5 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <span>Launch Stop-and-Wait</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Go-Back-N */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-5 flex flex-col justify-between transition-all group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Window N &gt; 1
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Cumulative ACK</span>
              </div>

              <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                Go-Back-N ARQ
              </h4>

              <p className="text-xs text-slate-400 leading-relaxed">
                Pipelines up to N frames. The receiver strictly accepts in-order frames only,
                discarding out-of-order packets. Cumulative ACKs acknowledge all preceding
                frames. On timeout, sender retransmits all outstanding frames from the base.
              </p>

              <ul className="text-xs space-y-1.5 text-slate-300 pt-1">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Sender window N, Receiver window = 1</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Cumulative ACKs tolerate ACK loss</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Single retransmission timer for base frame</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleLaunchProtocol('go-back-n')}
              className="mt-5 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <span>Launch Go-Back-N</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Selective Repeat */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-5 flex flex-col justify-between transition-all group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Window N &le; M / 2
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Individual ACKs</span>
              </div>

              <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                Selective Repeat ARQ
              </h4>

              <p className="text-xs text-slate-400 leading-relaxed">
                Both sender and receiver maintain window size N. Valid out-of-order frames
                are buffered at the receiver. The sender maintains independent timers and
                retransmits only the specific lost or timed-out frames.
              </p>

              <ul className="text-xs space-y-1.5 text-slate-300 pt-1">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Sender window N, Receiver window N</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Out-of-order receiver buffering</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Independent per-frame retransmit timers</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleLaunchProtocol('selective-repeat')}
              className="mt-5 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <span>Launch Selective Repeat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Dual Simulation vs Real Transport Architecture */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">Dual-Mode Architecture: Simulation vs. Live UDP</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Virtual In-Browser Simulation</h4>
                <span className="text-[11px] text-indigo-400">Deterministic &amp; Reproducible</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Driven by a 32-bit Mulberry32 Pseudo-Random Number Generator (PRNG) and a discrete
              virtual clock. Every simulation run with identical seed, delay, and loss rates
              produces the exact same sequence of events, enabling students to pause, step, and analyze.
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-0.5">Virtual Clock</span>
                <span>Controlled time increments</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-0.5">Simulated Loss</span>
                <span>Calculated drop/delay rates</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Real Live UDP Peer Network</h4>
                <span className="text-[11px] text-emerald-400">Node.js Sockets &amp; WebSocket Telemetry</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Connects to a local Node.js networking agent (<code className="text-emerald-300 font-mono text-[10px]">npm run agent:live</code>)
              sending real UDP datagrams over loopback or local network with 3-way handshake, live chat,
              and SHA-256 chunked file transfer verification.
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-0.5">UDP Wire Sockets</span>
                <span>Real OS-level packet delivery</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-0.5">SHA-256 Hashes</span>
                <span>Integrity verified file transfer</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Exploration Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">Explore Additional Features</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('manual-lab')}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <Sliders className="w-5 h-5 text-amber-400" />
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Phase 3 Preview
              </span>
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-amber-300">
              Manual Classroom Lab
            </h4>
            <p className="text-[11px] text-slate-400">
              Control channel outcomes for DATA and ACK frames, test deliberate drops, and trigger timeouts.
            </p>
          </div>

          <div
            onClick={() => onNavigate('comparison')}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <Scale className="w-5 h-5 text-cyan-400" />
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Benchmark
              </span>
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-cyan-300">
              Protocol Comparison
            </h4>
            <p className="text-[11px] text-slate-400">
              Run comparative benchmarks across all three protocols under equivalent delay and loss conditions.
            </p>
          </div>

          <div
            onClick={() => onNavigate('internals')}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <Layers className="w-5 h-5 text-purple-400" />
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                Architecture
              </span>
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-purple-300">
              Protocol Internals
            </h4>
            <p className="text-[11px] text-slate-400">
              Explore the educational Application $\to$ Data-Link $\to$ Physical layer processing model.
            </p>
          </div>

          <div
            onClick={() => onNavigate('learning')}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Curriculum
              </span>
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">
              Learning Centre
            </h4>
            <p className="text-[11px] text-slate-400">
              Access 16 curriculum topics, sequence-number ambiguity lessons, and the networking glossary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
