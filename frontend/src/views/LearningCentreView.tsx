import React, { useState } from 'react';
import { ViewId } from '../types/navigation';

interface LearningCentreViewProps {
  onNavigate: (view: ViewId) => void;
}

export const LearningCentreView: React.FC<LearningCentreViewProps> = () => {
  // Ambiguity lab state
  const [mode, setMode] = useState<'violation' | 'compliant'>('violation');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [autoStep, setAutoStep] = useState<boolean>(false);

  // Viva flipcards state
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredCards, setMasteredCards] = useState<Record<number, boolean>>({});

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});

  const FLIP_CARDS = [
    {
      id: 0,
      category: 'Mathematical Ambiguity',
      question: 'Why does Selective Repeat ARQ strictly require M ≥ 2N instead of M ≥ N + 1?',
      answer:
        'In Selective Repeat, the receiver window size is N. If all N acknowledgments are lost mid-transit, the sender times out and retransmits the original frame 0. If M < 2N, the advanced receiver window [N .. 2N-1 mod M] wraps around and overlaps with 0. The receiver cannot distinguish whether frame 0 is a retransmission of the old frame or a brand-new frame in the subsequent epoch!',
      modulo: 'M ≥ 2N',
    },
    {
      id: 1,
      category: 'Go-Back-N Invariant',
      question: 'Why does Go-Back-N only require M ≥ N + 1 rather than 2N?',
      answer:
        'In Go-Back-N, the receiver window size is strictly 1 (Rw = 1). The receiver only ever accepts the single sequence number Rn. Since the receiver never buffers frames ahead of Rn, the ambiguity zone is bounded to 1 slot. Thus M ≥ N + 1 ensures the oldest unacknowledged frame cannot collide with the next expected frame.',
      modulo: 'M ≥ N + 1',
    },
    {
      id: 2,
      category: 'Link Efficiency & BDP',
      question: 'What is Bandwidth-Delay Product (BDP) and how does it determine optimal window size N*?',
      answer:
        'BDP = Bandwidth × RTT represents the capacity of the link "pipe" in transit. The optimal sliding window size N* equals 1 + 2a (where a = Tp / Tt). When N ≥ N*, link utilization η reaches 100%, saturating the transmission channel without idle wait pauses.',
      modulo: 'N* = 1 + 2a',
    },
    {
      id: 3,
      category: 'Signaling & Recovery',
      question: 'What is the trade-off between Cumulative ACKs and Selective ACKs (SACK)?',
      answer:
        'Cumulative ACKs (used in GBN) require only a tiny header and easily survive lost intermediate ACKs. However, a single dropped DATA frame triggers rollback of all N subsequent frames. Selective ACKs confirm individual frames, avoiding redundant retransmissions at the cost of higher receiver buffer complexity and larger frame headers.',
      modulo: 'RFC 2018 SACK',
    },
  ];

  const QUIZ_QUESTIONS = [
    {
      id: 0,
      question: 'Under Selective Repeat with M = 8 sequence numbers, what is the maximum permissible window size N?',
      options: ['N = 8', 'N = 7', 'N = 4', 'N = 2'],
      correct: 2,
      explanation: 'Under the half-space theorem M ≥ 2N, we have 2N ≤ 8, therefore N ≤ 4.',
    },
    {
      id: 1,
      question: 'In Go-Back-N ARQ, if Frame 2 is lost but Frames 3, 4, 5 arrive at the receiver, what does the receiver do?',
      options: [
        'Buffers Frames 3, 4, 5 and sends NAK 2',
        'Discards Frames 3, 4, 5 and re-sends cumulative ACK 1',
        'Delivers Frames 3, 4, 5 to the Application layer',
        'Stops the simulation immediately',
      ],
      correct: 1,
      explanation: 'Because GBN receiver window size is 1, any frame with sequence number ≠ Rn is immediately discarded, and duplicate ACK for the last in-order frame is re-sent.',
    },
  ];

  // Auto step timer
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (autoStep) {
      interval = setInterval(() => {
        setCurrentStep((prev) => (prev % 5) + 1);
      }, 2200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoStep]);

  const activeCard = FLIP_CARDS[currentCardIndex];
  const masteryCount = Object.values(masteredCards).filter(Boolean).length;
  const masteryPct = Math.round((masteryCount / FLIP_CARDS.length) * 100);

  return (
    <div className="relative w-full flex flex-col gap-space-lg pb-space-xl">
      {/* ── TOP BANNER ────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden rounded-xl bg-surface-container/40 backdrop-blur-2xl p-space-lg shadow-xl border border-outline-variant/40">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-primary-container/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-secondary-container/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
          <div className="space-y-space-xs">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="px-space-sm py-0.5 rounded-full bg-primary-container/30 text-primary font-label-caps text-label-caps uppercase tracking-wider shadow-sm">
                Module 04 // Formal Telemetry &amp; Protocol Proofs
              </span>
              <span className="px-space-sm py-0.5 rounded-full bg-secondary-container/20 text-secondary font-label-caps text-label-caps flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                Spatial Glass v3.8 Active
              </span>
            </div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Interactive Learning &amp; Curriculum Centre</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
              Explore the canonical <span className="text-secondary font-semibold font-mono">M ≥ 2N</span> proof of disambiguation in Selective Repeat sliding-window protocols, dissect sliding sequence boundary overlap, and rehearse viva examination benchmarks.
            </p>
          </div>

          {/* Quick Metrics Counter Group */}
          <div className="flex items-center gap-space-md shrink-0 bg-surface-container-low/70 backdrop-blur-xl p-space-sm rounded-lg shadow-inner border border-outline-variant/40">
            <div className="px-space-md py-space-xs text-center">
              <span className="font-label-caps text-label-caps text-outline block uppercase">Curriculum Lab</span>
              <span className="font-headline-md text-headline-md text-primary font-bold">Part III</span>
            </div>
            <div className="w-px h-8 bg-surface-container-highest" />
            <div className="px-space-md py-space-xs text-center">
              <span className="font-label-caps text-label-caps text-outline block uppercase">Proof Mastery</span>
              <span className="font-headline-md text-headline-md text-secondary font-bold" id="mastery-pct">
                {masteryPct}%
              </span>
            </div>
            <div className="w-px h-8 bg-surface-container-highest" />
            <div className="px-space-md py-space-xs text-center">
              <span className="font-label-caps text-label-caps text-outline block uppercase">Simulation Status</span>
              <span className="font-label-md text-label-md text-tertiary font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-tertiary" /> Step Lock
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── PRIMARY 2-COLUMN ANALYTICAL WORKSTATION ────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        {/* LEFT COLUMN: THE INTERACTIVE M >= 2N AMBIGUITY LAB (Cols 7 on XL) */}
        <div className="xl:col-span-7 flex flex-col gap-space-lg">
          <div className="w-full rounded-xl bg-surface-container/60 backdrop-blur-2xl p-space-lg shadow-2xl relative border border-outline-variant/40">
            {/* Header & Theorem Pill Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">science</span>
                </div>
                <div>
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Empirical Formal Proof</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Sequence Ambiguity Engine</h3>
                </div>
              </div>
              <div className="px-space-md py-space-xs rounded-full bg-surface-container-high/90 text-primary font-mono text-body-sm shadow-sm flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                <span>Theorem: Window <strong className="text-on-surface">N ≤ M / 2</strong></span>
              </div>
            </div>

            {/* Mode Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm mb-space-lg p-1.5 rounded-lg bg-surface-container-lowest/80 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setMode('violation');
                  setCurrentStep(1);
                  setAutoStep(false);
                }}
                className={`flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded-lg text-label-lg font-label-lg transition-all cursor-pointer ${
                  mode === 'violation'
                    ? 'bg-error-container text-on-error-container shadow-md font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                <span>Test Violation Mode: <strong className="font-mono">M=4, N=3</strong></span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('compliant');
                  setCurrentStep(1);
                  setAutoStep(false);
                }}
                className={`flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded-lg text-label-lg font-label-lg transition-all cursor-pointer ${
                  mode === 'compliant'
                    ? 'bg-primary-container text-on-primary-container shadow-md font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Test Compliant Mode: <strong className="font-mono">M=4, N=2</strong></span>
              </button>
            </div>

            {/* Step Progression Visualizer */}
            <div className="p-space-md rounded-lg bg-surface-container-low/90 backdrop-blur-xl mb-space-lg shadow-lg relative overflow-hidden border border-outline-variant/40">
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-sm" />
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">Step Progression Controller</span>
                </div>
                <div className="flex items-center gap-space-sm">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Active Step: <span className="text-primary font-mono font-bold">{currentStep} / 5</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      setAutoStep(false);
                    }}
                    className="px-space-sm py-0.5 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface text-label-caps font-label-caps transition-all cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Step progression dots */}
              <div className="grid grid-cols-5 gap-space-xs mb-space-lg">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setCurrentStep(s)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      s <= currentStep ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  />
                ))}
              </div>

              {/* Network Node Glass Canvas */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center relative py-space-sm">
                {/* Sender Node */}
                <div className="md:col-span-4 rounded-lg bg-surface-container-high/70 p-space-md shadow-sm border border-outline-variant/40">
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label-caps text-label-caps text-primary uppercase font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">arrow_upward</span> Sender Host
                    </span>
                    <span className="text-label-caps font-label-caps px-space-xs py-0.5 rounded bg-surface-container text-secondary font-mono">
                      Win: {mode === 'violation' ? '[0, 1, 2]' : '[0, 1]'}
                    </span>
                  </div>
                  <div className="font-label-md text-label-md text-on-surface-variant mb-space-xs">Current Transmit Array:</div>
                  <div className="flex gap-1.5 items-center justify-center py-space-xs">
                    {[0, 1, 2, 3].map((slot) => {
                      const inWin = mode === 'violation' ? slot < 3 : slot < 2;
                      return (
                        <div
                          key={slot}
                          className={`w-9 h-9 rounded-lg font-mono font-bold flex items-center justify-center shadow-md transition-all ${
                            inWin
                              ? 'bg-secondary-container text-on-secondary-container scale-105'
                              : 'bg-surface-container-highest text-outline opacity-40'
                          }`}
                        >
                          {slot}
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center font-label-md text-label-md text-secondary mt-space-xs font-mono">
                    {currentStep === 1
                      ? 'Tx Burst: Frames Sent'
                      : currentStep === 2
                      ? 'All Frames In-Transit'
                      : currentStep === 3
                      ? 'Awaiting ACKs'
                      : currentStep === 4
                      ? 'ACKs Lost • Timeout F0!'
                      : 'Retransmit Old F0'}
                  </div>
                </div>

                {/* In-Flight Channel Tube */}
                <div className="md:col-span-4 flex flex-col items-center justify-center relative py-space-md">
                  <div className="w-full flex items-center justify-between px-2 font-label-caps text-label-caps text-outline mb-1">
                    <span>Forward Bus</span>
                    <span>Reverse Bus</span>
                  </div>
                  <div className="w-full h-14 rounded-full bg-surface-container-lowest relative flex items-center justify-around px-space-md overflow-hidden shadow-inner border border-outline-variant/40">
                    <div className="absolute top-2 left-0 right-0 h-1.5 bg-gradient-to-r from-secondary via-primary to-secondary opacity-60" />
                    <div className="absolute bottom-2 left-0 right-0 h-1.5 bg-gradient-to-l from-tertiary-container via-error to-surface-dim opacity-30" />

                    {/* Animated packet orb */}
                    <div className="z-10 px-2 py-0.5 rounded bg-secondary text-on-secondary font-mono text-[10px] font-bold shadow-md">
                      {currentStep <= 2 ? 'DATA #0..N →' : currentStep === 3 ? '← Lost ACKs' : 'Retransmit #0 →'}
                    </div>

                    {currentStep >= 3 && (
                      <div className="z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-caps text-label-caps font-bold shadow-lg animate-pulse">
                        <span className="material-symbols-outlined text-[14px]">bolt</span> ALL ACKs LOST
                      </div>
                    )}
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant mt-2 text-center">
                    {currentStep >= 3 ? 'Catastrophic Reverse Channel Loss' : 'Optical Wire Channel'}
                  </span>
                </div>

                {/* Receiver Node */}
                <div className="md:col-span-4 rounded-lg bg-surface-container-high/70 p-space-md shadow-sm border border-outline-variant/40">
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label-caps text-label-caps text-secondary uppercase font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">arrow_downward</span> Receiver Host
                    </span>
                    <span className="text-label-caps font-label-caps px-space-xs py-0.5 rounded bg-surface-container text-primary font-mono">
                      {currentStep >= 3
                        ? mode === 'violation'
                          ? 'Advanced: [3, 0, 1]'
                          : 'Advanced: [2, 3]'
                        : mode === 'violation'
                        ? 'Win: [0, 1, 2]'
                        : 'Win: [0, 1]'}
                    </span>
                  </div>
                  <div className="font-label-md text-label-md text-on-surface-variant mb-space-xs">Expected Frame Array:</div>
                  <div className="flex gap-1.5 items-center justify-center py-space-xs">
                    {[0, 1, 2, 3].map((slot) => {
                      const isExpected =
                        currentStep >= 3
                          ? mode === 'violation'
                            ? slot === 3 || slot === 0 || slot === 1
                            : slot === 2 || slot === 3
                          : mode === 'violation'
                          ? slot < 3
                          : slot < 2;

                      const isAmbiguous = mode === 'violation' && currentStep >= 4 && slot === 0;

                      return (
                        <div
                          key={slot}
                          className={`w-9 h-9 rounded-lg font-mono font-bold flex items-center justify-center shadow-md transition-all ${
                            isAmbiguous
                              ? 'bg-error text-on-error ring-2 ring-error animate-bounce'
                              : isExpected
                              ? 'bg-primary-container text-on-primary-container'
                              : 'bg-surface-container-highest text-outline opacity-40'
                          }`}
                        >
                          {slot}
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center font-label-md text-label-md text-primary mt-space-xs font-mono">
                    {currentStep >= 4 && mode === 'violation' ? (
                      <span className="text-error font-bold">⚠️ AMBIGUITY: Accepts Old F0 as New!</span>
                    ) : (
                      'Expected Frames Ready'
                    )}
                  </div>
                </div>
              </div>

              {/* Step Controls */}
              <div className="mt-space-md flex items-center justify-between pt-2 border-t border-outline-variant/40">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => (prev % 5) + 1)}
                    className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-fixed transition-all cursor-pointer shadow-sm"
                  >
                    Next Step Sequence
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoStep(!autoStep)}
                    className="px-4 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md transition-all cursor-pointer"
                  >
                    {autoStep ? 'Stop Auto' : 'Auto Step'}
                  </button>
                </div>
                <span className="font-mono text-[11px] text-on-surface-variant">
                  {mode === 'violation' ? 'Violation Test: 2N = 6 > M = 4' : 'Compliant Test: 2N = 4 ≤ M = 4'}
                </span>
              </div>
            </div>

            {/* Derivation Proof Panel */}
            <div className="p-space-md rounded-lg bg-surface-container-lowest/80 border border-outline-variant/40 space-y-2">
              <h4 className="font-headline-sm text-headline-sm text-on-surface">Why M ≥ 2N Holds</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Let the sender sequence space be M = 2^m. In the worst-case failure mode, the sender transmits a full window of frames S0, S1, ... S_N-1. The receiver successfully accepts all N frames and advances its window by N slots to [N, N+1, ... 2N-1 mod M].
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                If every corresponding acknowledgment is lost mid-transit, the sender times out and retransmits the original frame S0. To guarantee zero ambiguous overlap, S0 must not fall into the receiver&apos;s new window [N ... 2N-1 mod M]. This requires 2N &le; M, or equivalently N &le; M / 2.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: VIVA VOCE FLIP DECK & INSTANT QUIZ (Cols 5 on XL) */}
        <div className="xl:col-span-5 flex flex-col gap-space-lg">
          {/* Viva Voce Flip Deck */}
          <div className="w-full rounded-xl bg-surface-container/60 backdrop-blur-2xl p-space-lg shadow-2xl border border-outline-variant/40 flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">quiz</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Viva Voce Flip Deck</h3>
              </div>
              <span className="font-mono text-label-caps text-outline">
                Card {currentCardIndex + 1} of {FLIP_CARDS.length}
              </span>
            </div>

            {/* The 3D Flip Card */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full min-h-[220px] rounded-xl bg-surface-container-lowest/90 border border-outline-variant/60 p-space-lg flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-all shadow-md group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-primary-container/20 text-primary font-label-caps text-label-caps font-semibold">
                  {activeCard.category}
                </span>
                <span className="text-[10px] font-mono text-outline group-hover:text-primary transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">touch_app</span> Click to Flip
                </span>
              </div>

              <div className="py-2">
                {!isFlipped ? (
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono text-outline uppercase">QUESTION</span>
                    <h4 className="font-headline-sm text-[16px] text-on-surface font-semibold leading-snug">
                      {activeCard.question}
                    </h4>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono text-secondary uppercase font-bold">MODEL ANSWER</span>
                    <p className="font-body-sm text-[13px] text-on-surface leading-relaxed">
                      {activeCard.answer}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-outline-variant/30 pt-2 text-[11px] font-mono">
                <span className="text-secondary font-bold">{activeCard.modulo}</span>
                <span className="text-outline">{isFlipped ? 'Answer Revealed' : 'Click card to reveal model viva answer'}</span>
              </div>
            </div>

            {/* Deck Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : FLIP_CARDS.length - 1));
                  }}
                  className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-bright text-on-surface text-label-md transition-all cursor-pointer"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentCardIndex((prev) => (prev < FLIP_CARDS.length - 1 ? prev + 1 : 0));
                  }}
                  className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-bright text-on-surface text-label-md transition-all cursor-pointer"
                >
                  Next
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMasteredCards((prev) => ({
                    ...prev,
                    [currentCardIndex]: !prev[currentCardIndex],
                  }));
                }}
                className={`px-3 py-1 rounded-full font-label-md text-label-md transition-all cursor-pointer flex items-center gap-1 ${
                  masteredCards[currentCardIndex]
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {masteredCards[currentCardIndex] ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span>{masteredCards[currentCardIndex] ? 'Mastered ✓' : 'Mark Mastered'}</span>
              </button>
            </div>
          </div>

          {/* Instant Protocol Quiz */}
          <div className="w-full rounded-xl bg-surface-container/60 backdrop-blur-2xl p-space-lg shadow-2xl border border-outline-variant/40 flex flex-col gap-space-md">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">fact_check</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Instant Protocol Quiz</h3>
            </div>

            <div className="space-y-space-md">
              {QUIZ_QUESTIONS.map((q) => {
                const userAns = selectedAnswers[q.id];
                const isCorrect = userAns === q.correct;

                return (
                  <div key={q.id} className="p-space-sm rounded-lg bg-surface-container-lowest/80 border border-outline-variant/40 space-y-2">
                    <p className="font-label-lg text-label-lg text-on-surface">{q.question}</p>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userAns === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => {
                              setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                              setShowExplanations((prev) => ({ ...prev, [q.id]: true }));
                            }}
                            className={`p-2 rounded-lg text-left transition-all cursor-pointer ${
                              isSelected
                                ? isCorrect
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                                  : 'bg-error-container text-on-error-container font-bold'
                                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {showExplanations[q.id] && (
                      <p className={`text-[11px] font-body-sm p-2 rounded ${isCorrect ? 'bg-emerald-500/10 text-emerald-300' : 'bg-error/10 text-error'}`}>
                        {isCorrect ? '✓ Correct! ' : '× Incorrect. '}
                        {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
