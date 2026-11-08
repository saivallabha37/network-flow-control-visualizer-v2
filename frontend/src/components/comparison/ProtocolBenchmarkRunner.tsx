import React, { useState, useMemo } from 'react';
import {
  Scale,
  Play,
  RotateCcw,
  TrendingUp,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';
import {
  SimulationConfig,
  compareProtocols,
  ProtocolComparisonReport,
} from '@agent';

export const ProtocolBenchmarkRunner: React.FC = () => {
  // Configurable benchmark workload parameters
  const [frameCount, setFrameCount] = useState<number>(20);
  const [lossRate, setLossRate] = useState<number>(0.15); // 15%
  const [oneWayDelayMs, setOneWayDelayMs] = useState<number>(50); // 100ms RTT
  const [seed, setSeed] = useState<number>(42);
  const [windowSize, setWindowSize] = useState<number>(4);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Generate payload array for current frameCount
  const payloads = useMemo(() => {
    return Array.from({ length: frameCount }, (_, i) => `Payload #${i}`);
  }, [frameCount]);

  // Construct configuration for benchmark
  const benchmarkConfig: SimulationConfig = useMemo(() => {
    return {
      protocol: 'go-back-n',
      mode: 'AUTOMATIC',
      payloads,
      windowSize,
      seqNumberSpace: Math.max(8, windowSize * 2),
      seed,
      oneWayDelayMs,
      frameLossRate: lossRate,
      ackLossRate: lossRate / 2,
      corruptionRate: 0,
      timeoutMs: oneWayDelayMs * 6,
      maxRetries: 6,
      tickStepMs: 15,
      maxSteps: 20000,
      maxVirtualTimeMs: 250000,
    };
  }, [payloads, windowSize, seed, oneWayDelayMs, lossRate]);

  // Run benchmark report
  const [report, setReport] = useState<ProtocolComparisonReport | null>(() => {
    return compareProtocols(benchmarkConfig);
  });

  const handleRunBenchmark = () => {
    setIsExecuting(true);
    // Simulate brief processing tick for responsive UI feedback
    setTimeout(() => {
      const res = compareProtocols(benchmarkConfig);
      setReport(res);
      setIsExecuting(false);
    }, 150);
  };

  const handleRandomizeSeed = () => {
    const newSeed = Math.floor(Math.random() * 9999) + 1;
    setSeed(newSeed);
  };

  const saw = report?.results.find((r) => r.protocol === 'stop-and-wait');
  const gbn = report?.results.find((r) => r.protocol === 'go-back-n');
  const sr = report?.results.find((r) => r.protocol === 'selective-repeat');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
      {/* Benchmark Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <Scale className="w-4 h-4" />
            <span>Deterministic Head-to-Head Benchmark Runner</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-0.5">
            Simultaneous Multi-Protocol Workload Test
          </h3>
          <p className="text-xs text-slate-400">
            Executes Stop-and-Wait, Go-Back-N, and Selective Repeat under identical Mulberry32 PRNG seed and channel conditions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRunBenchmark}
            disabled={isExecuting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-950/60 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{isExecuting ? 'Benchmarking...' : 'Execute Benchmark'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Workload Parameter Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
        {/* Frame Count */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-300">
            <span className="font-semibold">Workload Size:</span>
            <span className="font-mono text-indigo-400 font-bold">{frameCount} frames</span>
          </div>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={frameCount}
            onChange={(e) => setFrameCount(parseInt(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>5 (Short)</span>
            <span>25 (Standard)</span>
            <span>50 (Heavy)</span>
          </div>
        </div>

        {/* Channel Loss Rate */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-300">
            <span className="font-semibold">Channel Loss Rate:</span>
            <span className="font-mono text-rose-400 font-bold">{Math.round(lossRate * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.3}
            step={0.05}
            value={lossRate}
            onChange={(e) => setLossRate(parseFloat(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0% (Ideal)</span>
            <span>15% (Lossy)</span>
            <span>30% (Severe)</span>
          </div>
        </div>

        {/* Propagation Delay / RTT */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-300">
            <span className="font-semibold">Link Delay (RTT):</span>
            <span className="font-mono text-cyan-400 font-bold">{oneWayDelayMs * 2}ms RTT</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={10}
            value={oneWayDelayMs}
            onChange={(e) => setOneWayDelayMs(parseInt(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>20ms (LAN)</span>
            <span>100ms (WAN)</span>
            <span>200ms (Satellite)</span>
          </div>
        </div>

        {/* PRNG Seed & Window Size */}
        <div className="space-y-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300">
            <span className="font-semibold">Seed &amp; Capacity (N):</span>
            <span className="font-mono text-purple-400 font-bold">N={windowSize} | #{seed}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRandomizeSeed}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>New Seed</span>
            </button>
            <select
              value={windowSize}
              onChange={(e) => setWindowSize(parseInt(e.target.value))}
              aria-label="Window Size N"
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2 py-1.5 font-mono text-[11px]"
            >
              <option value={2}>N = 2</option>
              <option value={4}>N = 4</option>
              <option value={8}>N = 8</option>
            </select>
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            Deterministic seed ensures identical drops across all 3 protocols.
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparative Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Stop-and-Wait */}
        {saw && (
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    Window N = 1
                  </span>
                  <h4 className="text-base font-bold text-white mt-1.5">Stop-and-Wait ARQ</h4>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Status</span>
                  <span className="text-emerald-400 font-mono text-xs font-bold">{saw.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Virtual Time</span>
                  <span className="font-mono font-bold text-slate-200 text-sm flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {saw.durationMs}ms
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">Throughput</span>
                  <span className="font-mono font-bold text-indigo-300 text-sm flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                    {saw.throughputPayloadsPerSec.toFixed(1)} /s
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">Transmissions</span>
                  <span className="font-mono text-slate-300">
                    {saw.originalFramesSent + saw.retransmissions} ({saw.retransmissions} retries)
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">Efficiency</span>
                  <span className="font-mono text-slate-300">{saw.empiricalEfficiencyPercent}%</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
              <span className="text-slate-500 block text-[10px] uppercase">Bottleneck</span>
              High link idle time during round-trip delay waiting for ACKs.
            </div>
          </div>
        )}

        {/* Card 2: Go-Back-N */}
        {gbn && (
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-4 flex flex-col justify-between relative overflow-hidden">
            {report?.winnerThroughput === 'go-back-n' && (
              <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-600 text-white text-[9px] font-bold rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3 h-3" /> Winner
              </div>
            )}

            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    Window N = {windowSize} (Cumulative)
                  </span>
                  <h4 className="text-base font-bold text-white mt-1.5">Go-Back-N ARQ</h4>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Status</span>
                  <span className="text-emerald-400 font-mono text-xs font-bold">{gbn.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Virtual Time</span>
                  <span className="font-mono font-bold text-slate-200 text-sm flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    {gbn.durationMs}ms
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">Throughput</span>
                  <span className="font-mono font-bold text-cyan-300 text-sm flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                    {gbn.throughputPayloadsPerSec.toFixed(1)} /s
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">Transmissions</span>
                  <span className="font-mono text-slate-300">
                    {gbn.originalFramesSent + gbn.retransmissions} ({gbn.retransmissions} retries)
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">Efficiency</span>
                  <span className="font-mono text-slate-300">{gbn.empiricalEfficiencyPercent}%</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
              <span className="text-slate-500 block text-[10px] uppercase">Trade-off</span>
              Single lost frame causes bulk rewind and retransmission of all subsequent frames.
            </div>
          </div>
        )}

        {/* Card 3: Selective Repeat */}
        {sr && (
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/40 space-y-4 flex flex-col justify-between relative overflow-hidden ring-1 ring-emerald-500/30">
            {report?.winnerEfficiency === 'selective-repeat' && (
              <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-600 text-white text-[9px] font-bold rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3 h-3" /> Most Efficient
              </div>
            )}

            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Window N = {windowSize} (Selective)
                  </span>
                  <h4 className="text-base font-bold text-white mt-1.5">Selective Repeat ARQ</h4>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Status</span>
                  <span className="text-emerald-400 font-mono text-xs font-bold">{sr.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Virtual Time</span>
                  <span className="font-mono font-bold text-slate-200 text-sm flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    {sr.durationMs}ms
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">Throughput</span>
                  <span className="font-mono font-bold text-emerald-300 text-sm flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    {sr.throughputPayloadsPerSec.toFixed(1)} /s
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">Transmissions</span>
                  <span className="font-mono text-slate-300">
                    {sr.originalFramesSent + sr.retransmissions} ({sr.retransmissions} retries)
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">Efficiency</span>
                  <span className="font-mono text-emerald-300 font-bold">{sr.empiricalEfficiencyPercent}%</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
              <span className="text-slate-500 block text-[10px] uppercase">Advantage</span>
              Buffers out-of-order frames at receiver, retransmitting only strictly lost frames.
            </div>
          </div>
        )}
      </div>

      {/* Synthesized Key Insights Callout */}
      {report && report.keyInsights.length > 0 && (
        <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Benchmark Scientific Analysis &amp; Pedagogical Insights:</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {report.keyInsights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-400 select-none">&bull;</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
