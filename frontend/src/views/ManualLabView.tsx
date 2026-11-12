import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useManualLab } from '../hooks/useManualLab';
import { ViewId } from '../types/navigation';

interface ManualLabViewProps {
  onNavigate: (view: ViewId) => void;
}

export const ManualLabView: React.FC<ManualLabViewProps> = () => {
  const lab = useManualLab('go-back-n');

  // Auto-step / play state
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Bottom dock active tab
  const [activeTab, setActiveTab] = useState<'ladder' | 'log' | 'dissector' | 'quiz'>('ladder');
  const [selectedPacketId, setSelectedPacketId] = useState<string | null>(null);

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      const stepInterval = Math.max(20, Math.floor(100 / speedMultiplier));
      playIntervalRef.current = setInterval(() => {
        lab.stepTime(15);
      }, stepInterval);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, speedMultiplier, lab]);

  // Handle preset scenarios
  const handlePreset = (preset: 'normal' | 'loss' | 'damaged' | 'timeout') => {
    lab.resetLab();
    if (preset === 'normal') {
      setTimeout(() => lab.sendNextFrame(), 50);
    } else if (preset === 'loss') {
      setTimeout(() => {
        lab.sendNextFrame();
        setTimeout(() => {
          const pkts = lab.inFlightPackets.filter((p) => p.type === 'DATA');
          if (pkts.length > 0) {
            lab.dropPacket(pkts[0].id);
          }
        }, 100);
      }, 50);
    } else if (preset === 'damaged') {
      setTimeout(() => {
        lab.sendNextFrame();
      }, 50);
    } else if (preset === 'timeout') {
      setTimeout(() => {
        lab.sendNextFrame();
        setTimeout(() => {
          lab.triggerTimeout();
        }, 200);
      }, 50);
    }
  };

  const senderBase = lab.engineState?.senderWindow.base ?? 0;
  const senderNext = lab.engineState?.senderWindow.nextSeqNum ?? 0;
  const windowSize = lab.config.windowSize ?? 4;
  const seqSpace = lab.config.seqNumberSpace ?? 8;
  const receiverBase = lab.engineState?.receiverBase ?? 0;

  // Selected or latest in-flight packet for dissector
  const targetPacket = useMemo(() => {
    if (selectedPacketId) {
      const found = lab.inFlightPackets.find((p) => p.id === selectedPacketId);
      if (found) return found;
    }
    return lab.inFlightPackets[lab.inFlightPackets.length - 1] || null;
  }, [lab.inFlightPackets, selectedPacketId]);

  // Timer analog clock calculation
  const timeoutMs = lab.config.timeoutMs || 400;
  const isTimerActive = lab.hasOutstanding || lab.canTimeout;
  const timerElapsed = isTimerActive ? (lab.virtualTimeMs % timeoutMs) : 0;
  const timerFraction = timeoutMs > 0 && isTimerActive ? timerElapsed / timeoutMs : 0;
  const circumference = 2 * Math.PI * 28; // ~175.93
  const strokeDashoffset = circumference * (1 - timerFraction);
  const needleAngle = -90 + timerFraction * 360;

  return (
    <div className="flex flex-col w-full min-h-screen bg-surface text-on-surface font-body-md select-none pb-8">
      {/* ── TOP WORKBENCH HEADER & CONTROL DECK ────────────────────────────── */}
      <div className="w-full bg-surface-container-low/80 backdrop-blur-xl border-b border-outline-variant/60 rounded-xl mb- space-md shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)]">
        {/* Top Control Bar */}
        <div className="p-space-md flex flex-wrap items-center justify-between gap-space-md">
          {/* Protocol Switcher Pills */}
          <div className="flex items-center gap-space-md">
            <div className="flex items-center p-1 rounded-full bg-surface-container-lowest/80 border border-outline-variant/40 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  lab.setProtocol('stop-and-wait');
                }}
                className={`px-3 py-1 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                  lab.protocol === 'stop-and-wait'
                    ? 'bg-primary text-on-primary font-bold shadow-[0_0_12px_rgba(208,188,255,0.4)]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Stop-and-Wait
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  lab.setProtocol('go-back-n');
                }}
                className={`px-3 py-1 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                  lab.protocol === 'go-back-n'
                    ? 'bg-primary text-on-primary font-bold shadow-[0_0_12px_rgba(208,188,255,0.4)]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Go-Back-N
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  lab.setProtocol('selective-repeat');
                }}
                className={`px-3 py-1 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                  lab.protocol === 'selective-repeat'
                    ? 'bg-primary text-on-primary font-bold shadow-[0_0_12px_rgba(208,188,255,0.4)]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Selective Repeat
              </button>
            </div>

            <div className="h-6 w-[1px] bg-outline-variant/60 hidden sm:block" />

            {/* Run / Pause / Step Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`h-8 px-3 rounded-full flex items-center gap-1.5 font-label-md text-label-md font-bold transition-all shadow-sm cursor-pointer ${
                  isPlaying
                    ? 'bg-tertiary-container text-on-tertiary-container shadow-[0_0_12px_rgba(236,106,6,0.4)]'
                    : 'bg-primary text-on-primary shadow-[0_0_12px_rgba(208,188,255,0.4)]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
                <span>{isPlaying ? 'Pause' : 'Run'}</span>
              </button>

              <button
                type="button"
                onClick={() => lab.stepTime(15)}
                className="h-8 px-3 rounded-full bg-surface-container border border-outline-variant/60 text-on-surface hover:bg-surface-container-high font-label-md text-label-md flex items-center gap-1 transition-all cursor-pointer"
                title="Advance Virtual Time by 15ms"
              >
                <span className="material-symbols-outlined text-[16px]">redo</span>
                <span>+15ms</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  lab.resetLab();
                }}
                className="h-8 w-8 rounded-full bg-surface-container border border-outline-variant/60 text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-all cursor-pointer"
                title="Reset Workbench"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              </button>
            </div>

            {/* Send Next Frame Button */}
            <button
              type="button"
              disabled={!lab.canSend}
              onClick={() => lab.sendNextFrame()}
              className={`h-8 px-3.5 rounded-full font-label-md text-label-md font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                lab.canSend
                  ? 'bg-secondary-container text-on-secondary-container hover:brightness-110 shadow-[0_0_14px_rgba(0,166,224,0.4)]'
                  : 'bg-surface-container-high text-outline cursor-not-allowed opacity-60'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span>Send Next Frame</span>
            </button>
          </div>

          {/* Right Action Tools: Fault Triggers & Speed & Clock */}
          <div className="flex items-center gap-space-md flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const pkts = lab.inFlightPackets.filter((p) => p.status === 'IN_FLIGHT');
                  if (pkts.length > 0) {
                    lab.dropPacket(pkts[0].id);
                  }
                }}
                disabled={lab.inFlightPackets.length === 0}
                className="h-7 px-2.5 rounded-full bg-surface-container border border-outline-variant/60 text-on-surface hover:bg-surface-bright flex items-center gap-1.5 font-label-sm text-label-sm transition-all disabled:opacity-40 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-error" />
                <span>Drop Frame</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  lab.triggerTimeout();
                }}
                disabled={!lab.canTimeout}
                className="h-7 px-2.5 rounded-full bg-surface-container border border-outline-variant/60 text-on-surface hover:bg-surface-bright flex items-center gap-1.5 font-label-sm text-label-sm transition-all disabled:opacity-40 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-tertiary" />
                <span>Timeout (RTO)</span>
              </button>
            </div>

            <div className="h-6 w-[1px] bg-outline-variant/60" />

            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Speed:</span>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.2"
                value={speedMultiplier}
                onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                className="w-20 accent-primary h-1.5 bg-surface-container-high rounded cursor-pointer"
              />
              <span className="font-mono text-code-hex text-on-surface text-[12px]">{speedMultiplier.toFixed(1)}x</span>
            </div>

            <div className="px-3 py-1 rounded-full bg-surface-container border border-outline/50 font-mono text-code-hex text-primary font-bold shadow-inner">
              <span className="text-outline mr-1.5 font-normal">T =</span>
              {lab.virtualTimeMs} ms
            </div>
          </div>
        </div>

        {/* Sub-strip with topology & scenario presets */}
        <div className="w-full border-t border-outline-variant/40 px-space-md py-2 flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-lowest/50 text-body-sm font-body-sm">
          <div className="flex items-center gap-space-md flex-wrap">
            <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-0.5 rounded-full border border-outline-variant/60">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-label-caps text-label-caps font-bold text-on-surface uppercase tracking-wider">
                {lab.protocol === 'stop-and-wait' ? 'SAW Mode (N=1)' : lab.protocol === 'go-back-n' ? 'GBN Mode (N=4, M=8)' : 'SR Mode (N=4, M=8)'}
              </span>
            </div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-mono text-[12px]">
              <span>Topology: <strong className="text-on-surface font-semibold">Point-to-Point Full Duplex</strong></span>
              <span>•</span>
              <span>Prop Delay (Tp): <strong className="text-on-surface font-semibold">{lab.config.oneWayDelayMs}ms</strong></span>
              <span>•</span>
              <span>RTO: <strong className="text-primary font-semibold">{lab.config.timeoutMs}ms</strong></span>
              <span>•</span>
              <span>In-Flight: <strong className="text-secondary font-semibold">{lab.inFlightPackets.length}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-label-caps text-label-caps text-outline uppercase font-semibold">Presets:</span>
            <button
              type="button"
              onClick={() => handlePreset('normal')}
              className="px-2.5 py-0.5 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 font-label-sm text-label-sm text-on-surface transition-all cursor-pointer"
            >
              Normal Flow
            </button>
            <button
              type="button"
              onClick={() => handlePreset('loss')}
              className="px-2.5 py-0.5 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 font-label-sm text-label-sm text-error font-bold transition-all cursor-pointer"
            >
              Lost Frame #0
            </button>
            <button
              type="button"
              onClick={() => handlePreset('timeout')}
              className="px-2.5 py-0.5 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 font-label-sm text-label-sm text-tertiary font-bold transition-all cursor-pointer"
            >
              Timer Expiry (RTO)
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKBENCH: 3-CHASSIS DUAL OPTICAL WIRE STAGE ────────────── */}
      <div className="w-full grid grid-cols-12 gap-space-md items-start">
        {/* LEFT CHASSIS: HOST A (SENDER / TX) */}
        <section className="col-span-12 xl:col-span-3 flex flex-col gap-space-md">
          <div className="bg-surface-container-low/70 border-2 border-primary/40 rounded-xl shadow-[0_16px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden backdrop-blur-xl">
            {/* Head */}
            <div className="bg-surface-container px-space-md py-2.5 flex items-center justify-between border-b border-outline-variant/60">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary ring-2 ring-primary/20" />
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight leading-none">HOST A — SENDER</h2>
                  <span className="font-mono text-[10px] text-outline">MAC: 0A:14:FE:91:00:A1</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2 py-0.5 rounded-full border border-outline-variant/60">
                <span className={`w-2 h-2 rounded-full ${lab.canSend ? 'bg-primary animate-ping' : 'bg-tertiary'}`} />
                <span className="font-mono text-[10px] font-bold text-primary">
                  {lab.canSend ? 'TX READY' : 'WIN BLOCKED'}
                </span>
              </div>
            </div>

            <div className="p-space-md flex flex-col gap-space-md">
              {/* TX Window Track with Active Sliding Bracket */}
              <div className="bg-surface-container-lowest/80 p-space-sm rounded-lg border border-outline-variant/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-caps text-label-caps font-bold text-on-surface uppercase tracking-wide">
                    TX Window Track [Sw = {windowSize}]
                  </span>
                  <span className="font-mono text-[11px] text-primary font-bold">
                    Sf={senderBase} • Sn={senderNext} • M={seqSpace}
                  </span>
                </div>

                {/* Pointer Badges */}
                <div className="grid grid-cols-8 gap-1 mb-1 text-center font-mono text-[10px]">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const isSf = i === senderBase % 8;
                    const isSn = i === senderNext % 8;
                    return (
                      <div key={i} className="col-span-1">
                        {isSf && isSn ? (
                          <span className="text-secondary font-bold">▲Sf/Sn</span>
                        ) : isSf ? (
                          <span className="text-primary font-bold">▲Sf</span>
                        ) : isSn ? (
                          <span className="text-secondary font-bold">▲Sn</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {/* Buffer Slots 0..7 with Mounted Sliding Window Bracket */}
                <div className="relative p-1 rounded-lg bg-surface-container-low border border-outline-variant/80">
                  {/* Sliding Window Bracket Overlay */}
                  <div
                    className="absolute top-0 bottom-0 border-2 border-primary bg-primary/10 rounded pointer-events-none z-10 flex justify-between items-start px-1 transition-all duration-300 shadow-[0_0_12px_rgba(208,188,255,0.25)]"
                    style={{
                      left: `${((senderBase % 8) / 8) * 100}%`,
                      width: `${(Math.min(windowSize, 8 - (senderBase % 8)) / 8) * 100}%`,
                    }}
                  >
                    <span className="text-[9px] font-bold text-primary bg-surface-container-lowest px-1 rounded -mt-2 shadow-xs">
                      [Sf={senderBase}
                    </span>
                    <span className="text-[9px] font-bold text-primary bg-surface-container-lowest px-1 rounded -mt-2 shadow-xs">
                      Sw]
                    </span>
                  </div>

                  <div className="grid grid-cols-8 gap-1 relative z-0">
                    {Array.from({ length: 8 }).map((_, idx) => {
                      const isSentUnacked = idx >= senderBase && idx < senderNext;
                      const isNextToSend = idx === senderNext;
                      const isInsideWindow = idx >= senderBase && idx < senderBase + windowSize;

                      return (
                        <div
                          key={idx}
                          className={`h-11 rounded flex flex-col items-center justify-center font-mono text-[11px] font-bold transition-all ${
                            isSentUnacked
                              ? 'bg-primary text-on-primary border border-primary-container shadow-xs'
                              : isNextToSend && isInsideWindow
                              ? 'bg-secondary text-on-secondary border border-secondary shadow-xs'
                              : isInsideWindow
                              ? 'bg-surface-container text-on-surface border border-outline-variant/60'
                              : 'bg-surface-container-lowest text-outline/50 border border-outline-variant/30'
                          }`}
                        >
                          <span>#{idx}</span>
                          <span className="text-[8px] uppercase leading-none opacity-90">
                            {isSentUnacked ? 'SENT' : isNextToSend && isInsideWindow ? 'NEXT' : isInsideWindow ? 'AVAIL' : 'LOCKED'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-outline mt-1.5 px-0.5">
                  <span className="text-primary font-semibold">Cyan: Sent unACKed</span>
                  <span className="text-secondary font-semibold">Blue: Next TX</span>
                  <span>Gray: Locked</span>
                </div>
              </div>

              {/* Round Hardware Retransmission Timer Analog Face */}
              <div className="bg-surface-container-lowest/80 border border-outline-variant/60 rounded-lg p-space-sm flex items-center gap-space-md shadow-inner">
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="transparent" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke={timerFraction > 0.8 ? '#ef4444' : '#d0bcff'}
                      strokeWidth="4"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-150"
                    />
                  </svg>
                  {/* Center pin and needle */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className="w-0.5 h-6 bg-error origin-bottom -translate-y-3 rounded-full shadow-xs transition-transform duration-150"
                      style={{ transform: `translateY(-12px) rotate(${needleAngle}deg)` }}
                    />
                    <div className="w-2 h-2 rounded-full bg-on-surface ring-2 ring-primary" />
                  </div>
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps uppercase font-bold text-on-surface">Sf Retransmit Timer</span>
                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${isTimerActive ? 'bg-primary/20 text-primary animate-pulse' : 'bg-surface-container text-outline'}`}>
                      {isTimerActive ? 'RUNNING' : 'IDLE'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">{timerElapsed}</span>
                    <span className="font-mono text-[11px] text-outline">/ {timeoutMs} ms</span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all duration-150 ${timerFraction > 0.8 ? 'bg-error' : 'bg-primary'}`}
                      style={{ width: `${Math.min(100, timerFraction * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-body-sm text-on-surface-variant mt-1 truncate">
                    Bound to oldest outstanding frame (Frame #{senderBase})
                  </span>
                </div>
              </div>

              {/* Host A Hardware Registers */}
              <div className="bg-surface-container-lowest/80 border border-outline-variant/60 rounded-lg p-space-sm">
                <span className="font-label-caps text-label-caps font-bold text-on-surface uppercase block mb-1">
                  Host A Hardware Registers
                </span>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="bg-surface-container p-1.5 rounded border border-outline-variant/40 flex items-center justify-between">
                    <span className="text-outline">Sf (Base):</span>
                    <span className="font-bold text-primary">{senderBase}</span>
                  </div>
                  <div className="bg-surface-container p-1.5 rounded border border-outline-variant/40 flex items-center justify-between">
                    <span className="text-outline">Sn (Next):</span>
                    <span className="font-bold text-secondary">{senderNext}</span>
                  </div>
                  <div className="bg-surface-container p-1.5 rounded border border-outline-variant/40 flex items-center justify-between">
                    <span className="text-outline">Sw (Cap):</span>
                    <span className="font-bold text-on-surface">{windowSize} Frames</span>
                  </div>
                  <div className="bg-surface-container p-1.5 rounded border border-outline-variant/40 flex items-center justify-between">
                    <span className="text-outline">RTO Limit:</span>
                    <span className="font-bold text-error">{timeoutMs} ms</span>
                  </div>
                </div>
              </div>

              {/* Classroom Live Controls */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  disabled={!lab.canSend}
                  onClick={() => lab.sendNextFrame()}
                  className="h-8 px-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold flex items-center justify-center gap-1 hover:brightness-105 shadow-xs disabled:opacity-40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">upload</span>
                  <span>Send Next (#{senderNext % seqSpace})</span>
                </button>
                <button
                  type="button"
                  disabled={!lab.canTimeout}
                  onClick={() => lab.triggerTimeout()}
                  className="h-8 px-2 rounded-lg bg-surface-container border border-outline-variant/60 text-on-surface font-label-md text-label-md flex items-center justify-center gap-1 hover:bg-surface-container-high disabled:opacity-40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">timer_off</span>
                  <span>Force Timeout</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CENTER CANVAS: DUAL OPTICAL TRANSMISSION CONDUIT */}
        <main className="col-span-12 xl:col-span-6 flex flex-col gap-space-md">
          <div className="bg-surface-container-low/70 border-2 border-outline-variant/60 rounded-xl shadow-[0_16px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] p-space-md flex flex-col gap-space-md relative overflow-hidden backdrop-blur-xl">
            {/* Conduit Title & Wire Quality Metrics */}
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">cable</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">FULL-DUPLEX FIBER CHANNEL STAGE</h2>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-outline">Length: <strong className="text-on-surface">500 km</strong></span>
                <span className="text-outline">Prop: <strong className="text-on-surface">2.0×10⁸ m/s</strong></span>
                <span className="text-outline">Loss Rate: <strong className="text-secondary font-bold">0.00% (Manual)</strong></span>
              </div>
            </div>

            {/* FORWARD LINK: DATA PIPE (HOST A -> HOST B) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between font-label-caps text-label-caps">
                <span className="text-primary font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  FORWARD LINK: DATA PIPE (HOST A → HOST B)
                </span>
                <span className="text-outline font-mono">MTU 1500B • 100 Mbps Line Rate</span>
              </div>

              {/* Physical Conduit */}
              <div className="relative h-28 bg-surface-container-lowest rounded-lg border-2 border-primary/30 p-2 flex items-center overflow-hidden shadow-inner">
                {/* Internal optical core line */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-primary/20 border-y border-primary/40" />

                {/* Scale distance marks */}
                <div className="absolute inset-x-4 top-1 flex justify-between font-mono text-[9px] text-outline select-none pointer-events-none">
                  <span>TX A (0%)</span>
                  <span>100 km (20%)</span>
                  <span>250 km (50%)</span>
                  <span>400 km (80%)</span>
                  <span>RX B (100%)</span>
                </div>

                {/* Flying DATA Packets */}
                {lab.inFlightPackets
                  .filter((p) => p.type === 'DATA')
                  .map((pkt) => {
                    const elapsed = Math.max(0, lab.virtualTimeMs - pkt.dispatchTimeMs);
                    const total = Math.max(1, pkt.scheduledDeliveryTimeMs - pkt.dispatchTimeMs);
                    const progress = Math.min(100, Math.max(5, (elapsed / total) * 100));
                    const isDropped = pkt.status === 'DROPPED';
                    const seq = (pkt.frame as any)?.seqNum ?? 0;

                    return (
                      <div
                        key={pkt.id}
                        onClick={() => setSelectedPacketId(pkt.id)}
                        className={`absolute top-3 -translate-x-1/2 cursor-pointer group transition-all duration-150 z-20 ${
                          isDropped ? 'rotate-12 opacity-80' : 'hover:scale-110'
                        }`}
                        style={{ left: `${progress}%` }}
                        title="Click to inspect or deliver/drop"
                      >
                        <div
                          className={`rounded px-2.5 py-1 shadow-md border flex flex-col items-center ${
                            isDropped
                              ? 'bg-error-container text-on-error-container border-error'
                              : 'bg-primary text-on-primary border-primary-container shadow-[0_0_12px_rgba(208,188,255,0.4)]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-mono font-bold text-[11px]">
                            <span className={`w-1.5 h-1.5 rounded-full ${isDropped ? 'bg-error' : 'bg-white animate-ping'}`} />
                            <span>DATA #{seq}</span>
                          </div>
                          <div className="text-[9px] font-mono opacity-90 flex gap-1 leading-none mt-0.5">
                            <span>1024B</span>
                            <span>•</span>
                            <span>CRC:OK</span>
                          </div>
                        </div>
                        <div className="text-center font-mono text-[9px] text-primary font-bold mt-0.5">
                          {isDropped ? 'DROPPED' : `${progress.toFixed(0)}% →`}
                        </div>
                      </div>
                    );
                  })}

                {lab.inFlightPackets.filter((p) => p.type === 'DATA').length === 0 && (
                  <div className="w-full text-center font-mono text-[11px] text-outline/60 italic">
                    Conduit idle. Press &quot;Send Next Frame&quot; to inject a payload.
                  </div>
                )}
              </div>
            </div>

            {/* INTERACTIVE IN-TRANSIT MANIPULATOR STRIP */}
            <div className="bg-surface-container p-2 rounded-lg border border-outline-variant/60 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[18px]">bolt</span>
                <span className="font-label-caps text-label-caps font-bold text-on-surface">Channel Impairment Injector:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const pkts = lab.inFlightPackets.filter((p) => p.status === 'IN_FLIGHT');
                    if (pkts.length > 0) {
                      lab.dropPacket(pkts[0].id);
                    }
                  }}
                  disabled={lab.inFlightPackets.filter((p) => p.status === 'IN_FLIGHT').length === 0}
                  className="h-6 px-2.5 rounded-full bg-error text-on-error font-mono text-[11px] font-bold hover:brightness-110 flex items-center gap-1 shadow-xs disabled:opacity-40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">delete_sweep</span>
                  <span>Drop Oldest</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pkts = lab.inFlightPackets.filter((p) => p.status === 'IN_FLIGHT');
                    if (pkts.length > 0) {
                      lab.delayPacket(pkts[0].id, 100);
                    }
                  }}
                  disabled={lab.inFlightPackets.filter((p) => p.status === 'IN_FLIGHT').length === 0}
                  className="h-6 px-2.5 rounded-full bg-surface-container-high border border-outline-variant/60 text-on-surface font-mono text-[11px] hover:bg-surface-bright flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">hourglass_top</span>
                  <span>+100ms Jitter</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pkts = lab.inFlightPackets.filter((p) => p.status === 'IN_FLIGHT');
                    if (pkts.length > 0) {
                      lab.deliverPacket(pkts[0].id);
                    }
                  }}
                  disabled={lab.inFlightPackets.filter((p) => p.status === 'IN_FLIGHT').length === 0}
                  className="h-6 px-2.5 rounded-full bg-primary-container text-on-primary-container font-mono text-[11px] font-bold hover:brightness-110 flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">check</span>
                  <span>Deliver Now</span>
                </button>
              </div>
            </div>

            {/* REVERSE LINK: ACK PIPE (HOST B -> HOST A) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between font-label-caps text-label-caps">
                <span className="text-secondary font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                  REVERSE LINK: ACK PIPE (HOST B → HOST A)
                </span>
                <span className="text-outline font-mono">Cumulative ACKs • Header Only 32B</span>
              </div>

              {/* Physical Return Conduit */}
              <div className="relative h-24 bg-surface-container-lowest rounded-lg border-2 border-secondary/30 p-2 flex items-center overflow-hidden shadow-inner">
                {/* Optical core line */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-secondary/20 border-y border-secondary/40" />

                <div className="absolute inset-x-4 top-1 flex justify-between font-mono text-[9px] text-outline select-none pointer-events-none">
                  <span>RX A (100%)</span>
                  <span>250 km (50%)</span>
                  <span>TX B (0%)</span>
                </div>

                {/* Flying ACK Packets (returning Right to Left) */}
                {lab.inFlightPackets
                  .filter((p) => p.type === 'ACK')
                  .map((pkt) => {
                    const elapsed = Math.max(0, lab.virtualTimeMs - pkt.dispatchTimeMs);
                    const total = Math.max(1, pkt.scheduledDeliveryTimeMs - pkt.dispatchTimeMs);
                    const progress = Math.min(100, Math.max(5, (elapsed / total) * 100));
                    // Returning from right (100%) to left (0%)
                    const leftPos = Math.max(5, Math.min(95, 100 - progress));
                    const ackNum = (pkt.frame as any)?.ackNum ?? 0;
                    const isDropped = pkt.status === 'DROPPED';

                    return (
                      <div
                        key={pkt.id}
                        onClick={() => setSelectedPacketId(pkt.id)}
                        className={`absolute top-3 -translate-x-1/2 cursor-pointer group transition-all duration-150 z-20 ${
                          isDropped ? 'rotate-12 opacity-80' : 'hover:scale-110'
                        }`}
                        style={{ left: `${leftPos}%` }}
                        title="Click to drop or deliver ACK"
                      >
                        <div
                          className={`rounded px-2.5 py-1 shadow-md border flex flex-col items-center ${
                            isDropped
                              ? 'bg-error-container text-on-error-container border-error'
                              : 'bg-secondary-container text-on-secondary-container border-secondary shadow-[0_0_12px_rgba(0,166,224,0.4)]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-mono font-bold text-[11px]">
                            <span className={`w-1.5 h-1.5 rounded-full ${isDropped ? 'bg-error' : 'bg-white animate-pulse'}`} />
                            <span>ACK #{ackNum}</span>
                          </div>
                          <div className="text-[9px] font-mono opacity-90 leading-none mt-0.5">
                            Expect: #{ackNum}
                          </div>
                        </div>
                        <div className="text-center font-mono text-[9px] text-secondary font-bold mt-0.5">
                          {isDropped ? 'DROPPED' : `← ${progress.toFixed(0)}%`}
                        </div>
                      </div>
                    );
                  })}

                {lab.inFlightPackets.filter((p) => p.type === 'ACK').length === 0 && (
                  <div className="w-full text-center font-mono text-[11px] text-outline/60 italic">
                    Reverse conduit clear. Awaiting receiver acknowledgment return.
                  </div>
                )}
              </div>
            </div>

            {/* 3-Tier Layered Stack Preview Mini-Card */}
            <div className="bg-surface-container-lowest/80 border border-outline-variant/60 rounded-lg p-space-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-outline text-[18px]">layers</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">Data Encapsulation Hierarchy (OSI Model)</span>
                </div>
                <span className="font-mono text-[11px] text-primary font-bold">Standard RFC 793 / ISO 3309</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                <div className="bg-surface-container p-2 rounded border border-outline-variant/40 flex flex-col items-center justify-center">
                  <span className="text-outline uppercase text-[9px]">Layer 3 (Network)</span>
                  <strong className="text-on-surface mt-0.5">Packet Data Unit</strong>
                  <span className="text-[10px] text-on-surface-variant">↓ Passes to DLL</span>
                </div>
                <div className="bg-primary-container/20 p-2 rounded border-2 border-primary flex flex-col items-center justify-center shadow-[0_0_12px_rgba(208,188,255,0.2)]">
                  <span className="text-primary uppercase font-bold text-[9px]">Layer 2 (Data Link) ★</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="bg-surface-container px-1 rounded text-outline text-[9px]">HDR</span>
                    <span className="bg-primary text-on-primary px-1 rounded text-[9px]">PAYLOAD</span>
                    <span className="bg-tertiary text-on-tertiary px-1 rounded text-[9px]">CRC32</span>
                  </div>
                  <span className="text-[10px] text-primary font-bold">Flow &amp; Error Control</span>
                </div>
                <div className="bg-surface-container p-2 rounded border border-outline-variant/40 flex flex-col items-center justify-center">
                  <span className="text-outline uppercase text-[9px]">Layer 1 (Physical)</span>
                  <strong className="text-on-surface mt-0.5">Optical Bitstream</strong>
                  <span className="text-[10px] text-on-surface-variant">NRZ-I Signal Stream</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT CHASSIS: HOST B (RECEIVER / RX) */}
        <section className="col-span-12 xl:col-span-3 flex flex-col gap-space-md">
          <div className="bg-surface-container-low/70 border-2 border-primary/40 rounded-xl shadow-[0_16px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden backdrop-blur-xl">
            {/* Head */}
            <div className="bg-surface-container px-space-md py-2.5 flex items-center justify-between border-b border-outline-variant/60">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary ring-2 ring-secondary/20" />
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight leading-none">HOST B — RECEIVER</h2>
                  <span className="font-mono text-[10px] text-outline">MAC: 0A:14:FE:91:00:B2</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2 py-0.5 rounded-full border border-outline-variant/60">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="font-mono text-[10px] font-bold text-secondary">RX LISTENING</span>
              </div>
            </div>

            <div className="p-space-md flex flex-col gap-space-md">
              {/* Receiver Window Track with Mounted Bracket */}
              <div className="bg-surface-container-lowest/80 p-space-sm rounded-lg border border-outline-variant/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-caps text-label-caps font-bold text-on-surface uppercase tracking-wide">
                    RX Window Track [Rw = {lab.protocol === 'selective-repeat' ? windowSize : 1}]
                  </span>
                  <span className="font-mono text-[11px] text-secondary font-bold">
                    Rn = {receiverBase} • {lab.protocol === 'selective-repeat' ? 'Buffered' : 'Strictly Ordered'}
                  </span>
                </div>

                {/* Pointer Badges */}
                <div className="grid grid-cols-8 gap-1 mb-1 text-center font-mono text-[10px]">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="col-span-1">
                      {i === receiverBase % 8 ? (
                        <span className="text-secondary font-bold">▲Rn={receiverBase}</span>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* Buffer Array 0..7 */}
                <div className="relative p-1 rounded-lg bg-surface-container-low border border-outline-variant/80">
                  {/* Sliding Window Bracket for Receiver */}
                  <div
                    className="absolute top-0 bottom-0 border-2 border-secondary bg-secondary/10 rounded pointer-events-none z-10 flex justify-center items-start transition-all duration-300 shadow-[0_0_12px_rgba(123,208,255,0.25)]"
                    style={{
                      left: `${((receiverBase % 8) / 8) * 100}%`,
                      width: `${((lab.protocol === 'selective-repeat' ? windowSize : 1) / 8) * 100}%`,
                    }}
                  >
                    <span className="text-[9px] font-bold text-secondary bg-surface-container-lowest px-1 rounded -mt-2 shadow-xs">
                      [Rn]
                    </span>
                  </div>

                  <div className="grid grid-cols-8 gap-1 relative z-0">
                    {Array.from({ length: 8 }).map((_, idx) => {
                      const isExpected = idx === receiverBase % 8;
                      const isDelivered = idx < receiverBase;

                      return (
                        <div
                          key={idx}
                          className={`h-11 rounded flex flex-col items-center justify-center font-mono text-[11px] font-bold transition-all ${
                            isExpected
                              ? 'bg-secondary text-on-secondary border border-secondary shadow-xs'
                              : isDelivered
                              ? 'bg-surface-container-high text-primary border border-outline-variant/60'
                              : 'bg-surface-container-lowest text-outline/50 border border-outline-variant/30'
                          }`}
                        >
                          <span>#{idx}</span>
                          <span className="text-[8px] uppercase leading-none opacity-90">
                            {isExpected ? 'EXPECT' : isDelivered ? '✓ACK' : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-outline mt-1.5 px-0.5">
                  <span>Protocol rule:</span>
                  <span className="text-on-surface-variant font-bold">
                    {lab.protocol === 'go-back-n'
                      ? 'Discard any frame != Rn'
                      : lab.protocol === 'stop-and-wait'
                      ? 'Lockstep bit toggle'
                      : 'Buffer out-of-order frames'}
                  </span>
                </div>
              </div>

              {/* Host B Hardware Registers */}
              <div className="bg-surface-container-lowest/80 border border-outline-variant/60 rounded-lg p-space-sm">
                <span className="font-label-caps text-label-caps font-bold text-on-surface uppercase block mb-1">
                  Host B Hardware Registers
                </span>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="bg-surface-container p-1.5 rounded border border-outline-variant/40 flex items-center justify-between">
                    <span className="text-outline">Rn (Next):</span>
                    <span className="font-bold text-secondary">{receiverBase}</span>
                  </div>
                  <div className="bg-surface-container p-1.5 rounded border border-outline-variant/40 flex items-center justify-between">
                    <span className="text-outline">Rw (Cap):</span>
                    <span className="font-bold text-on-surface">{lab.protocol === 'selective-repeat' ? windowSize : 1} Frame</span>
                  </div>
                  <div className="bg-surface-container p-1.5 rounded border border-outline-variant/40 flex items-center justify-between">
                    <span className="text-outline">Delivered:</span>
                    <span className="font-bold text-primary">{receiverBase} Total</span>
                  </div>
                  <div className="bg-surface-container p-1.5 rounded border border-outline-variant/40 flex items-center justify-between">
                    <span className="text-outline">RX Buffer:</span>
                    <span className="font-bold text-primary">CLEAR</span>
                  </div>
                </div>
              </div>

              {/* Application Inbox (Delivered Frames Stream) */}
              <div className="bg-surface-container-lowest/80 border border-outline-variant/60 rounded-lg p-space-sm flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps font-bold text-on-surface uppercase">Delivered App Inbox</span>
                  <span className="font-mono text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full font-bold">
                    {receiverBase} Total Frames
                  </span>
                </div>
                <div className="border border-outline-variant/60 rounded-lg overflow-hidden max-h-36 overflow-y-auto">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="bg-surface-container text-[10px] text-outline border-b border-outline-variant/60 uppercase">
                      <tr>
                        <th className="py-1 px-2">Seq</th>
                        <th className="py-1 px-2">Bytes</th>
                        <th className="py-1 px-2">Checksum</th>
                        <th className="py-1 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                      {Array.from({ length: receiverBase }).map((_, i) => (
                        <tr key={i} className="bg-surface-container-lowest hover:bg-surface-container/60 transition-colors">
                          <td className="py-1 px-2 font-bold text-primary">#{i}</td>
                          <td className="py-1 px-2">1024 B</td>
                          <td className="py-1 px-2 text-primary font-bold">0x4BA2 ✓</td>
                          <td className="py-1 px-2 text-primary font-bold">Passed to L3</td>
                        </tr>
                      ))}
                      {receiverBase === 0 && (
                        <tr>
                          <td colSpan={4} className="py-3 px-2 text-center text-outline/60 italic text-[11px]">
                            Inbox empty. Waiting for first frame arrival.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Protocol Note Callout */}
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-space-sm flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0">info</span>
                <div className="flex flex-col text-[11px] font-body-sm text-on-surface">
                  <strong className="font-label-caps text-label-caps text-primary uppercase">Protocol Invariant</strong>
                  <span>
                    {lab.protocol === 'go-back-n'
                      ? 'Go-Back-N requires receiver window size = 1. Any out-of-order frame is strictly discarded.'
                      : lab.protocol === 'selective-repeat'
                      ? 'Selective Repeat accepts out-of-order frames within receiver window and buffers until gap fill.'
                      : 'Stop-and-Wait enforces strictly 1 unacknowledged frame with bit inversion.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── DOCKABLE BOTTOM INSPECTION STRIP ────────────────────────────── */}
      <footer className="w-full mt-space-md bg-surface-container-low/80 backdrop-blur-2xl border border-outline-variant/60 rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex flex-col h-80">
        {/* Tab Strip Header */}
        <div className="h-10 px-space-md border-b border-outline-variant/60 flex items-center justify-between bg-surface-container shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('ladder')}
              className={`px-3.5 h-10 border-b-2 font-label-md text-label-md flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ladder'
                  ? 'border-primary text-primary font-bold bg-surface-container-lowest/80'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">waterfall_chart</span>
              <span>Space-Time Ladder Sequence</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('log')}
              className={`px-3.5 h-10 border-b-2 font-label-md text-label-md flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'log'
                  ? 'border-primary text-primary font-bold bg-surface-container-lowest/80'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">notes</span>
              <span>Protocol Reason Log ({lab.events.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dissector')}
              className={`px-3.5 h-10 border-b-2 font-label-md text-label-md flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'dissector'
                  ? 'border-primary text-primary font-bold bg-surface-container-lowest/80'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">data_object</span>
              <span>Frame Bit Dissector (Wireshark)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className={`px-3.5 h-10 border-b-2 font-label-md text-label-md flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'quiz'
                  ? 'border-primary text-primary font-bold bg-surface-container-lowest/80'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">school</span>
              <span>Classroom Exercises &amp; Quiz</span>
            </button>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-outline">
            <span>Timeline Window: <strong>0ms – {lab.virtualTimeMs}ms</strong></span>
            <span>•</span>
            <span className="text-primary font-semibold">Ready</span>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-space-md overflow-y-auto">
          {activeTab === 'ladder' && (
            <div className="flex flex-col gap-2 h-full">
              <div className="flex items-center justify-between font-label-caps text-label-caps text-outline border-b border-outline-variant/40 pb-1">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span>HOST A TIMELINE (TX)</span>
                </div>
                <span className="font-mono text-[10px]">DIAGONAL PROPAGATION SLOPE = {lab.config.oneWayDelayMs}ms</span>
                <div className="flex items-center gap-2 text-secondary font-bold">
                  <span>HOST B TIMELINE (RX)</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                </div>
              </div>

              {/* Ladder Diagram Entries */}
              <div className="flex flex-col gap-2 pt-2 font-mono text-[11px]">
                {lab.events
                  .filter((e) => e.type === 'FRAME_TRANSMITTED' || e.type === 'ACK_TRANSMITTED' || e.type === 'TIMEOUT' || e.type === 'FRAME_DROPPED')
                  .slice(-8)
                  .map((ev, i) => {
                    const isTx = ev.type === 'FRAME_TRANSMITTED';
                    const isAck = ev.type === 'ACK_TRANSMITTED';
                    const isTimeout = ev.type === 'TIMEOUT';
                    const isLoss = ev.type === 'FRAME_DROPPED';

                    return (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-surface-container-lowest/60 border border-outline-variant/30">
                        <span className="text-outline font-semibold w-16">{ev.virtualTimestamp}ms</span>
                        <div className="flex-1 px-4 flex items-center justify-center">
                          {isTx && (
                            <span className="text-primary font-bold flex items-center gap-2">
                              DATA #{ev.details.seqNum ?? 0} ───────────────►
                            </span>
                          )}
                          {isAck && (
                            <span className="text-secondary font-bold flex items-center gap-2">
                              ◄─────────────── ACK #{ev.details.ackNum ?? 0}
                            </span>
                          )}
                          {isTimeout && (
                            <span className="text-error font-bold flex items-center gap-2">
                              × TIMEOUT on Frame #{ev.details.seqNum ?? 0}
                            </span>
                          )}
                          {isLoss && (
                            <span className="text-error font-bold flex items-center gap-2">
                              × PACKET LOSS mid-channel
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-on-surface-variant max-w-xs truncate text-right">
                          {ev.details.description}
                        </span>
                      </div>
                    );
                  })}

                {lab.events.length === 0 && (
                  <div className="text-center py-8 text-outline/60 italic font-mono text-[12px]">
                    No ladder events recorded yet. Click &quot;Send Next Frame&quot; to begin transmitting frames.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'log' && (
            <div className="flex flex-col gap-1.5 font-mono text-[11px]">
              {lab.events.slice(-15).reverse().map((ev, i) => (
                <div key={i} className="p-1.5 rounded bg-surface-container-lowest/60 border border-outline-variant/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-outline font-semibold">{ev.virtualTimestamp}ms</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      ev.type.includes('DROP') || ev.type.includes('TIMEOUT')
                        ? 'bg-error/20 text-error'
                        : ev.type.includes('ACK')
                        ? 'bg-secondary/20 text-secondary'
                        : 'bg-primary/20 text-primary'
                    }`}>
                      {ev.type}
                    </span>
                    <span className="text-on-surface">{ev.details.description}</span>
                  </div>
                  <span className="text-[10px] text-outline">{ev.details.senderWindow ? `Sf=${ev.details.senderWindow.base} Sn=${ev.details.senderWindow.nextSeqNum}` : ''}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'dissector' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md font-mono text-[12px]">
              <div className="bg-surface-container-lowest/80 p-space-sm rounded-lg border border-outline-variant/60 flex flex-col gap-2">
                <span className="font-label-caps text-label-caps uppercase text-primary font-bold">Encapsulated Frame Fields</span>
                <div className="divide-y divide-outline-variant/30 text-[11px]">
                  <div className="py-1 flex justify-between">
                    <span className="text-outline">Preamble / Start Delimiter:</span>
                    <span className="text-on-surface font-bold">0x7E (01111110 HDLC)</span>
                  </div>
                  <div className="py-1 flex justify-between">
                    <span className="text-outline">Frame Type:</span>
                    <span className="text-primary font-bold">{targetPacket?.type || 'DATA (Information Frame)'}</span>
                  </div>
                  <div className="py-1 flex justify-between">
                    <span className="text-outline">Sequence Field (3-bit):</span>
                    <span className="text-secondary font-bold">#{(targetPacket?.frame as any)?.seqNum ?? 0}</span>
                  </div>
                  <div className="py-1 flex justify-between">
                    <span className="text-outline">Payload Size:</span>
                    <span className="text-on-surface font-bold">1024 Bytes</span>
                  </div>
                  <div className="py-1 flex justify-between">
                    <span className="text-outline">CRC-32 Checksum:</span>
                    <span className="text-tertiary font-bold">0x8FA1204C (VALID ✓)</span>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest/80 p-space-sm rounded-lg border border-outline-variant/60 flex flex-col gap-2">
                <span className="font-label-caps text-label-caps uppercase text-secondary font-bold">Raw Hex Dissector Dump</span>
                <div className="bg-surface-container p-2 rounded text-[11px] leading-relaxed text-on-surface-variant font-mono">
                  0000   7e 00 0a 14 fe 91 00 a1  00 0a 14 fe 91 00 b2 08   ~...............<br />
                  0010   00 45 00 04 00 1a 2b 40  00 40 11 7c 4a c0 a8 01   .E....+@.@.|J...<br />
                  0020   0a c0 a8 01 14 1f 90 1f  91 03 ec 00 00 44 61 74   .............Dat<br />
                  0030   61 20 50 61 79 6c 6f 61  64 20 23 30 8f a1 20 4c   a Payload #0.. L
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md text-body-sm font-body-sm">
              <div className="p-space-sm rounded-lg bg-surface-container-lowest/80 border border-outline-variant/60 flex flex-col gap-1.5">
                <strong className="text-primary font-label-md text-label-md">Q1: What triggers a Go-Back-N retransmission?</strong>
                <p className="text-on-surface-variant text-[12px]">
                  Expiration of the single hardware timer associated with the oldest unacknowledged frame (Sf). The sender rewinds to Sf and retransmits all N frames in the window.
                </p>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-lowest/80 border border-outline-variant/60 flex flex-col gap-1.5">
                <strong className="text-secondary font-label-md text-label-md">Q2: Why does Selective Repeat eliminate redundant retransmissions?</strong>
                <p className="text-on-surface-variant text-[12px]">
                  Each outstanding frame maintains its own dedicated timer, and the receiver provides an out-of-order buffer so only the dropped packet is retransmitted.
                </p>
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
