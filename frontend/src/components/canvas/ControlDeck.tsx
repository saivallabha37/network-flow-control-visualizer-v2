import React, { useState } from 'react';
import { ProtocolType } from '@agent';
import {
  Send,
  RotateCcw,
  XCircle,
  Clock,
  AlertTriangle,
  Zap,
  Play,
  Pause,
  StepForward,
  RefreshCw,
  ChevronRight,
  Wifi,
  Network,
  BookOpen,
} from 'lucide-react';

export interface CanvasScenario {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const CANVAS_SCENARIOS: CanvasScenario[] = [
  {
    id: 'lost-frame',
    label: 'Lost Frame',
    description: 'Drop next outgoing DATA frame to trigger timeout',
    icon: XCircle,
    color: 'rose',
  },
  {
    id: 'lost-ack',
    label: 'Lost ACK',
    description: 'Drop next incoming ACK to show sender retry',
    icon: AlertTriangle,
    color: 'amber',
  },
  {
    id: 'out-of-order',
    label: 'Out-of-Order',
    description: 'Send 2 frames then drop the first — show buffering',
    icon: Network,
    color: 'purple',
  },
  {
    id: 'window-full',
    label: 'Window Full',
    description: 'Fill window without ACKs to demonstrate backpressure',
    icon: Wifi,
    color: 'cyan',
  },
];

export interface ControlDeckProps {
  protocol: ProtocolType;
  canSend: boolean;
  canTimeout: boolean;
  remainingPayloadCount: number;
  virtualTimeMs: number;
  isAutoPlaying: boolean;
  autoPlaySpeed: number;
  channelDelayMs: number;
  dropNextFrame: boolean;
  dropNextAck: boolean;
  corruptNext: boolean;
  onSendNextFrame: () => void;
  onTriggerTimeout: () => void;
  onSetProtocol: (p: ProtocolType) => void;
  onReset: () => void;
  onStepTime: () => void;
  onToggleAutoPlay: () => void;
  onSetAutoPlaySpeed: (ms: number) => void;
  onSetChannelDelay: (ms: number) => void;
  onToggleDropNextFrame: () => void;
  onToggleDropNextAck: () => void;
  onToggleCorruptNext: () => void;
  onApplyScenario: (scenarioId: string) => void;
}

const PROTOCOLS: Array<{ id: ProtocolType; label: string; short: string }> = [
  { id: 'stop-and-wait', label: 'Stop-and-Wait', short: 'SAW' },
  { id: 'go-back-n', label: 'Go-Back-N', short: 'GBN' },
  { id: 'selective-repeat', label: 'Selective Repeat', short: 'SR' },
];

export const ControlDeck: React.FC<ControlDeckProps> = ({
  protocol,
  canSend,
  canTimeout,
  remainingPayloadCount,
  virtualTimeMs,
  isAutoPlaying,
  autoPlaySpeed,
  channelDelayMs,
  dropNextFrame,
  dropNextAck,
  corruptNext,
  onSendNextFrame,
  onTriggerTimeout,
  onSetProtocol,
  onReset,
  onStepTime,
  onToggleAutoPlay,
  onSetAutoPlaySpeed,
  onSetChannelDelay,
  onToggleDropNextFrame,
  onToggleDropNextAck,
  onToggleCorruptNext,
  onApplyScenario,
}) => {
  const [scenariosExpanded, setScenariosExpanded] = useState(false);

  return (
    <aside className="w-72 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-widest">Control Deck</span>
        </div>
        <div className="mt-1 font-mono text-[11px] text-slate-400">
          T = <span className="text-cyan-300 font-bold">{virtualTimeMs} ms</span>
          <span className="ml-3 text-slate-500">{remainingPayloadCount} frames queued</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-0 overflow-y-auto">
        {/* Protocol Selector */}
        <section className="px-4 py-3 border-b border-slate-800/60">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3 h-3" />
            Protocol
          </div>
          <div className="flex flex-col gap-1.5">
            {PROTOCOLS.map((p) => {
              const isActive = protocol === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSetProtocol(p.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/20 border-indigo-500/60 text-white ring-1 ring-indigo-500/40'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  <span>{p.label}</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-indigo-600/40 text-indigo-200' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {p.short}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Primary Actions */}
        <section className="px-4 py-3 border-b border-slate-800/60">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            Actions
          </div>
          <div className="flex flex-col gap-2">
            {/* Send Next Frame */}
            <button
              type="button"
              onClick={onSendNextFrame}
              disabled={!canSend}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-md ${
                canSend
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/60 active:scale-95'
                  : 'bg-slate-800/60 text-slate-600 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5" />
                <span>Send Next Frame</span>
              </div>
              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${canSend ? 'bg-indigo-800/60 text-indigo-200' : 'bg-slate-800 text-slate-600'}`}>
                {remainingPayloadCount} left
              </span>
            </button>

            {/* Trigger Timeout */}
            <button
              type="button"
              onClick={onTriggerTimeout}
              disabled={!canTimeout}
              title={canTimeout ? 'Force retransmission timeout for base frame' : 'No outstanding frames'}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all border cursor-pointer ${
                canTimeout
                  ? 'bg-amber-600/15 hover:bg-amber-600/25 text-amber-200 border-amber-500/40 active:scale-95'
                  : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Trigger Timeout</span>
            </button>
          </div>
        </section>

        {/* Fault Injection */}
        <section className="px-4 py-3 border-b border-slate-800/60">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Fault Injection
          </div>
          <div className="flex flex-col gap-2">
            {/* Drop Next Frame toggle */}
            <button
              type="button"
              onClick={onToggleDropNextFrame}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                dropNextFrame
                  ? 'bg-rose-600/20 border-rose-500/60 text-rose-200 ring-1 ring-rose-500/30'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <XCircle className={`w-3.5 h-3.5 ${dropNextFrame ? 'text-rose-400' : 'text-slate-500'}`} />
                <span>Drop Next DATA</span>
              </div>
              <div
                className={`w-8 h-4 rounded-full border transition-all relative ${
                  dropNextFrame ? 'bg-rose-600 border-rose-500' : 'bg-slate-800 border-slate-700'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${
                    dropNextFrame ? 'left-4' : 'left-0.5'
                  }`}
                />
              </div>
            </button>

            {/* Drop Next ACK toggle */}
            <button
              type="button"
              onClick={onToggleDropNextAck}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                dropNextAck
                  ? 'bg-amber-600/20 border-amber-500/60 text-amber-200 ring-1 ring-amber-500/30'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <XCircle className={`w-3.5 h-3.5 ${dropNextAck ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>Drop Next ACK</span>
              </div>
              <div
                className={`w-8 h-4 rounded-full border transition-all relative ${
                  dropNextAck ? 'bg-amber-600 border-amber-500' : 'bg-slate-800 border-slate-700'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${
                    dropNextAck ? 'left-4' : 'left-0.5'
                  }`}
                />
              </div>
            </button>

            {/* Corrupt Next toggle */}
            <button
              type="button"
              onClick={onToggleCorruptNext}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                corruptNext
                  ? 'bg-purple-600/20 border-purple-500/60 text-purple-200 ring-1 ring-purple-500/30'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className={`w-3.5 h-3.5 ${corruptNext ? 'text-purple-400' : 'text-slate-500'}`} />
                <span>Corrupt Checksum</span>
              </div>
              <div
                className={`w-8 h-4 rounded-full border transition-all relative ${
                  corruptNext ? 'bg-purple-600 border-purple-500' : 'bg-slate-800 border-slate-700'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${
                    corruptNext ? 'left-4' : 'left-0.5'
                  }`}
                />
              </div>
            </button>

            {/* Channel Delay Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>Channel Delay</span>
                </div>
                <span className="font-mono text-cyan-300 font-bold">{channelDelayMs} ms</span>
              </div>
              <input
                type="range"
                min={50}
                max={1000}
                step={50}
                value={channelDelayMs}
                onChange={(e) => onSetChannelDelay(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                <span>50ms</span>
                <span>1000ms</span>
              </div>
            </div>
          </div>
        </section>

        {/* Instructor Scenarios */}
        <section className="px-4 py-3 border-b border-slate-800/60">
          <button
            type="button"
            onClick={() => setScenariosExpanded((v) => !v)}
            className="w-full flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-0 cursor-pointer hover:text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              Scenarios
            </div>
            <ChevronRight
              className={`w-3 h-3 transition-transform ${scenariosExpanded ? 'rotate-90' : ''}`}
            />
          </button>

          {scenariosExpanded && (
            <div className="flex flex-col gap-1.5 mt-2">
              {CANVAS_SCENARIOS.map((sc) => {
                const Icon = sc.icon;
                const colorMap: Record<string, string> = {
                  rose: 'bg-rose-600/15 border-rose-500/40 text-rose-200 hover:bg-rose-600/25',
                  amber: 'bg-amber-600/15 border-amber-500/40 text-amber-200 hover:bg-amber-600/25',
                  purple: 'bg-purple-600/15 border-purple-500/40 text-purple-200 hover:bg-purple-600/25',
                  cyan: 'bg-cyan-600/15 border-cyan-500/40 text-cyan-200 hover:bg-cyan-600/25',
                };
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => onApplyScenario(sc.id)}
                    className={`w-full flex items-start gap-2 px-3 py-2 rounded-lg border text-xs transition-all cursor-pointer text-left ${colorMap[sc.color]}`}
                  >
                    <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold leading-tight">{sc.label}</div>
                      <div className="text-[10px] opacity-70 mt-0.5 leading-tight">{sc.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Simulation Clock Controls */}
        <section className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Simulation Clock
          </div>
          <div className="flex flex-col gap-2">
            {/* Play / Pause */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={onToggleAutoPlay}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${
                  isAutoPlaying
                    ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isAutoPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                type="button"
                onClick={onStepTime}
                disabled={isAutoPlaying}
                className="flex flex-col items-center gap-1 py-2 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200 text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <StepForward className="w-3.5 h-3.5" />
                <span>Step</span>
              </button>

              <button
                type="button"
                onClick={onReset}
                className="flex flex-col items-center gap-1 py-2 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-400 hover:text-rose-300 text-[10px] font-semibold transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Speed slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Auto-Play Speed</span>
                <span className="font-mono text-emerald-300">{autoPlaySpeed}ms/tick</span>
              </div>
              <input
                type="range"
                min={50}
                max={800}
                step={50}
                value={autoPlaySpeed}
                onChange={(e) => onSetAutoPlaySpeed(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                <span>Fast</span>
                <span>Slow</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer legend */}
      <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/40">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />ACKED</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />IN-FLIGHT</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />READY</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />BUFFERED</span>
        </div>
      </div>
    </aside>
  );
};