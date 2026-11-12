import React, { useState, useEffect } from 'react';
import { ViewId } from '../types/navigation';

interface ProtocolInternalsViewProps {
  onNavigate?: (view: ViewId) => void;
}

export const ProtocolInternalsView: React.FC<ProtocolInternalsViewProps> = () => {
  const [protocol, setProtocol] = useState<'saw' | 'gbn' | 'sr'>('gbn');
  const [stepIndex, setStepIndex] = useState(2);
  const [isAutoStepping, setIsAutoStepping] = useState(false);
  const [bitErrorInjected, setBitErrorInjected] = useState(false);

  // Auto step loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isAutoStepping) {
      timer = setInterval(() => {
        setStepIndex((prev) => (prev % 4) + 1);
      }, 2000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoStepping]);

  const stepForward = () => {
    setStepIndex((prev) => (prev % 4) + 1);
  };

  const resetStack = () => {
    setIsAutoStepping(false);
    setStepIndex(1);
    setBitErrorInjected(false);
  };

  const getStageDescription = () => {
    switch (stepIndex) {
      case 1:
        return 'Step 1 of 4: Upper Application/Network Layer PDU Ingress';
      case 2:
        return 'Step 2 of 4: Data Link Framing & CRC-32 Generated';
      case 3:
        return 'Step 3 of 4: Physical Layer Serialization (NRZ-I Stream)';
      case 4:
        return 'Step 4 of 4: Receiver Demultiplexing & CRC Verification';
      default:
        return 'Step 2 of 4: Data Link Framing Active';
    }
  };

  return (
    <div className="relative w-full flex flex-col gap-space-lg pb-space-xl">
      {/* ── SECTION 1: TOP CONTROL STRIP ────────────────────────────── */}
      <div className="w-full">
        <div className="p-space-md rounded-2xl bg-surface-container/70 backdrop-blur-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.25)] flex flex-wrap items-center justify-between gap-space-md">
          {/* Protocol Mode Switcher Pills */}
          <div className="flex items-center gap-space-xs p-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
            <button
              type="button"
              onClick={() => setProtocol('saw')}
              className={`px-space-md py-1.5 rounded-full font-label-lg text-label-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                protocol === 'saw'
                  ? 'bg-primary-container text-on-primary-container shadow-[0_0_16px_rgba(160,120,255,0.4),inset_0_1px_1px_rgba(255,255,255,0.5)]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${protocol === 'saw' ? 'bg-primary-fixed shadow-[0_0_8px_currentColor]' : 'bg-outline-variant'}`} />
              <span>Stop-and-Wait</span>
            </button>
            <button
              type="button"
              onClick={() => setProtocol('gbn')}
              className={`px-space-md py-1.5 rounded-full font-label-lg text-label-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                protocol === 'gbn'
                  ? 'bg-primary-container text-on-primary-container shadow-[0_0_16px_rgba(160,120,255,0.4),inset_0_1px_1px_rgba(255,255,255,0.5)]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${protocol === 'gbn' ? 'bg-primary-fixed shadow-[0_0_8px_currentColor]' : 'bg-outline-variant'}`} />
              <span>Go-Back-N (N=4)</span>
            </button>
            <button
              type="button"
              onClick={() => setProtocol('sr')}
              className={`px-space-md py-1.5 rounded-full font-label-lg text-label-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                protocol === 'sr'
                  ? 'bg-primary-container text-on-primary-container shadow-[0_0_16px_rgba(160,120,255,0.4),inset_0_1px_1px_rgba(255,255,255,0.5)]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${protocol === 'sr' ? 'bg-primary-fixed shadow-[0_0_8px_currentColor]' : 'bg-outline-variant'}`} />
              <span>Selective Repeat</span>
            </button>
          </div>

          {/* Active Stage Breadcrumb */}
          <div className="flex items-center gap-space-sm px-space-md py-1.5 rounded-full bg-surface-container-high/60 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary shadow-[0_0_10px_currentColor] animate-pulse" />
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-tertiary">Forouzan Ch.11 Pipe:</span>
            <span className="font-body-sm text-body-sm font-semibold text-on-surface">
              {getStageDescription()}
            </span>
          </div>

          {/* Step Transport Controls */}
          <div className="flex items-center gap-space-xs">
            <button
              type="button"
              onClick={() => setIsAutoStepping(!isAutoStepping)}
              className="px-space-md py-1.5 rounded-full bg-surface-container-highest/80 hover:bg-surface-bright text-on-surface font-label-md text-label-md flex items-center gap-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">
                {isAutoStepping ? 'pause' : 'play_arrow'}
              </span>
              <span>{isAutoStepping ? 'Pause Auto' : 'Auto Step'}</span>
            </button>
            <button
              type="button"
              onClick={stepForward}
              className="px-space-md py-1.5 rounded-full bg-primary-container text-on-primary-container hover:brightness-110 font-label-md text-label-md flex items-center gap-1.5 shadow-[0_4px_16px_rgba(160,120,255,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">skip_next</span>
              <span>Next Layer Step</span>
            </button>
            <button
              type="button"
              onClick={resetStack}
              className="w-8 h-8 rounded-full bg-surface-container-highest/60 hover:bg-surface-bright text-on-surface-variant hover:text-on-surface flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all cursor-pointer"
              title="Reset Encapsulation"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: TWIN 3-TIER HARDWARE ARCHITECTURE (HOST A vs HOST B) ──── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-stretch">
        {/* ==================== HOST A (TRANSMITTER) ==================== */}
        <div className="xl:col-span-5 flex flex-col gap-space-md">
          {/* Host Header Shield */}
          <div className="flex items-center justify-between px-space-md py-space-xs rounded-full bg-surface-container-low/90 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <div className="flex items-center gap-space-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_currentColor]" />
              <span className="font-headline-sm text-headline-sm text-on-surface">Host A <span className="font-normal text-on-surface-variant text-body-sm">(Sender Station)</span></span>
            </div>
            <span className="px-space-sm py-0.5 rounded-full bg-secondary-container/20 text-secondary text-label-caps font-label-caps font-mono uppercase tracking-wider">IP: 192.168.1.10</span>
          </div>

          {/* TIER 1: Host A - Application & Network Layer */}
          <div className={`p-space-md rounded-2xl bg-surface-container/60 backdrop-blur-2xl shadow-[0_16px_32px_-8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)] transition-all duration-300 ${stepIndex === 1 ? 'ring-2 ring-primary shadow-[0_0_24px_rgba(208,188,255,0.3)]' : ''}`}>
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[20px]">layers</span>
                <span className="font-label-lg text-label-lg uppercase tracking-wider text-secondary">Tier 1 • Network / Application Layer</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-highest font-mono text-label-caps text-on-surface-variant">L3 MTU: 1500B</span>
            </div>
            <div className="p-space-sm rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] flex items-center justify-between gap-space-sm">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-outline">Upper Data Buffer Output</span>
                <span className="font-mono text-body-sm text-primary font-semibold truncate">GET /index.html [256 Bytes Payload]</span>
              </div>
              <div className="flex items-center gap-1 text-secondary font-label-md text-label-md bg-secondary/10 px-2 py-1 rounded-full">
                <span>Pass L3 Packet</span>
                <span className="material-symbols-outlined text-[16px] animate-bounce">arrow_downward</span>
              </div>
            </div>
          </div>

          {/* TIER 2: Host A - Prominent Data Link Layer */}
          <div className={`p-space-lg rounded-2xl bg-surface-container-high/70 backdrop-blur-2xl shadow-[0_20px_40px_-10px_rgba(234,179,8,0.25),0_0_24px_rgba(234,179,8,0.1),inset_0_1px_2px_rgba(255,255,255,0.35)] transition-all duration-300 ${stepIndex === 2 ? 'ring-2 ring-tertiary shadow-[0_0_28px_rgba(236,106,6,0.3)]' : ''}`}>
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-tertiary text-[22px]">tune</span>
                <span className="font-headline-sm text-headline-sm text-tertiary font-bold tracking-tight">Tier 2 • Data Link Layer (DLL)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-tertiary/15 text-tertiary font-label-caps text-label-caps uppercase tracking-wider shadow-[0_0_8px_rgba(255,182,144,0.3)]">Active Engine</span>
            </div>

            {/* Sliding Window Visual Bracket [0..7] */}
            <div className="mb-space-md p-space-sm rounded-xl bg-surface-container-lowest/90 backdrop-blur-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.7)]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Sliding Window Sequence Slots [0..7]</span>
                <span className="font-mono text-label-caps text-tertiary">S_f = 0, S_n = 2, S_size = 4</span>
              </div>
              <div className="grid grid-cols-8 gap-1 relative py-1">
                {/* Window bracket indicator */}
                <div className="absolute -top-1 left-0 w-1/2 bottom-0 rounded-lg bg-tertiary/10 pointer-events-none shadow-[0_0_12px_rgba(236,106,6,0.35)] transition-all duration-300 border-2 border-tertiary/60" />
                <div className="p-2 rounded bg-tertiary-container/30 text-center flex flex-col items-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  <span className="font-mono text-label-caps text-tertiary">#0</span>
                  <span className="font-label-caps text-[9px] text-tertiary font-bold">ACK&apos;D</span>
                </div>
                <div className="p-2 rounded bg-secondary-container/40 text-center flex flex-col items-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  <span className="font-mono text-label-caps text-secondary">#1</span>
                  <span className="font-label-caps text-[9px] text-secondary font-bold">SENT</span>
                </div>
                <div className="p-2 rounded bg-primary-container/40 text-center flex flex-col items-center ring-1 ring-primary shadow-[0_0_8px_rgba(160,120,255,0.5)]">
                  <span className="font-mono text-label-caps text-primary-fixed">#2</span>
                  <span className="font-label-caps text-[9px] text-primary-fixed font-bold">TX_NOW</span>
                </div>
                <div className="p-2 rounded bg-surface-container-high text-center flex flex-col items-center">
                  <span className="font-mono text-label-caps text-on-surface-variant">#3</span>
                  <span className="font-label-caps text-[9px] text-outline">AVAIL</span>
                </div>
                <div className="p-2 rounded bg-surface-container-lowest text-center flex flex-col items-center opacity-60">
                  <span className="font-mono text-label-caps text-outline">#4</span>
                  <span className="font-label-caps text-[9px] text-outline">LOCKED</span>
                </div>
                <div className="p-2 rounded bg-surface-container-lowest text-center flex flex-col items-center opacity-60">
                  <span className="font-mono text-label-caps text-outline">#5</span>
                  <span className="font-label-caps text-[9px] text-outline">LOCKED</span>
                </div>
                <div className="p-2 rounded bg-surface-container-lowest text-center flex flex-col items-center opacity-60">
                  <span className="font-mono text-label-caps text-outline">#6</span>
                  <span className="font-label-caps text-[9px] text-outline">LOCKED</span>
                </div>
                <div className="p-2 rounded bg-surface-container-lowest text-center flex flex-col items-center opacity-60">
                  <span className="font-mono text-label-caps text-outline">#7</span>
                  <span className="font-label-caps text-[9px] text-outline">LOCKED</span>
                </div>
              </div>
            </div>

            {/* Protocol State Machine Engine Box & CRC Polynomial Readout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
              <div className="p-space-sm rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl">
                <span className="font-label-caps text-label-caps text-outline block mb-1">DLL Protocol State</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_currentColor] animate-ping" />
                  <span className="font-mono text-body-sm font-bold text-secondary">WAITING_FOR_EVENT</span>
                </div>
                <span className="font-body-sm text-[11px] text-on-surface-variant mt-1 block">Timer: T_0 running (RTT estimate = 42ms)</span>
              </div>
              <div className="p-space-sm rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl">
                <span className="font-label-caps text-label-caps text-outline block mb-1">CRC-32 IEEE 802.3 Generator</span>
                <div className="font-mono text-body-sm text-tertiary font-bold truncate">0x04C11DB7 (x³² + x²⁶ + ...)</div>
                <span className="font-mono text-[11px] text-tertiary-fixed mt-1 block truncate">Remainder: 0x8F4BA120</span>
              </div>
            </div>

            {/* Framing & Byte-Dissector Preview inside DLL */}
            <div className="mt-space-sm p-space-sm rounded-xl bg-surface-container/60 backdrop-blur-md flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-outline">Framing Mode</span>
              <span className="font-mono text-label-md text-on-surface">Bit-Oriented HDLC (Flag: 01111110)</span>
              <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary text-label-caps font-semibold">Framing Active</span>
            </div>
          </div>

          {/* TIER 3: Host A - Physical Layer */}
          <div className={`p-space-md rounded-2xl bg-surface-container/60 backdrop-blur-2xl shadow-[0_16px_32px_-8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)] transition-all duration-300 ${stepIndex === 3 ? 'ring-2 ring-secondary shadow-[0_0_24px_rgba(123,208,255,0.3)]' : ''}`}>
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[20px]">sensors</span>
                <span className="font-label-lg text-label-lg uppercase tracking-wider text-secondary">Tier 3 • Physical Layer (PHY)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-label-caps text-label-caps font-mono">10GBASE-LR Optic</span>
            </div>
            <div className="grid grid-cols-2 gap-space-sm">
              <div className="p-space-sm rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl flex flex-col justify-between">
                <span className="font-label-caps text-label-caps text-outline">Signal Serializer</span>
                <div className="h-6 flex items-center gap-1 font-mono text-[11px] text-secondary overflow-hidden">
                  <span className="inline-block animate-pulse">01111110</span>
                  <span className="opacity-75">00100000</span>
                  <span className="opacity-40">00000001</span>
                </div>
              </div>
              <div className="p-space-sm rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl flex flex-col justify-between">
                <span className="font-label-caps text-label-caps text-outline">Laser Modulator Status</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_currentColor] animate-pulse" />
                  <span className="font-mono text-body-sm font-bold text-on-surface">1310nm LOCKED</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== CENTER TRANSMISSION CONDUIT ==================== */}
        <div className="xl:col-span-2 flex flex-col items-center justify-center gap-space-md py-4">
          <div className="w-full flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-container-lowest/80 border border-outline-variant/50 shadow-inner">
            <span className="font-label-caps text-label-caps uppercase text-outline text-center">Duplex Fiber Channel</span>
            <div className="w-full h-32 relative bg-surface-container rounded-xl overflow-hidden flex items-center justify-center border border-outline-variant/30">
              <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-primary opacity-60 animate-pulse" />
              <div className="z-10 px-2 py-1 rounded bg-secondary text-on-secondary font-mono text-[10px] font-bold shadow-md animate-bounce">
                Frame #2 →
              </div>
            </div>
            <div className="flex flex-col gap-1 w-full pt-1">
              <button
                type="button"
                onClick={() => setBitErrorInjected(!bitErrorInjected)}
                className={`w-full py-1 px-2 rounded-full font-mono text-[10px] font-bold transition-all cursor-pointer ${
                  bitErrorInjected
                    ? 'bg-error text-on-error shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                    : 'bg-surface-container-high hover:bg-surface-bright text-on-surface'
                }`}
              >
                {bitErrorInjected ? '× Bit Inverted (CRC Fail)' : 'Inject CRC Error'}
              </button>
            </div>
          </div>
        </div>

        {/* ==================== HOST B (RECEIVER) ==================== */}
        <div className="xl:col-span-5 flex flex-col gap-space-md">
          {/* Host Header Shield */}
          <div className="flex items-center justify-between px-space-md py-space-xs rounded-full bg-surface-container-low/90 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <div className="flex items-center gap-space-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_currentColor]" />
              <span className="font-headline-sm text-headline-sm text-on-surface">Host B <span className="font-normal text-on-surface-variant text-body-sm">(Receiver Station)</span></span>
            </div>
            <span className="px-space-sm py-0.5 rounded-full bg-primary-container/20 text-primary text-label-caps font-label-caps font-mono uppercase tracking-wider">IP: 192.168.1.20</span>
          </div>

          {/* TIER 1: Host B - Application & Network Layer */}
          <div className={`p-space-md rounded-2xl bg-surface-container/60 backdrop-blur-2xl shadow-[0_16px_32px_-8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)] transition-all duration-300 ${stepIndex === 4 ? 'ring-2 ring-primary shadow-[0_0_24px_rgba(208,188,255,0.3)]' : ''}`}>
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">layers</span>
                <span className="font-label-lg text-label-lg uppercase tracking-wider text-primary">Tier 1 • Network / Application Layer</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-highest font-mono text-label-caps text-on-surface-variant">L3 Delivery</span>
            </div>
            <div className="p-space-sm rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] flex items-center justify-between gap-space-sm">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-outline">Application Inbox Buffer</span>
                <span className="font-mono text-body-sm text-primary font-semibold truncate">GET /index.html (Delivered)</span>
              </div>
              <div className="flex items-center gap-1 text-primary font-label-md text-label-md bg-primary/10 px-2 py-1 rounded-full">
                <span>Passed to App</span>
                <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
              </div>
            </div>
          </div>

          {/* TIER 2: Host B - Data Link Layer */}
          <div className={`p-space-lg rounded-2xl bg-surface-container-high/70 backdrop-blur-2xl shadow-[0_20px_40px_-10px_rgba(234,179,8,0.25),0_0_24px_rgba(234,179,8,0.1),inset_0_1px_2px_rgba(255,255,255,0.35)] transition-all duration-300 ${stepIndex === 4 ? 'ring-2 ring-secondary shadow-[0_0_24px_rgba(123,208,255,0.3)]' : ''}`}>
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[22px]">tune</span>
                <span className="font-headline-sm text-headline-sm text-secondary font-bold tracking-tight">Tier 2 • Data Link Layer (DLL)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-label-caps text-label-caps uppercase tracking-wider shadow-[0_0_8px_rgba(123,208,255,0.3)]">Validation Engine</span>
            </div>

            {/* Receiver CRC Check & State Validation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
              <div className="p-space-sm rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl">
                <span className="font-label-caps text-label-caps text-outline block mb-1">Receiver State</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_currentColor]" />
                  <span className="font-mono text-body-sm font-bold text-secondary">RECEIVE_AND_CHECK</span>
                </div>
                <span className="font-body-sm text-[11px] text-on-surface-variant mt-1 block">Expected Frame: Seq #2</span>
              </div>
              <div className="p-space-sm rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl">
                <span className="font-label-caps text-label-caps text-outline block mb-1">Receiver CRC-32 Verifier</span>
                <div className="font-mono text-body-sm text-secondary font-bold truncate">
                  Computed: {bitErrorInjected ? '0xBAD0F00D' : '0x8F4BA120'}
                </div>
                <span className={`font-mono text-[11px] mt-1 block truncate font-bold ${bitErrorInjected ? 'text-error' : 'text-secondary-fixed'}`}>
                  {bitErrorInjected ? 'MISMATCH: PACKET CORRUPTED' : 'MATCH: ZERO REMAINDER'}
                </span>
              </div>
            </div>

            {/* Frame Verdict Banner */}
            <div className={`mt-space-sm p-space-sm rounded-xl flex items-center justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] ${
              bitErrorInjected
                ? 'bg-error-container text-on-error-container'
                : 'bg-secondary-container/20 text-secondary-fixed'
            }`}>
              <div className="flex items-center gap-1.5 font-label-md">
                <span className="material-symbols-outlined text-[16px]">
                  {bitErrorInjected ? 'cancel' : 'check_circle'}
                </span>
                <span>{bitErrorInjected ? 'CRC Mismatch • Dropping Corrupted Frame' : 'Frame Integrity Valid • Enqueueing ACK #3'}</span>
              </div>
              <span className="font-mono text-label-caps font-bold">
                {bitErrorInjected ? 'ACTION: DISCARD' : 'ACTION: ACCEPT'}
              </span>
            </div>
          </div>

          {/* TIER 3: Host B - Physical Layer */}
          <div className="p-space-md rounded-2xl bg-surface-container/60 backdrop-blur-2xl shadow-[0_16px_32px_-8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)] transition-all duration-300">
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[20px]">sensors</span>
                <span className="font-label-lg text-label-lg uppercase tracking-wider text-secondary">Tier 3 • Physical Layer (PHY)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-label-caps text-label-caps font-mono">10GBASE-LR Optic</span>
            </div>
            <div className="grid grid-cols-2 gap-space-sm">
              <div className="p-space-sm rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl flex flex-col justify-between">
                <span className="font-label-caps text-label-caps text-outline">Deserializer Stream</span>
                <div className="h-6 flex items-center gap-1 font-mono text-[11px] text-secondary overflow-hidden">
                  <span className="opacity-25">11010110</span>
                  <span className="opacity-50">10110001</span>
                  <span className="inline-block animate-pulse">01001101</span>
                </div>
              </div>
              <div className="p-space-sm rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl flex flex-col justify-between">
                <span className="font-label-caps text-label-caps text-outline">RX Hardware Status</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_10px_currentColor]" />
                  <span className="font-mono text-body-sm font-bold text-on-surface">RX CARRIER: SYNCD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: DETAILED 3D TRAVELING WIRE FRAME DISSECTOR ────────── */}
      <div className="w-full">
        <div className="p-space-md rounded-2xl bg-surface-container/70 backdrop-blur-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.25)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
            <div>
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-outline block">Interactive Frame Dissector • L2 PDU Wire Format</span>
              <h2 className="font-headline-md text-headline-md text-on-surface">Layered Byte Architecture (IEEE / Forouzan Specification)</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-space-sm py-1 rounded-full bg-surface-container-highest text-on-surface font-mono text-label-caps">Total Frame: 24 Bytes</span>
              <span className="px-space-sm py-1 rounded-full bg-primary-container/20 text-primary font-mono text-label-caps">Overhead: 14 Bytes</span>
            </div>
          </div>

          {/* Segmented Color-Coded Byte Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-space-sm">
            {/* Byte 0: Frame Type */}
            <div className="p-space-sm rounded-xl bg-surface-container-high/80 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-label-caps text-outline">BYTE 0</span>
                <span className="w-2 h-2 rounded-full bg-outline" />
              </div>
              <span className="font-label-lg text-label-lg text-on-surface block truncate">Frame Type</span>
              <span className="font-mono text-body-sm text-secondary font-bold">0x00 (DATA)</span>
              <span className="font-body-sm text-[11px] text-on-surface-variant block mt-1">Control: 0=DATA, 1=ACK</span>
            </div>

            {/* Bytes 1-4: Sequence Number */}
            <div className="p-space-sm rounded-xl bg-secondary-container/20 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-label-caps text-secondary">BYTES 1-4</span>
                <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_6px_currentColor]" />
              </div>
              <span className="font-label-lg text-label-lg text-secondary-fixed block truncate">Sequence Number</span>
              <span className="font-mono text-body-sm text-secondary font-bold">0x00000002 (Seq #2)</span>
              <span className="font-body-sm text-[11px] text-on-surface-variant block mt-1">Modulo 2^m window slot</span>
            </div>

            {/* Bytes 5-8: ACK Number */}
            <div className="p-space-sm rounded-xl bg-tertiary-container/20 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-label-caps text-tertiary">BYTES 5-8</span>
                <span className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_6px_currentColor]" />
              </div>
              <span className="font-label-lg text-label-lg text-tertiary-fixed block truncate">ACK Number</span>
              <span className="font-mono text-body-sm text-tertiary font-bold">0x00000001 (Ack #1)</span>
              <span className="font-body-sm text-[11px] text-on-surface-variant block mt-1">Piggybacked cumulative</span>
            </div>

            {/* Bytes 9-10: Payload Length */}
            <div className="p-space-sm rounded-xl bg-primary-container/20 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-label-caps text-primary">BYTES 9-10</span>
                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_currentColor]" />
              </div>
              <span className="font-label-lg text-label-lg text-primary-fixed block truncate">Length (Bytes)</span>
              <span className="font-mono text-body-sm text-primary font-bold">0x000A (10 Bytes)</span>
              <span className="font-body-sm text-[11px] text-on-surface-variant block mt-1">Payload octet count</span>
            </div>

            {/* Bytes 11-20: Payload Data */}
            <div className="p-space-sm rounded-xl bg-surface-container-highest/60 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-label-caps text-on-surface-variant">BYTES 11-20</span>
                <span className="w-2 h-2 rounded-full bg-secondary" />
              </div>
              <span className="font-label-lg text-label-lg text-on-surface block truncate">Payload ASCII Data</span>
              <span className="font-mono text-body-sm text-secondary font-bold">&quot;GET /inde...&quot;</span>
              <span className="font-body-sm text-[11px] text-on-surface-variant block mt-1">Encapsulated HTTP PDU</span>
            </div>

            {/* Bytes 21-24: CRC-32 Trailer */}
            <div className="p-space-sm rounded-xl bg-tertiary-container/30 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all duration-300">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-label-caps text-tertiary">BYTES 21-24</span>
                <span className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_6px_currentColor]" />
              </div>
              <span className="font-label-lg text-label-lg text-tertiary-fixed block truncate">CRC-32 Trailer</span>
              <span className="font-mono text-body-sm text-tertiary font-bold">0x8F4BA120</span>
              <span className="font-body-sm text-[11px] text-on-surface-variant block mt-1">Status: Valid Checksum</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: ALGORITHMIC STATE ENGINE TRANSITION GRAPH ────────── */}
      <div className="w-full">
        <div className="p-space-md rounded-2xl bg-surface-container/70 backdrop-blur-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.25)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
            <div>
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-outline block">Protocol Finite State Machine (FSM)</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Algorithmic State Engine Transition Graph</h3>
            </div>
            <div className="flex items-center gap-space-sm text-label-caps font-mono">
              <span className="flex items-center gap-1.5 text-secondary">
                <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_currentColor] animate-ping" />
                ACTIVE STATE
              </span>
              <span className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-outline-variant" />
                DORMANT
              </span>
            </div>
          </div>

          {/* FSM Node Graph Visual Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-space-sm relative">
            {/* Node 1: IDLE_CAN_SEND */}
            <div className="p-space-md rounded-xl bg-surface-container-high/60 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col justify-between transition-all duration-300">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-mono text-label-caps text-outline">STATE 0</span>
                <span className="material-symbols-outlined text-[18px] text-outline">hourglass_empty</span>
              </div>
              <div>
                <span className="font-headline-sm text-[16px] text-on-surface block font-bold">IDLE_CAN_SEND</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Network layer request arrives. Sn &lt; Sf + N allows window frame transmission.</p>
              </div>
              <div className="mt-space-sm pt-2 font-mono text-[10px] text-outline">Transition: Event_L3_Send</div>
            </div>

            {/* Node 2: TRANSMITTING_FRAME (Active) */}
            <div className="p-space-md rounded-xl bg-secondary-container/30 ring-1 ring-secondary backdrop-blur-xl shadow-[0_0_24px_rgba(0,166,224,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] flex flex-col justify-between transition-all duration-300">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-mono text-label-caps text-secondary font-bold">STATE 1 (ACTIVE)</span>
                <span className="material-symbols-outlined text-[18px] text-secondary animate-pulse">send</span>
              </div>
              <div>
                <span className="font-headline-sm text-[16px] text-secondary-fixed block font-bold">TRANSMITTING_FRAME</span>
                <p className="font-body-sm text-body-sm text-on-surface mt-1">Append CRC-32 trailer, hand frame to Physical Layer, start timer if first outstanding frame.</p>
              </div>
              <div className="mt-space-sm pt-2 font-mono text-[10px] text-secondary font-bold">Action: PHY_Send(Frame); StartTimer()</div>
            </div>

            {/* Node 3: WAITING_ACK */}
            <div className="p-space-md rounded-xl bg-surface-container-high/60 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col justify-between transition-all duration-300">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-mono text-label-caps text-outline">STATE 2</span>
                <span className="material-symbols-outlined text-[18px] text-outline">mark_email_read</span>
              </div>
              <div>
                <span className="font-headline-sm text-[16px] text-on-surface block font-bold">WAITING_ACK</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Awaiting incoming ACK without error. Advance window baseline: Sf = ack_no + 1.</p>
              </div>
              <div className="mt-space-sm pt-2 font-mono text-[10px] text-outline">Transition: Event_Frame_Arrival</div>
            </div>

            {/* Node 4: TIMEOUT_RECOVERY */}
            <div className="p-space-md rounded-xl bg-surface-container-high/60 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col justify-between transition-all duration-300">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-mono text-label-caps text-error">STATE 3 (RECOVERY)</span>
                <span className="material-symbols-outlined text-[18px] text-error">warning</span>
              </div>
              <div>
                <span className="font-headline-sm text-[16px] text-on-surface block font-bold">TIMEOUT_RECOVERY</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Timer expires. Resend all outstanding unacknowledged frames starting from base pointer Sf.</p>
              </div>
              <div className="mt-space-sm pt-2 font-mono text-[10px] text-error">Action: Retransmit(Sf..Sn-1)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
