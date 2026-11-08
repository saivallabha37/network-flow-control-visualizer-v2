import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export type AmbiguityMode = 'VIOLATION' | 'COMPLIANT';

export interface AmbiguityStep {
  step: number;
  title: string;
  senderWindow: number[];
  receiverWindow: number[];
  channelPackets: string[];
  status: 'NORMAL' | 'WARNING' | 'CORRUPTION' | 'SAFE';
  explanation: string;
}

export const SequenceAmbiguityLab: React.FC = () => {
  const [mode, setMode] = useState<AmbiguityMode>('VIOLATION');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Sequence Space M = 4 (Slots: 0, 1, 2, 3)
  const seqSpace = 4;
  const windowSize = mode === 'VIOLATION' ? 3 : 2;

  // Steps for Violation Mode (M=4, N=3)
  const violationSteps: AmbiguityStep[] = [
    {
      step: 0,
      title: 'Initial State: Sender & Receiver Synchronized',
      senderWindow: [0, 1, 2],
      receiverWindow: [0, 1, 2],
      channelPackets: [],
      status: 'NORMAL',
      explanation:
        'Both stations start at base 0 with window size N = 3. Notice that 2N = 6, which violates M >= 2N (6 > 4).',
    },
    {
      step: 1,
      title: 'Step 1: Sender Transmits Entire Window (Frames 0, 1, 2)',
      senderWindow: [0, 1, 2],
      receiverWindow: [0, 1, 2],
      channelPackets: ['DATA #0', 'DATA #1', 'DATA #2'],
      status: 'NORMAL',
      explanation:
        'Sender dispatches frames 0, 1, and 2 into the channel and starts retransmission timers.',
    },
    {
      step: 2,
      title: 'Step 2: Receiver Accepts All 3 Frames & Slides Window',
      senderWindow: [0, 1, 2],
      receiverWindow: [3, 0, 1], // Advanced by 3 modulo 4
      channelPackets: ['ACK #0', 'ACK #1', 'ACK #2'],
      status: 'NORMAL',
      explanation:
        'Receiver accepts frames 0, 1, 2 in order, delivers them to the application, advances its window by 3 to [3, 0, 1], and returns ACKs.',
    },
    {
      step: 3,
      title: 'Step 3: Catastrophic Channel Fault — All ACKs Dropped!',
      senderWindow: [0, 1, 2],
      receiverWindow: [3, 0, 1],
      channelPackets: ['ACK #0 (LOST)', 'ACK #1 (LOST)', 'ACK #2 (LOST)'],
      status: 'WARNING',
      explanation:
        'Severe channel fault! All 3 ACKs are lost. The sender has no idea the receiver already accepted the frames.',
    },
    {
      step: 4,
      title: 'Step 4: Sender Timeout on Frame 0 — Retransmission',
      senderWindow: [0, 1, 2],
      receiverWindow: [3, 0, 1],
      channelPackets: ['DATA #0 (Retransmit)'],
      status: 'WARNING',
      explanation:
        'Sender timer expires for Frame 0. Sender retransmits old Frame 0 across the channel.',
    },
    {
      step: 5,
      title: 'Step 5: SILENT PROTOCOL CORRUPTION! Old Duplicate Accepted as New',
      senderWindow: [0, 1, 2],
      receiverWindow: [3, 0, 1],
      channelPackets: ['DATA #0 -> Accepted!'],
      status: 'CORRUPTION',
      explanation:
        'DISASTER! The receiver window is [3, 0, 1]. Because 0 is inside the active receiver window, the receiver believes this is the NEW Frame 0 from the NEXT cycle! It delivers duplicate data to the application without error!',
    },
  ];

  // Steps for Compliant Mode (M=4, N=2)
  const compliantSteps: AmbiguityStep[] = [
    {
      step: 0,
      title: 'Initial State: Safe Configuration (2N <= M)',
      senderWindow: [0, 1],
      receiverWindow: [0, 1],
      channelPackets: [],
      status: 'NORMAL',
      explanation:
        'M = 4, N = 2. Here 2N = 4 <= M = 4 satisfies the half-space rule. The windows cannot overlap.',
    },
    {
      step: 1,
      title: 'Step 1: Sender Transmits Frames 0 and 1',
      senderWindow: [0, 1],
      receiverWindow: [0, 1],
      channelPackets: ['DATA #0', 'DATA #1'],
      status: 'NORMAL',
      explanation:
        'Sender dispatches frames 0 and 1 into the channel and starts retransmission timers.',
    },
    {
      step: 2,
      title: 'Step 2: Receiver Accepts Frames 0 and 1 & Advances Window',
      senderWindow: [0, 1],
      receiverWindow: [2, 3], // Advanced by 2 modulo 4
      channelPackets: ['ACK #0', 'ACK #1'],
      status: 'NORMAL',
      explanation:
        'Receiver accepts frames 0 and 1, delivers them to the application, advances its window to [2, 3], and transmits ACKs.',
    },
    {
      step: 3,
      title: 'Step 3: All ACKs Dropped in Channel',
      senderWindow: [0, 1],
      receiverWindow: [2, 3],
      channelPackets: ['ACK #0 (LOST)', 'ACK #1 (LOST)'],
      status: 'WARNING',
      explanation:
        'Identical failure scenario: both ACKs are lost in transit. Sender timer will expire.',
    },
    {
      step: 4,
      title: 'Step 4: Sender Retransmits Old Frame 0',
      senderWindow: [0, 1],
      receiverWindow: [2, 3],
      channelPackets: ['DATA #0 (Retransmit)'],
      status: 'WARNING',
      explanation:
        'Sender times out and retransmits duplicate Frame 0.',
    },
    {
      step: 5,
      title: 'Step 5: DISAMBIGUATION GUARANTEED: Duplicate Safely Discarded',
      senderWindow: [0, 1],
      receiverWindow: [2, 3],
      channelPackets: ['DATA #0 -> Ignored!'],
      status: 'SAFE',
      explanation:
        'SUCCESS! Receiver window is [2, 3]. Retransmitted Frame 0 falls OUTSIDE the receiver window. The receiver correctly recognizes it as an old duplicate, discards the payload, and re-sends ACK #0.',
    },
  ];

  const activeSteps = mode === 'VIOLATION' ? violationSteps : compliantSteps;
  const active = activeSteps[currentStep];

  // Auto-play timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((prev) => (prev < activeSteps.length - 1 ? prev + 1 : 0));
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeSteps.length]);

  const handleModeSwitch = (newMode: AmbiguityMode) => {
    setMode(newMode);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4" />
            <span>Interactive Mathematical Proof &amp; Simulation</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-0.5">
            The Fundamental Half-Space Constraint: 2N &le; M
          </h3>
          <p className="text-xs text-slate-400">
            Discover why Selective Repeat strictly requires sequence number space M to be at least twice window capacity N.
          </p>
        </div>

        {/* Mode Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleModeSwitch('VIOLATION')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              mode === 'VIOLATION'
                ? 'bg-rose-600/20 text-rose-300 border-rose-500 shadow-md ring-1 ring-rose-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            Violation: M=4, N=3
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('COMPLIANT')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              mode === 'COMPLIANT'
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500 shadow-md ring-1 ring-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            Compliant: M=4, N=2
          </button>
        </div>
      </div>

      {/* Mathematical Derivation Box */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
        <span className="font-bold text-slate-200 block uppercase tracking-wider text-[11px]">
          Mathematical Proof &amp; Invariant:
        </span>
        <div className="font-mono text-slate-300 leading-relaxed space-y-1">
          <div>
            1. In Selective Repeat, Sender Window = <strong className="text-indigo-400">N</strong> and Receiver Window = <strong className="text-emerald-400">N</strong>.
          </div>
          <div>
            2. If all ACKs for an entire window are lost in transit, the receiver advances forward by <strong className="text-emerald-400">N</strong> slots while the sender remains at base <strong className="text-indigo-400">0</strong>.
          </div>
          <div>
            3. To prevent the receiver's advanced window from wrapping around and overlapping with the sender's unacknowledged frames:
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-center text-sm font-bold text-white">
            N<sub>sender</sub> + N<sub>receiver</sub> &le; M &nbsp;&implies;&nbsp; 2N &le; M &nbsp;&implies;&nbsp; N &le; M / 2
          </div>
        </div>
      </div>

      {/* Stepper Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-600/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500 shadow-sm'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Auto-Play Simulation'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep((prev) => (prev < activeSteps.length - 1 ? prev + 1 : 0));
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-all cursor-pointer"
          >
            <span>Next Step</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep(0);
            }}
            title="Reset to Step 0"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Showing Step {currentStep + 1} of {activeSteps.length}
        </div>
      </div>

      {/* Step Visualizer: Side-by-Side Windows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Sender Window Slots */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
            <span className="font-bold text-slate-300">Sender Window Track (Host A)</span>
            <span className="text-[10px] font-mono text-indigo-400">N = {windowSize}</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: seqSpace }, (_, i) => {
              const inWindow = active.senderWindow.includes(i);
              return (
                <div
                  key={i}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    inWindow
                      ? 'border-indigo-500 bg-indigo-600/20 text-indigo-200 font-bold ring-1 ring-indigo-500/40'
                      : 'border-slate-800 bg-slate-900/30 text-slate-600 opacity-50'
                  }`}
                >
                  <div className="font-mono text-base font-extrabold">Slot {i}</div>
                  <div className="text-[9px] uppercase tracking-wider mt-0.5">
                    {inWindow ? 'In Window' : 'Outside'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Sender Window Slots: [{active.senderWindow.join(', ')}]
          </div>
        </div>

        {/* Receiver Window Slots */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
            <span className="font-bold text-slate-300">Receiver Window Track (Host B)</span>
            <span className="text-[10px] font-mono text-emerald-400">N = {windowSize}</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: seqSpace }, (_, i) => {
              const inWindow = active.receiverWindow.includes(i);
              const isOverlappingOldFrame0 = inWindow && i === 0 && currentStep === 5 && mode === 'VIOLATION';

              let style = inWindow
                ? 'border-emerald-500 bg-emerald-600/20 text-emerald-200 font-bold ring-1 ring-emerald-500/40'
                : 'border-slate-800 bg-slate-900/30 text-slate-600 opacity-50';

              if (isOverlappingOldFrame0) {
                style = 'border-rose-500 bg-rose-600/30 text-rose-200 font-extrabold ring-2 ring-rose-500 animate-pulse';
              }

              return (
                <div key={i} className={`p-3 rounded-xl border text-center transition-all ${style}`}>
                  <div className="font-mono text-base font-extrabold">Slot {i}</div>
                  <div className="text-[9px] uppercase tracking-wider mt-0.5 truncate">
                    {isOverlappingOldFrame0 ? 'AMBIGUOUS!' : inWindow ? 'Acceptable' : 'Outside'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Receiver Window Slots: [{active.receiverWindow.join(', ')}]
          </div>
        </div>
      </div>

      {/* Step Explanation & Critical Verdict Card */}
      <div
        className={`p-5 rounded-xl border space-y-3 transition-all ${
          active.status === 'CORRUPTION'
            ? 'bg-rose-950/40 border-rose-500/60 ring-2 ring-rose-500/40 text-rose-200 animate-pulse'
            : active.status === 'SAFE'
            ? 'bg-emerald-950/40 border-emerald-500/60 ring-2 ring-emerald-500/40 text-emerald-200'
            : active.status === 'WARNING'
            ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
            : 'bg-slate-950 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2">
          {active.status === 'CORRUPTION' && <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />}
          {active.status === 'SAFE' && <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />}
          {active.status === 'WARNING' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
          {active.status === 'NORMAL' && <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />}

          <h4 className="font-bold text-sm text-white">{active.title}</h4>
        </div>

        <p className="text-xs leading-relaxed">{active.explanation}</p>

        {active.channelPackets.length > 0 && (
          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-[11px] flex items-center gap-2">
            <span className="text-slate-500 select-none">Channel Event:</span>
            <span className="font-semibold">{active.channelPackets.join(' | ')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
