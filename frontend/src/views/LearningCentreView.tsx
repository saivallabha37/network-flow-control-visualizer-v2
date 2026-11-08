import React from 'react';
import {
  GraduationCap,
  ArrowRight,
  BookOpen,
  FlaskConical,
} from 'lucide-react';
import { ViewId } from '../types/navigation';
import { SequenceAmbiguityLab } from '../components/learning/SequenceAmbiguityLab';
import { VivaQuizSection } from '../components/learning/VivaQuizSection';

interface LearningCentreViewProps {
  onNavigate: (view: ViewId) => void;
}

const TOPICS = [
  { id: 1, title: 'What is Flow Control?', category: 'Fundamentals', desc: 'Preventing a fast sender from overwhelming a slow receiver.' },
  { id: 2, title: 'What is ARQ?', category: 'Fundamentals', desc: 'Automatic Repeat reQuest error-control mechanism using ACKs and timeouts.' },
  { id: 3, title: 'Stop-and-Wait ARQ', category: 'Protocols', desc: 'Alternating bit 1-frame transmission with immediate positive acknowledgement.' },
  { id: 4, title: 'Sliding Window Mechanism', category: 'Concepts', desc: 'Pipelined flow control managing outstanding packets within capacity N.' },
  { id: 5, title: 'Go-Back-N ARQ', category: 'Protocols', desc: 'Cumulative ACKs, zero receiver buffering, and bulk retransmission on timeout.' },
  { id: 6, title: 'Selective Repeat ARQ', category: 'Protocols', desc: 'Independent ACKs, receiver-side buffering, and selective retransmissions.' },
  { id: 7, title: 'Sequence Numbers & Modulo Math', category: 'Concepts', desc: 'Addressing packets in a finite integer sequence space M = 2^m.' },
  { id: 8, title: 'Sender vs Receiver Windows', category: 'Concepts', desc: 'Tracking outstanding unACKed frames vs expected in-order frames.' },
  { id: 9, title: 'Positive ACK & NAK', category: 'Signaling', desc: 'Confirming successful delivery vs notifying missing or corrupted frames.' },
  { id: 10, title: 'Cumulative vs Individual ACKs', category: 'Signaling', desc: 'Trade-offs between resilience to ACK loss and retransmission precision.' },
  { id: 11, title: 'Frame Loss vs ACK Loss', category: 'Failures', desc: 'How timeouts and duplicate handling recover from missing data vs ACKs.' },
  { id: 12, title: 'Timeout & Retransmission', category: 'Timers', desc: 'Calculating round-trip time (RTT) and triggering retransmission timers.' },
  { id: 13, title: 'Duplicate Frames & ACKs', category: 'Edge Cases', desc: 'Detecting duplicates via sequence numbers without redelivering payloads.' },
  { id: 14, title: 'Out-of-Order Buffering', category: 'Buffering', desc: 'Holding subsequent valid frames while waiting for missing earlier frames.' },
  { id: 15, title: 'Sequence Ambiguity (Half-Space Rule)', category: 'Mathematical Invariant', desc: 'Why Selective Repeat strictly requires N <= M/2 to prevent overlap.' },
  { id: 16, title: 'Throughput & Channel Utilization', category: 'Performance', desc: 'Modeling bandwidth-delay product and utilization efficiency: N * Tf / (Tf + RTT).' },
];

export const LearningCentreView: React.FC<LearningCentreViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950/25 to-slate-900 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>Curriculum &amp; Educational Knowledge Base</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Computer Networks Flow Control Learning Centre
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Master the mathematical invariants of flow control, explore silent sequence-number ambiguity failures,
            and assess your preparation with interactive viva voce quizzes.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('manual-lab')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-950/60 cursor-pointer"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Open Manual Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Section 1: Interactive Half-Space Ambiguity Lab */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>1. The Half-Space Ambiguity Lab (2N &le; M Invariant)</span>
        </div>
        <SequenceAmbiguityLab />
      </div>

      {/* Section 2: Interactive Viva Voce Knowledge Check */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>2. Viva Voce &amp; Examination Knowledge Check</span>
        </div>
        <VivaQuizSection />
      </div>

      {/* Section 3: 16 Core Curriculum Topics Grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>3. Complete 16-Topic ARQ &amp; Flow Control Curriculum</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {TOPICS.map((topic) => (
            <div
              key={topic.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">#{topic.id}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                  {topic.category}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white">{topic.title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">{topic.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
