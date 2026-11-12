import React, { useState, useEffect } from 'react';
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
  // Micro-interaction state: Animated ping-pong packet in Card 1 Stop-and-Wait
  const [sawForward, setSawForward] = useState(true);
  const [goodputRate, setGoodputRate] = useState(94.8);

  useEffect(() => {
    const sawInterval = setInterval(() => {
      setSawForward((prev) => !prev);
    }, 1400);

    const jitterInterval = setInterval(() => {
      const base = 94.2 + Math.random() * 1.4;
      setGoodputRate(parseFloat(base.toFixed(1)));
    }, 2500);

    return () => {
      clearInterval(sawInterval);
      clearInterval(jitterInterval);
    };
  }, []);

  return (
    <div className="relative w-full flex flex-col gap-space-xl pb-space-xl">
      {/* Dynamic Ambient Glow Anchors */}
      <div className="absolute -top-12 left-10 w-96 h-96 rounded-full bg-secondary-container/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-80 right-1/4 w-[480px] h-[480px] rounded-full bg-primary-container/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-16 right-10 w-80 h-80 rounded-full bg-tertiary-container/15 blur-[110px] pointer-events-none" />

      {/* Top Spatial Banner & Status Ticker */}
      <div className="relative w-full rounded-xl bg-surface-container-low/50 backdrop-blur-2xl p-space-lg shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.22)] overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-fixed/40 to-transparent" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md mb-space-lg">
          <div className="flex items-center gap-space-sm flex-wrap">
            <span className="px-space-md py-1 rounded-full bg-surface-container-high/80 text-secondary font-label-caps text-label-caps uppercase tracking-wider shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              Layer 2 • Data Link Protocol Suite
            </span>
            <span className="px-space-md py-1 rounded-full bg-surface-container/60 text-on-surface-variant font-label-caps text-label-caps uppercase">
              RFC 793 / ISO 3309 HDLC Spec
            </span>
            <span className="px-space-md py-1 rounded-full bg-primary-container/20 text-primary font-label-caps text-label-caps uppercase shadow-[inset_0_1px_0.5px_rgba(208,188,255,0.3)]">
              Spatial Engine V3.8 Active
            </span>
          </div>
          <div className="flex items-center gap-space-md text-on-surface-variant font-mono text-label-md">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-secondary">memory</span>
              <span>PRNG Seed: <strong className="text-on-surface font-semibold">0x7F4A9C1</strong></span>
            </div>
            <div className="w-1 h-1 rounded-full bg-outline-variant" />
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-tertiary">network_check</span>
              <span>Virtual Loss: <strong className="text-on-surface font-semibold">0.00%</strong></span>
            </div>
          </div>
        </div>

        {/* Hero Typography Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
          <div className="lg:col-span-8 flex flex-col gap-space-md">
            <div className="flex items-center gap-2 text-primary font-label-lg text-label-lg">
              <span className="material-symbols-outlined text-[18px]">stream</span>
              Deterministic Physical Layer Emulation
            </div>
            <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight leading-[1.1]">
              Interactive Computer Networks{' '}
              <span className="bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                Flow &amp; Error Control
              </span>{' '}
              Laboratory
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Simulating Automatic Repeat reQuest (ARQ) protocols at the Data Link Layer with deterministic virtual channels, cycle-accurate sliding window visualizers, and raw operating-system-level UDP socket pipelines.
            </p>

            {/* 3D Tactile Interactive Launch Controls */}
            <div className="flex flex-wrap items-center gap-space-md pt-space-sm">
              <button
                type="button"
                id="btn-launch-workbench"
                onClick={() => onNavigate('manual-lab')}
                className="group relative px-space-lg py-space-sm rounded-full bg-gradient-to-b from-primary-container to-inverse-primary text-on-primary font-headline-sm text-headline-sm shadow-[0_12px_32px_rgba(160,120,255,0.45),inset_0_1px_1px_rgba(255,255,255,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-0.5">rocket_launch</span>
                <span>Launch Interactive Workbench</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-mono uppercase tracking-wider">Alt+W</span>
              </button>
              <button
                type="button"
                id="btn-open-udp"
                onClick={() => onNavigate('live-udp')}
                className="group relative px-space-lg py-space-sm rounded-full bg-surface-container-high/90 text-secondary-fixed font-headline-sm text-headline-sm shadow-[0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.35)] hover:bg-surface-bright hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px] text-secondary">lan</span>
                <span>Open Real UDP Wire Network</span>
                <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_currentColor]" />
              </button>
            </div>
          </div>

          {/* Hero Telemetry Sparkline & Dynamic Canvas Glass Disc */}
          <div className="lg:col-span-4 flex flex-col gap-space-sm p-space-md rounded-lg bg-surface-container/70 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <div className="flex items-center justify-between font-label-md text-label-md">
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-primary">speed</span>
                Effective Link Goodput
              </span>
              <span className="text-secondary font-mono font-semibold" id="telemetry-rate">
                {goodputRate}% Capacity
              </span>
            </div>
            <div className="h-28 w-full flex items-end justify-between gap-1 pt-4 pb-1 px-1">
              <div className="w-full h-12 bg-primary/20 rounded-t-sm relative group overflow-hidden">
                <div className="absolute bottom-0 inset-x-0 bg-primary h-[60%] shadow-[0_0_10px_rgba(208,188,255,0.8)]" />
              </div>
              <div className="w-full h-16 bg-primary/20 rounded-t-sm relative group overflow-hidden">
                <div className="absolute bottom-0 inset-x-0 bg-secondary h-[80%] shadow-[0_0_10px_rgba(123,208,255,0.8)]" />
              </div>
              <div className="w-full h-20 bg-primary/20 rounded-t-sm relative group overflow-hidden">
                <div className="absolute bottom-0 inset-x-0 bg-primary h-[75%]" />
              </div>
              <div className="w-full h-24 bg-primary/20 rounded-t-sm relative group overflow-hidden">
                <div className="absolute bottom-0 inset-x-0 bg-primary-container h-[92%] shadow-[0_0_12px_rgba(160,120,255,0.9)]" />
              </div>
              <div className="w-full h-14 bg-primary/20 rounded-t-sm relative group overflow-hidden">
                <div className="absolute bottom-0 inset-x-0 bg-secondary h-[70%]" />
              </div>
              <div className="w-full h-22 bg-primary/20 rounded-t-sm relative group overflow-hidden">
                <div className="absolute bottom-0 inset-x-0 bg-primary h-[88%]" />
              </div>
              <div className="w-full h-28 bg-primary/20 rounded-t-sm relative group overflow-hidden">
                <div className="absolute bottom-0 inset-x-0 bg-tertiary h-[95%] shadow-[0_0_12px_rgba(255,182,144,0.8)]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-space-xs pt-space-xs text-center font-mono">
              <div className="p-2 rounded bg-surface-container-lowest/60">
                <span className="text-label-caps block text-on-surface-variant">RTT (MEAN)</span>
                <span className="text-headline-sm text-on-surface font-semibold">42.4 ms</span>
              </div>
              <div className="p-2 rounded bg-surface-container-lowest/60">
                <span className="text-label-caps block text-on-surface-variant">EFFICIENCY η</span>
                <span className="text-headline-sm text-secondary font-semibold">1 / (1 + 2a)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Overline Label & Sub-nav Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-2">
        <div className="flex items-center gap-space-sm">
          <span className="w-3 h-3 rounded-full bg-primary-container shadow-[0_0_10px_currentColor]" />
          <span className="font-headline-md text-headline-md text-on-surface">The 3 Core ARQ Protocols</span>
          <span className="text-on-surface-variant font-body-sm text-body-sm hidden md:inline">• Rigorous State Machine Validation</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Modulo Constraint:</span>
          <span className="px-space-sm py-0.5 rounded-full bg-surface-container-high text-primary font-mono text-label-sm font-semibold">M ≥ 2N Check: Pass</span>
        </div>
      </div>

      {/* The 3 Core ARQ Pillars (3D Frosted Glass Monolith Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        {/* Card 1: Stop-and-Wait ARQ */}
        <div className="group relative rounded-xl bg-surface-container-low/60 backdrop-blur-2xl p-space-lg flex flex-col justify-between shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-surface-container/60 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-secondary/60 to-transparent opacity-75" />
          <div className="flex flex-col gap-space-md">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">Protocol 01 • Lockstep</span>
                <h3 className="font-headline-lg text-headline-lg text-on-surface">Stop-and-Wait ARQ</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <span className="material-symbols-outlined text-[20px]">sync_alt</span>
              </div>
            </div>

            {/* Metric Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full bg-surface-container-high/80 text-on-surface text-label-md font-mono">
                Window <strong className="text-secondary">N = 1</strong>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-surface-container-high/80 text-on-surface text-label-md font-mono">
                Modulo <strong className="text-secondary">M = 2</strong> (Bit 0/1)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-secondary-container/30 text-secondary-fixed text-label-md">
                Half-Duplex
              </span>
            </div>

            {/* Micro Visual: 3D Ping-Pong Simulation Reel */}
            <div className="my-space-xs p-space-md rounded-lg bg-surface-container-lowest/80 relative overflow-hidden flex flex-col gap-space-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
              <div className="flex justify-between items-center text-label-caps text-on-surface-variant font-mono">
                <span>TX SENDER (S=0)</span>
                <span>RX RECEIVER (R=0)</span>
              </div>
              <div className="relative h-10 w-full flex items-center px-4">
                <div className="absolute inset-x-4 h-1 bg-surface-variant rounded-full" />
                <div
                  className={`absolute w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold shadow-[0_0_14px_rgba(123,208,255,0.9),inset_0_1px_0.5px_rgba(255,255,255,0.7)] transition-all duration-700 ${
                    sawForward
                      ? 'left-4 bg-secondary text-on-secondary'
                      : 'left-[calc(100%-2.5rem)] bg-primary text-on-primary'
                  }`}
                >
                  {sawForward ? 'F0' : 'ACK0'}
                </div>
              </div>
              <div className="flex items-center justify-between text-label-md font-mono text-on-surface-variant pt-1">
                <span className="text-secondary flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> State: Frame In-Flight
                </span>
                <span>Timeout: <strong className="text-on-surface">500ms</strong></span>
              </div>
            </div>

            {/* Feature Bullet List */}
            <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
                <span>Strict lockstep: Transmit one, idle until verified ACK.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
                <span>Inherent duplicate rejection via alternating sequence bit.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
                <span>Zero receiver buffer overhead (in-order consumption).</span>
              </li>
            </ul>
          </div>

          <div className="pt-space-md mt-space-md border-t border-outline-variant/20 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                onSelectProtocol('stop-and-wait');
                onNavigate('manual-lab');
              }}
              className="w-full py-2.5 px-4 rounded-full bg-surface-container-high/90 hover:bg-secondary hover:text-on-secondary text-secondary font-headline-sm text-headline-sm transition-all shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch SAW Lab</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Card 2: Go-Back-N ARQ */}
        <div className="group relative rounded-xl bg-surface-container-low/60 backdrop-blur-2xl p-space-lg flex flex-col justify-between shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-surface-container/60 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/80 to-transparent opacity-75" />
          <div className="flex flex-col gap-space-md">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Protocol 02 • Sliding Pipelined</span>
                <h3 className="font-headline-lg text-headline-lg text-on-surface">Go-Back-N ARQ</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <span className="material-symbols-outlined text-[20px]">view_column</span>
              </div>
            </div>

            {/* Metric Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full bg-surface-container-high/80 text-on-surface text-label-md font-mono">
                Sender <strong className="text-primary">N = 4</strong>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-surface-container-high/80 text-on-surface text-label-md font-mono">
                Receiver <strong className="text-primary">N = 1</strong>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-surface-container-high/80 text-on-surface text-label-md font-mono">
                Modulo <strong className="text-primary">M = 8</strong>
              </span>
            </div>

            {/* Micro Visual: 3D Sliding Bracket Over Slot Track */}
            <div className="my-space-xs p-space-md rounded-lg bg-surface-container-lowest/80 relative overflow-hidden flex flex-col gap-space-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
              <div className="flex justify-between items-center text-label-caps text-on-surface-variant font-mono">
                <span>Sf (BASE) = 2</span>
                <span>Sn (NEXT) = 6</span>
              </div>
              <div className="relative py-2">
                <div className="grid grid-cols-8 gap-1.5">
                  <div className="h-8 rounded bg-surface-variant/40 flex items-center justify-center text-label-caps font-mono text-outline">0</div>
                  <div className="h-8 rounded bg-surface-variant/40 flex items-center justify-center text-label-caps font-mono text-outline">1</div>
                  <div className="h-8 rounded bg-primary-container/80 text-on-primary-container flex items-center justify-center text-label-caps font-mono font-bold shadow-[0_0_8px_rgba(160,120,255,0.5)]">2</div>
                  <div className="h-8 rounded bg-primary-container/60 text-on-primary-container flex items-center justify-center text-label-caps font-mono font-bold">3</div>
                  <div className="h-8 rounded bg-primary-container/60 text-on-primary-container flex items-center justify-center text-label-caps font-mono font-bold">4</div>
                  <div className="h-8 rounded bg-primary-container/60 text-on-primary-container flex items-center justify-center text-label-caps font-mono font-bold">5</div>
                  <div className="h-8 rounded bg-surface-container flex items-center justify-center text-label-caps font-mono text-on-surface-variant">6</div>
                  <div className="h-8 rounded bg-surface-container flex items-center justify-center text-label-caps font-mono text-on-surface-variant">7</div>
                </div>
                <div className="absolute top-1 left-[25%] w-[50%] h-10 rounded-md border-2 border-primary/50 bg-primary-container/10 pointer-events-none flex items-end justify-center pb-0.5">
                  <span className="text-[9px] font-mono text-primary font-bold uppercase tracking-wider bg-surface-container-lowest px-1 rounded -bottom-2 relative">Active Window [4]</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-label-md font-mono text-on-surface-variant pt-1">
                <span className="text-primary flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Cumulative ACK 3 Rcvd
                </span>
                <span>Rewind Depth: <strong className="text-on-surface">N Frames</strong></span>
              </div>
            </div>

            {/* Feature Bullet List */}
            <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                <span>Cumulative acknowledgments forward sender base pointer.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                <span>Single hardware base timer for oldest outstanding frame.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                <span>Timeout forces bulk retransmission of all N unacked frames.</span>
              </li>
            </ul>
          </div>

          <div className="pt-space-md mt-space-md border-t border-outline-variant/20 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                onSelectProtocol('go-back-n');
                onNavigate('manual-lab');
              }}
              className="w-full py-2.5 px-4 rounded-full bg-surface-container-high/90 hover:bg-primary-container hover:text-on-primary-container text-primary font-headline-sm text-headline-sm transition-all shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch GBN Lab</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Card 3: Selective Repeat ARQ */}
        <div className="group relative rounded-xl bg-surface-container-low/60 backdrop-blur-2xl p-space-lg flex flex-col justify-between shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-surface-container/60 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-tertiary/80 to-transparent opacity-75" />
          <div className="flex flex-col gap-space-md">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-tertiary uppercase tracking-widest">Protocol 03 • Autonomous Buffer</span>
                <h3 className="font-headline-lg text-headline-lg text-on-surface">Selective Repeat ARQ</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-tertiary-container/20 text-tertiary flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <span className="material-symbols-outlined text-[20px]">select_all</span>
              </div>
            </div>

            {/* Metric Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full bg-surface-container-high/80 text-on-surface text-label-md font-mono">
                Sender <strong className="text-tertiary">N = 4</strong>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-surface-container-high/80 text-on-surface text-label-md font-mono">
                Receiver <strong className="text-tertiary">N = 4</strong>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-surface-container-high/80 text-on-surface text-label-md font-mono">
                <strong className="text-tertiary">M ≥ 2N</strong> Valid
              </span>
            </div>

            {/* Micro Visual: Receiver Out-of-Order Buffer & Independent Timers */}
            <div className="my-space-xs p-space-md rounded-lg bg-surface-container-lowest/80 relative overflow-hidden flex flex-col gap-space-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
              <div className="flex justify-between items-center text-label-caps text-on-surface-variant font-mono">
                <span>RX BUFFER MATRIX</span>
                <span>4 TIMERS ACTIVE</span>
              </div>
              <div className="grid grid-cols-4 gap-2 py-1">
                <div className="p-2 rounded bg-surface-container flex flex-col items-center gap-1 border-t-2 border-tertiary">
                  <span className="text-[10px] font-mono text-tertiary font-bold">F0 (ACK'D)</span>
                  <span className="w-2 h-2 rounded-full bg-tertiary" />
                </div>
                <div className="p-2 rounded bg-surface-container flex flex-col items-center gap-1 border-t-2 border-error">
                  <span className="text-[10px] font-mono text-error font-bold">F1 (LOST)</span>
                  <span className="w-2 h-2 rounded-full bg-error animate-ping" />
                </div>
                <div className="p-2 rounded bg-surface-container flex flex-col items-center gap-1 border-t-2 border-tertiary">
                  <span className="text-[10px] font-mono text-tertiary font-bold">F2 (BUF'D)</span>
                  <span className="w-2 h-2 rounded-full bg-tertiary" />
                </div>
                <div className="p-2 rounded bg-surface-container flex flex-col items-center gap-1 border-t-2 border-tertiary">
                  <span className="text-[10px] font-mono text-tertiary font-bold">F3 (BUF'D)</span>
                  <span className="w-2 h-2 rounded-full bg-tertiary" />
                </div>
              </div>
              <div className="flex items-center justify-between text-label-md font-mono text-on-surface-variant pt-1">
                <span className="text-tertiary flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Retransmit F1 only
                </span>
                <span>Cascade Deliver: <strong className="text-on-surface">3 frames</strong></span>
              </div>
            </div>

            {/* Feature Bullet List */}
            <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                <span>Individual timers allocated to every pending frame.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                <span>Receiver buffers out-of-order frames without discarding.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                <span>Zero redundant retransmissions under lossy wireless links.</span>
              </li>
            </ul>
          </div>

          <div className="pt-space-md mt-space-md border-t border-outline-variant/20 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                onSelectProtocol('selective-repeat');
                onNavigate('manual-lab');
              }}
              className="w-full py-2.5 px-4 rounded-full bg-surface-container-high/90 hover:bg-tertiary hover:text-on-tertiary text-tertiary font-headline-sm text-headline-sm transition-all shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch SR Lab</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Architecture Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
        {/* Left Panel: Deterministic Simulation Engine */}
        <div className="lg:col-span-6 rounded-xl bg-surface-container-low/60 backdrop-blur-2xl p-space-lg flex flex-col justify-between shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.18)]">
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <div className="w-9 h-9 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                  <span className="material-symbols-outlined text-[20px]">code</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider">Virtual Channel Core</span>
                  <h4 className="font-headline-md text-headline-md text-on-surface">Deterministic In-Browser Simulation Engine</h4>
                </div>
              </div>
              <span className="px-space-sm py-0.5 rounded-full bg-surface-container-high text-secondary font-mono text-label-caps font-bold">100% REPEATABLE</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Constructed with a fast 32-bit PRNG and discrete event loop scheduler. Guarantees bit-identical execution replays across edge browsers for predictable academic grading and algorithmic proofs.
            </p>

            {/* Component Specifications Bento */}
            <div className="grid grid-cols-2 gap-space-sm pt-2">
              <div className="p-space-sm rounded-lg bg-surface-container/70 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] flex flex-col gap-1">
                <span className="font-label-caps text-label-caps text-on-surface-variant">RNG GENERATOR</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">Mulberry32</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Deterministic pseudo-random state hashing</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container/70 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] flex flex-col gap-1">
                <span className="font-label-caps text-label-caps text-on-surface-variant">CLOCK RESOLUTION</span>
                <span className="font-headline-sm text-headline-sm text-secondary">Discrete Virtual</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Zero-drift microsecond discrete priority queue</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container/70 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] flex flex-col gap-1">
                <span className="font-label-caps text-label-caps text-on-surface-variant">FAULT INJECTION</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">Per-Frame Loss</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Packet drop, bit-corruption, duplex duplication</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container/70 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] flex flex-col gap-1">
                <span className="font-label-caps text-label-caps text-on-surface-variant">EXECUTION MODE</span>
                <span className="font-headline-sm text-headline-sm text-primary">Stepped &amp; Continuous</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Single-step wire clock or 10,000x bulk run</span>
              </div>
            </div>
          </div>
          <div className="pt-space-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-on-surface-variant font-label-md">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>Zero Native Dependencies</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('internals')}
              className="px-space-md py-1.5 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-lg transition-all shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)] cursor-pointer"
            >
              Inspect Virtual Pipe
            </button>
          </div>
        </div>

        {/* Right Panel: Real OS UDP Socket Studio */}
        <div className="lg:col-span-6 rounded-xl bg-surface-container-low/60 backdrop-blur-2xl p-space-lg flex flex-col justify-between shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.18)]">
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <div className="w-9 h-9 rounded-full bg-primary-container/20 text-primary flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                  <span className="material-symbols-outlined text-[20px]">terminal</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-primary uppercase tracking-wider">Kernel Datagram Pipe</span>
                  <h4 className="font-headline-md text-headline-md text-on-surface">Real OS UDP Socket Studio</h4>
                </div>
              </div>
              <span className="px-space-sm py-0.5 rounded-full bg-surface-container-high text-primary font-mono text-label-caps font-bold">KERNEL DGRAM</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Direct interface to real operating system network stacks via Node.js <code className="text-primary font-mono font-semibold">dgram</code> sockets. Demonstrates protocol resilience against actual OS kernel network drops and real-world Wi-Fi jitter.
            </p>

            {/* Component Specifications Bento */}
            <div className="grid grid-cols-2 gap-space-sm pt-2">
              <div className="p-space-sm rounded-lg bg-surface-container/70 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] flex flex-col gap-1">
                <span className="font-label-caps text-label-caps text-on-surface-variant">SOCKET BINDING</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">Node.js DGRAM</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Direct AF_INET POSIX socket layer interface</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container/70 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] flex flex-col gap-1">
                <span className="font-label-caps text-label-caps text-on-surface-variant">SESSION PROTOCOL</span>
                <span className="font-headline-sm text-headline-sm text-primary">3-Way Handshake</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">SYN / SYN-ACK / ACK state negotiation</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container/70 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] flex flex-col gap-1">
                <span className="font-label-caps text-label-caps text-on-surface-variant">DATA INTEGRITY</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">SHA-256 Digest</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Chunked binary file hash verification</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container/70 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] flex flex-col gap-1">
                <span className="font-label-caps text-label-caps text-on-surface-variant">STREAM BRIDGE</span>
                <span className="font-headline-sm text-headline-sm text-tertiary">WebSocket WSS</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Real-time binary telemetry feed to visor UI</span>
              </div>
            </div>
          </div>
          <div className="pt-space-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-on-surface-variant font-label-md">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Port Range: 8080 - 8092 UDP</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('live-udp')}
              className="px-space-md py-1.5 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-lg transition-all shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)] cursor-pointer"
            >
              Open UDP Port Studio
            </button>
          </div>
        </div>
      </div>

      {/* Quick Telemetry Action Strip */}
      <div className="p-space-md rounded-xl bg-surface-container-lowest/60 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-space-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
        <div className="flex items-center gap-space-md">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface">Theoretical Efficiency Target</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Optimal Window N* = 1 + 2 × (Prop Delay / Transmit Time)</span>
          </div>
        </div>
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-2 font-mono text-label-lg text-on-surface">
            <span className="text-on-surface-variant">N* Calculation:</span>
            <span className="px-2 py-0.5 rounded bg-surface-container text-secondary">N* = 7.42 frames</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('comparison')}
            className="px-space-md py-2 rounded-full bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-fixed transition-all shadow-[0_0_16px_rgba(208,188,255,0.4)] cursor-pointer"
          >
            Auto-Tune Bandwidth-Delay Product
          </button>
        </div>
      </div>
    </div>
  );
};
