import React, { useEffect } from 'react';
import {
  X,
  Play,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { ProtocolType } from '@agent';
import { ViewId } from '../../types/navigation';

export interface DemoScenarioPreset {
  id: string;
  title: string;
  badge: string;
  protocol?: ProtocolType;
  targetView: ViewId;
  configUpdates?: {
    protocol?: ProtocolType;
    windowSize?: number;
    seqNumberSpace?: number;
    frameLossRate?: number;
    ackLossRate?: number;
    oneWayDelayMs?: number;
    timeoutMs?: number;
  };
  summary: string;
  talkingPoints: string[];
}

export const DEMO_PRESETS: DemoScenarioPreset[] = [
  {
    id: 'saw-deadlock',
    title: '1. Stop-and-Wait Deadlock Avoidance',
    badge: 'Stop-and-Wait ARQ',
    protocol: 'stop-and-wait',
    targetView: 'auto-sim',
    configUpdates: {
      protocol: 'stop-and-wait',
      windowSize: 1,
      seqNumberSpace: 2,
      frameLossRate: 0,
      ackLossRate: 0.35, // 35% ACK loss
      oneWayDelayMs: 60,
      timeoutMs: 360,
    },
    summary:
      'Demonstrates why naive stop-and-wait protocols deadlock on lost ACKs, and how the sender ARQ timeout timer expires to retransmit the unacknowledged frame.',
    talkingPoints: [
      'Show that sender enters AWAITING_ACK and starts a single countdown timer.',
      'Frame arrives at receiver, but ACK is dropped in the channel.',
      'Sender timer expires, breaking the potential deadlock by safely retransmitting Frame 0.',
      'Receiver detects duplicate alternating bit and discards redelivery while re-issuing ACK.',
    ],
  },
  {
    id: 'gbn-bulk-rewind',
    title: '2. Go-Back-N Window Rewind & Cascading Discard',
    badge: 'Go-Back-N (N = 4)',
    protocol: 'go-back-n',
    targetView: 'auto-sim',
    configUpdates: {
      protocol: 'go-back-n',
      windowSize: 4,
      seqNumberSpace: 8,
      frameLossRate: 0.25, // 25% Frame loss
      ackLossRate: 0,
      oneWayDelayMs: 50,
      timeoutMs: 400,
    },
    summary:
      'Shows how Go-Back-N rejects all out-of-order frames when an isolated frame is lost, triggering a full window rewind and retransmission of all subsequent frames.',
    talkingPoints: [
      'Sender pipelines 4 frames (0, 1, 2, 3) simultaneously into the channel.',
      'Frame 1 is dropped; frames 2 and 3 arrive but receiver strictly discards them because seq != Rn.',
      'Sender times out on the oldest unacknowledged base (Sf = 1).',
      'Go-Back-N rewinds Sn to Sf and retransmits all 3 frames (1, 2, 3) in bulk.',
    ],
  },
  {
    id: 'sr-buffering',
    title: '3. Selective Repeat Out-of-Order Buffering',
    badge: 'Selective Repeat (N = 4)',
    protocol: 'selective-repeat',
    targetView: 'auto-sim',
    configUpdates: {
      protocol: 'selective-repeat',
      windowSize: 4,
      seqNumberSpace: 8,
      frameLossRate: 0.25,
      ackLossRate: 0,
      oneWayDelayMs: 50,
      timeoutMs: 400,
    },
    summary:
      'Demonstrates Selective Repeat receiver-side buffering of out-of-order frames, selective single-frame retransmission, and cascading in-order payload delivery.',
    talkingPoints: [
      'Sender pipelines frames 0, 1, 2, 3; Frame 1 is dropped in transit.',
      'Receiver accepts and buffers frames 2 and 3 in its holding buffer, transmitting individual ACKs for 2 and 3.',
      'Only Frame 1 times out on the sender; sender retransmits strictly Frame 1 (no bulk rewind!).',
      'When Frame 1 arrives, the missing gap is filled, cascading delivery of 1, 2, and 3 to the application.',
    ],
  },
  {
    id: 'sequence-ambiguity',
    title: '4. Mathematical Sequence Ambiguity Breakdown (2N <= M)',
    badge: 'Mathematical Invariant',
    targetView: 'learning',
    summary:
      'Directly launches the interactive Half-Space Ambiguity demonstration showing how violating M >= 2N allows old duplicate frames to be silently accepted as new data.',
    talkingPoints: [
      'Explain the fundamental invariant: N_sender + N_receiver <= M.',
      'Walk through the 5-step failure mode: sender window slides, all ACKs lost, timeout retransmission.',
      'Show how the receiver window overlaps with the retransmitted sequence number when M=4, N=3.',
      'Contrast with guaranteed disambiguation when compliant N=2 satisfies 2N <= M.',
    ],
  },
];

interface FacultyDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchPreset: (preset: DemoScenarioPreset) => void;
}

export const FacultyDemoModal: React.FC<FacultyDemoModalProps> = ({
  isOpen,
  onClose,
  onLaunchPreset,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-guide-title"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto ring-1 ring-amber-500/20">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 id="demo-guide-title" className="text-lg font-bold text-white flex items-center gap-2">
                <span>Faculty Viva &amp; Classroom Demonstration Guide</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  4 Guided Scenarios
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ready-to-present scenarios engineered to demonstrate core flow-control concepts during lectures or examinations.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
                    {preset.badge}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    &rarr; {preset.targetView}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{preset.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{preset.summary}</p>

                {/* Key Talking Points */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Demonstration Talking Points:
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-400">
                    {preset.talkingPoints.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-400 select-none">&bull;</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => {
                  onLaunchPreset(preset);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-200 border border-amber-500/40 font-semibold text-xs transition-all cursor-pointer shadow-sm active:scale-98"
              >
                <Play className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>Launch This Scenario</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer Guidance */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>
            Shortcut Tip: Use number keys <kbd className="font-mono bg-slate-800 text-slate-300 px-1 py-0.5 rounded">1</kbd> to{' '}
            <kbd className="font-mono bg-slate-800 text-slate-300 px-1 py-0.5 rounded">7</kbd> anywhere in the app to switch views instantly.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
