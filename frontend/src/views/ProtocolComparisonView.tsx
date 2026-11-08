import React from 'react';
import { Scale, ArrowRight, FlaskConical, BookOpen } from 'lucide-react';
import { ViewId } from '../types/navigation';
import { ProtocolBenchmarkRunner } from '../components/comparison/ProtocolBenchmarkRunner';

interface ProtocolComparisonViewProps {
  onOpenComparisonModal: () => void;
  onNavigate: (view: ViewId) => void;
}

export const ProtocolComparisonView: React.FC<ProtocolComparisonViewProps> = ({
  onNavigate,
}) => {
  return (
    <div className="space-y-8 pb-16">
      {/* View Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 shadow-xl">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <Scale className="w-4 h-4" />
            <span>Comprehensive Protocol Benchmark &amp; Analysis</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            ARQ Protocol Architectural Comparison
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Compare Stop-and-Wait, Go-Back-N, and Selective Repeat across sliding-window boundaries,
            acknowledgement policies, buffering requirements, and theoretical throughput models.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
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

      {/* Section 1: Live Multi-Protocol Benchmark Runner */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>1. Live Multi-Protocol Performance Benchmark</span>
        </div>
        <ProtocolBenchmarkRunner />
      </div>

      {/* Section 2: Feature Comparison Matrix Table */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>2. Architectural Trade-offs &amp; Parameter Matrix</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="py-3 px-4 font-semibold">Architectural Dimension</th>
                <th className="py-3 px-4 font-semibold text-indigo-300">Stop-and-Wait ARQ</th>
                <th className="py-3 px-4 font-semibold text-cyan-300">Go-Back-N ARQ</th>
                <th className="py-3 px-4 font-semibold text-emerald-300">Selective Repeat ARQ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans">
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-semibold text-white">Sender Window Size (N)</td>
                <td className="py-3 px-4 font-mono text-indigo-400">1</td>
                <td className="py-3 px-4 font-mono text-cyan-400">&gt; 1 (e.g. 4)</td>
                <td className="py-3 px-4 font-mono text-emerald-400">&gt; 1 (e.g. 4)</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-semibold text-white">Receiver Window Size (N_rx)</td>
                <td className="py-3 px-4 font-mono text-indigo-400">1</td>
                <td className="py-3 px-4 font-mono text-cyan-400">1 (Strict in-order only)</td>
                <td className="py-3 px-4 font-mono text-emerald-400">&gt; 1 (Equal to sender N)</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-semibold text-white">Acknowledgement Policy</td>
                <td className="py-3 px-4">Individual frame ACK (0 or 1)</td>
                <td className="py-3 px-4">Cumulative ACK (acknowledges up to Rn)</td>
                <td className="py-3 px-4">Individual ACK per frame</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-semibold text-white">Retransmission Model</td>
                <td className="py-3 px-4">Retransmits single unACKed frame</td>
                <td className="py-3 px-4 text-amber-300">Bulk rewind: retransmits all N frames from Sf</td>
                <td className="py-3 px-4 text-emerald-300">Selective: retransmits ONLY timed-out frame</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-semibold text-white">Receiver Buffering</td>
                <td className="py-3 px-4 text-slate-400">No buffer needed</td>
                <td className="py-3 px-4 text-slate-400">No buffer needed (out-of-order dropped)</td>
                <td className="py-3 px-4 text-purple-300 font-semibold">Requires N frame buffer memory</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-semibold text-white">Sequence Space Constraint</td>
                <td className="py-3 px-4 font-mono text-indigo-400">M &ge; 2 (Alternating bit 0/1)</td>
                <td className="py-3 px-4 font-mono text-cyan-400">M &gt; N (e.g. M &ge; N + 1)</td>
                <td className="py-3 px-4 font-mono text-emerald-400 font-bold">M &ge; 2N (Half-Space Rule)</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-semibold text-white">Bandwidth Efficiency</td>
                <td className="py-3 px-4 text-rose-300">Poor on high-latency links</td>
                <td className="py-3 px-4 text-cyan-300">High on clean links; degrades on loss</td>
                <td className="py-3 px-4 text-emerald-300 font-semibold">Highest bandwidth efficiency under loss</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
